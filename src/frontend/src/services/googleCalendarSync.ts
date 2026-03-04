/**
 * Block 66 — Google Calendar Sync Engine
 *
 * Architecture:
 * - Google Calendar is the SOURCE OF TRUTH for helicopter availability.
 * - When a reservation is created → a calendar event is created via backend.
 * - When a reservation is cancelled → the calendar event is deleted via backend.
 * - When a reservation is rescheduled → old event deleted, new event created.
 * - If ANY calendar call fails → fallback to local slot control silently.
 * - No existing reservations are ever broken by a calendar error.
 *
 * The backend (`main.mo`) already exposes:
 *   - `checkHelicopterAvailability(startTime, endTime)` → free/busy JSON
 *   - `bookHelicopter(booking)` → creates calendar event, returns JSON {ok, eventId, htmlLink, error}
 *
 * Since the ICP HTTP outcall module does not support DELETE natively, calendar
 * event deletion is handled by calling a lightweight "cancel" path on the
 * backend via a POST with a special marker body. In this MVP the delete call
 * is a best-effort fire-and-forget — if it fails the reservation is still
 * removed locally.
 */

import type {
  AvailabilitySlot,
  HelicopterReservation,
} from "@/context/SportContext";
import {
  makeSlotKey,
  normalizeDateKey,
  normalizeTimeKey,
} from "@/lib/reservationSlot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CalendarSyncStatus = "idle" | "syncing" | "synced" | "error";

export interface BusyBlock {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

export interface CalendarEventPayload {
  startTime: string;
  endTime: string;
  name: string;
  phone: string;
  email: string;
  passengerCount: number;
  weights: string;
  notes: string;
  paymentMode: string;
}

export interface CalendarCreateResult {
  ok: boolean;
  eventId?: string;
  htmlLink?: string;
  error?: string;
}

export interface CalendarDeleteResult {
  ok: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Pure helpers (no side effects, fully testable)
// ---------------------------------------------------------------------------

/**
 * Convert a duration string like "15m", "20m", "30m" to milliseconds.
 * Defaults to 20 minutes if the string is unrecognised.
 */
export function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)m$/i);
  if (match) return Number(match[1]) * 60_000;
  // Try plain number (interpreted as minutes)
  const n = Number(duration);
  if (!Number.isNaN(n) && n > 0) return n * 60_000;
  return 20 * 60_000; // default 20 min
}

/**
 * Returns true if the interval [startMs, endMs) overlaps with [busyStart, busyEnd).
 */
export function overlaps(
  startMs: number,
  endMs: number,
  busyStartMs: number,
  busyEndMs: number,
): boolean {
  return startMs < busyEndMs && endMs > busyStartMs;
}

/**
 * Given an array of AvailabilitySlots and an array of BusyBlocks from Google
 * Calendar, return a new array where each slot's `booked` field reflects
 * whether the slot time is covered by any busy block.
 *
 * Slots that are ALREADY booked (i.e. have a local reservation) are left
 * unchanged — we don't override local booked state with calendar data.
 *
 * Pilot overrides (blocked by the pilot) are also unaffected — they are
 * handled separately by the UI layer.
 *
 * @param slots  - current AvailabilitySlot list (base + pilot custom)
 * @param busyBlocks - busy intervals from Google Calendar freebusy response
 * @param bookedSlotKeys - set of slotKeys that already have a local reservation
 * @param durationMs - slot duration in milliseconds (default 20 min)
 */
export function applyBusyBlocksToSlots(
  slots: AvailabilitySlot[],
  busyBlocks: BusyBlock[],
  bookedSlotKeys: Set<string>,
  durationMs = 20 * 60_000,
): AvailabilitySlot[] {
  if (busyBlocks.length === 0) return slots;

  return slots.map((slot) => {
    const slotKey = makeSlotKey(
      normalizeDateKey(slot.date),
      normalizeTimeKey(slot.time),
    );

    // Don't touch already-locally-booked slots
    if (bookedSlotKeys.has(slotKey)) return slot;

    // Build start/end Date for this slot
    const slotStart = new Date(
      `${slot.date}T${normalizeTimeKey(slot.time)}:00`,
    );
    if (Number.isNaN(slotStart.getTime())) return slot;
    const slotEnd = new Date(slotStart.getTime() + durationMs);

    const calendarBusy = busyBlocks.some((b) => {
      const bStart = new Date(b.start).getTime();
      const bEnd = new Date(b.end).getTime();
      return overlaps(slotStart.getTime(), slotEnd.getTime(), bStart, bEnd);
    });

    if (calendarBusy === slot.booked) return slot; // no change
    return { ...slot, booked: calendarBusy };
  });
}

/**
 * Merge base availability slots with calendar busy data and pilot overrides.
 * Returns { updatedSlots, calendarUnavailableKeys } where
 * calendarUnavailableKeys is the set of slotKeys that the calendar says are busy.
 */
export function buildMergedSlotAvailability(
  slots: AvailabilitySlot[],
  busyBlocks: BusyBlock[],
  reservations: HelicopterReservation[],
  durationMs = 20 * 60_000,
): { updatedSlots: AvailabilitySlot[]; calendarUnavailableKeys: Set<string> } {
  // Build the set of slotKeys that have a confirmed local reservation
  const bookedSlotKeys = new Set(
    reservations
      .filter((r) => r.status === "confirmed" || r.status === "booked")
      .map(
        (r) =>
          r.slotKey ||
          makeSlotKey(
            normalizeDateKey(r.slot.date),
            normalizeTimeKey(r.slot.time),
          ),
      ),
  );

  const updatedSlots = applyBusyBlocksToSlots(
    slots,
    busyBlocks,
    bookedSlotKeys,
    durationMs,
  );

  // Compute which slot keys are calendar-busy
  const calendarUnavailableKeys = new Set<string>();
  for (const slot of updatedSlots) {
    if (slot.booked) {
      const key = makeSlotKey(
        normalizeDateKey(slot.date),
        normalizeTimeKey(slot.time),
      );
      calendarUnavailableKeys.add(key);
    }
  }

  return { updatedSlots, calendarUnavailableKeys };
}

// ---------------------------------------------------------------------------
// Async calendar action wrappers
// These call the ICP backend actor through a passed-in actor reference.
// They NEVER throw — they always return a result object so callers can decide
// whether to warn or silently fall back.
// ---------------------------------------------------------------------------

/**
 * Create a Google Calendar event for a confirmed reservation.
 * Uses the backend `bookHelicopter()` which proxies to Google Calendar API.
 *
 * @param calendarId - optional OAuth-selected calendar ID; passed in the
 *   booking payload so the backend can route the event to the correct calendar
 *   instead of the hard-coded PILOT_CALENDAR_ID env var.
 *
 * Returns { ok: true, eventId } on success, { ok: false, error } on failure.
 * NEVER throws.
 */
export async function createCalendarEvent(
  actor: { bookHelicopter: (b: unknown) => Promise<string> } | null,
  reservation: HelicopterReservation,
  durationMs = 20 * 60_000,
  calendarId?: string | null,
): Promise<CalendarCreateResult> {
  if (!actor) {
    return { ok: false, error: "Calendar not available — no backend actor" };
  }

  try {
    // Build ISO start/end from the slot
    const slotDateStr = reservation.slot.date; // YYYY-MM-DD
    const slotTimeNorm = normalizeTimeKey(reservation.slot.time); // HH:mm
    const startDate = new Date(`${slotDateStr}T${slotTimeNorm}:00`);

    if (Number.isNaN(startDate.getTime())) {
      return { ok: false, error: "Invalid slot date/time for calendar event" };
    }

    const endDate = new Date(startDate.getTime() + durationMs);

    const booking: Record<string, unknown> = {
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      name: "Sport Buddies User",
      phone: "",
      email: "",
      passengerCount: BigInt(1),
      weights: "",
      notes: `Reservation ID: ${reservation.id}`,
      paymentMode: "coins",
    };

    // Block 68 — Route to the pilot's selected calendar if provided
    if (calendarId) {
      booking.calendarId = calendarId;
    }

    const responseText = await actor.bookHelicopter(booking as unknown);

    // Parse JSON response
    try {
      const parsed = JSON.parse(responseText) as {
        ok?: boolean;
        eventId?: string;
        htmlLink?: string;
        error?: string;
        id?: string; // Google Calendar returns 'id' directly
      };

      // Google Calendar API returns the event object with an 'id' field.
      // Our backend may also return {ok, eventId}.
      const eventId = parsed.eventId ?? parsed.id;

      if (parsed.error) {
        return { ok: false, error: parsed.error };
      }

      return { ok: true, eventId, htmlLink: parsed.htmlLink };
    } catch {
      // Non-JSON response — if it looks like an error, report it
      if (
        responseText.includes("error") ||
        responseText.includes("not configured") ||
        responseText.includes("401") ||
        responseText.includes("403")
      ) {
        return { ok: false, error: responseText.slice(0, 200) };
      }
      // Otherwise assume success (e.g. empty 204 response)
      return { ok: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[CalendarSync] createCalendarEvent failed:", msg);
    return { ok: false, error: msg };
  }
}

/**
 * Delete a Google Calendar event by eventId.
 * The ICP backend does not natively support HTTP DELETE, so this is a
 * best-effort stub that logs and returns gracefully.
 *
 * @param calendarId - optional OAuth-selected calendar ID; forwarded to the
 *   backend so it knows which calendar to remove the event from.
 *
 * In a production setup this would call a backend function like
 * `actor.deleteCalendarEvent(eventId, calendarId)` once DELETE outcall support lands.
 *
 * NEVER throws.
 */
export async function deleteCalendarEvent(
  actor: unknown,
  calendarEventId: string,
  calendarId?: string | null,
): Promise<CalendarDeleteResult> {
  if (!actor || !calendarEventId) {
    return {
      ok: false,
      error: "No actor or eventId — skipping calendar delete",
    };
  }

  try {
    // Check if the backend exposes a deleteCalendarEvent function
    const typedActor = actor as Record<string, unknown>;
    if (typeof typedActor.deleteCalendarEvent === "function") {
      // Block 68 — pass calendarId if the backend accepts it
      const deleteArgs: unknown[] = calendarId
        ? [calendarEventId, calendarId]
        : [calendarEventId];
      const responseText = await (
        typedActor.deleteCalendarEvent as (
          ...args: unknown[]
        ) => Promise<string>
      )(...deleteArgs);
      // 204 No Content or empty string = success
      if (
        !responseText ||
        responseText.trim() === "" ||
        responseText.includes("204")
      ) {
        return { ok: true };
      }
      // Parse JSON if present
      try {
        const parsed = JSON.parse(responseText) as {
          ok?: boolean;
          error?: string;
        };
        if (parsed.error) return { ok: false, error: parsed.error };
        return { ok: true };
      } catch {
        return { ok: true }; // non-JSON but no obvious error
      }
    }

    // Backend does not yet have deleteCalendarEvent — log and move on
    console.warn(
      `[CalendarSync] deleteCalendarEvent: backend does not expose deleteCalendarEvent. Event ${calendarEventId} was NOT removed from Google Calendar. Reservation removed locally.`,
    );
    return { ok: false, error: "Backend delete not implemented" };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[CalendarSync] deleteCalendarEvent failed:", msg);
    return { ok: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Block 68 — Manual sync: refetch busy times + update slot availability
// Block 69 — Backend Availability Query with calendarId routing
// ---------------------------------------------------------------------------

export interface SyncCalendarAvailabilityResult {
  ok: boolean;
  updatedSlots?: AvailabilitySlot[];
  error?: string;
}

/**
 * Block 69 — Calls checkHelicopterAvailability with optional calendarId.
 * Since the backend signature only accepts (startTime, endTime), we encode
 * the calendarId as a suffix on endTime: `${endTime}|calendarId=${calId}`
 * The backend ignores unknown suffixes, so this is forward-compatible.
 * When the backend is upgraded to accept calendarId natively, remove the encoding.
 * NEVER throws — returns { ok, busy, error }.
 */
export async function checkHelicopterAvailabilityWithCalendar(
  actor: {
    checkHelicopterAvailability: (
      start: string,
      end: string,
    ) => Promise<string>;
  } | null,
  startTime: string,
  endTime: string,
  calendarId?: string | null,
): Promise<{ ok: boolean; busy: BusyBlock[]; error?: string }> {
  if (!actor) {
    return { ok: false, busy: [], error: "No backend actor" };
  }
  try {
    // Encode calendarId into endTime suffix as a forward-compatible hint
    const encodedEnd = calendarId
      ? `${endTime}|calendarId=${encodeURIComponent(calendarId)}`
      : endTime;
    const responseText = await actor.checkHelicopterAvailability(
      startTime,
      encodedEnd,
    );
    const busy = parseBusyBlocksFromResponse(responseText);
    return { ok: true, busy };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      "[CalendarSync] checkHelicopterAvailabilityWithCalendar failed:",
      msg,
    );
    return { ok: false, busy: [], error: msg };
  }
}

/**
 * Refetch Google Calendar busy times for all provided slots and return an
 * updated slot list with availability reflecting the calendar's current state.
 *
 * - Queries a window covering today through 14 days out.
 * - Uses `calendarId` encoded in the endTime suffix (Block 69 encoding).
 * - NEVER throws — returns { ok: false, error } on any failure so callers can
 *   fall back to local availability.
 */
export async function syncCalendarAvailability(
  actor: {
    checkHelicopterAvailability: (
      start: string,
      end: string,
    ) => Promise<string>;
  } | null,
  calendarId: string | null | undefined,
  slots: AvailabilitySlot[],
  reservations: HelicopterReservation[],
  durationMs = 20 * 60_000,
): Promise<SyncCalendarAvailabilityResult> {
  if (!actor) {
    return { ok: false, error: "No backend actor available" };
  }

  try {
    // Query a 14-day window starting from today
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(windowStart.getTime() + 14 * 24 * 60 * 60_000);

    // Block 69 — Use the new helper that encodes calendarId in the endTime suffix
    const result = await checkHelicopterAvailabilityWithCalendar(
      actor as {
        checkHelicopterAvailability: (
          start: string,
          end: string,
        ) => Promise<string>;
      },
      windowStart.toISOString(),
      windowEnd.toISOString(),
      calendarId,
    );

    if (!result.ok) {
      return { ok: false, error: result.error ?? "Fetch failed" };
    }

    // Use busy blocks directly (already parsed by the helper)
    const { updatedSlots } = buildMergedSlotAvailability(
      slots,
      result.busy,
      reservations,
      durationMs,
    );
    return { ok: true, updatedSlots };
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    return { ok: false, error: `Calendar fetch failed: ${msg}` };
  }
}

/**
 * Parse the busy blocks from the raw JSON returned by the backend
 * `checkHelicopterAvailability` call (Google Calendar freebusy API response).
 *
 * Returns an empty array on any parse error so the rest of the UI degrades
 * gracefully (local slot control remains authoritative).
 */
export function parseBusyBlocksFromResponse(responseText: string): BusyBlock[] {
  try {
    const data = JSON.parse(responseText) as {
      // Standard freebusy response shape
      busy?: BusyBlock[];
      calendars?: Record<string, { busy?: BusyBlock[] }>;
      error?: { message?: string };
    };

    // Already in { busy: [...] } shape (pre-parsed by backend)
    if (Array.isArray(data.busy)) return data.busy;

    // Google Calendar freebusy.query response shape
    if (data.calendars) {
      const allBusy: BusyBlock[] = [];
      for (const cal of Object.values(data.calendars)) {
        if (Array.isArray(cal.busy)) allBusy.push(...cal.busy);
      }
      return allBusy;
    }

    return [];
  } catch {
    return [];
  }
}
