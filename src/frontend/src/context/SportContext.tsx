import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useGoogleOAuth } from "../hooks/useGoogleOAuth";
import { usePresenceEngine } from "../hooks/usePresenceEngine";
import type { PresenceRecord } from "../lib/presenceEngine";
import {
  makeSlotKey,
  normalizeDateKey,
  normalizeTimeKey,
} from "../lib/reservationSlot";
import type { CalendarSyncStatus } from "../services/googleCalendarSync";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  syncCalendarAvailability,
} from "../services/googleCalendarSync";
import type {
  OAuthCalendarInfo,
  OAuthConnectionState,
} from "../services/googleOAuth";

export type SportStatus = "inactive" | "active";
export type UserMode = "normal" | "buddy_finder";
export type EventStatus = "active" | "completed" | "canceled";
export type EmergencyState =
  | "idle"
  | "armed"
  | "triggered"
  | "escalated"
  | "rescue"
  | "resolved";

export interface Participant {
  id: string;
  name: string;
}

export interface SportEvent {
  id: string;
  title: string;
  sport: string;
  datetimeLabel: string;
  locationLabel: string;
  hostId: string;
  hostName: string;
  capacity: number;
  participants: Participant[];
  status: EventStatus;
}

export interface CurrentUser {
  id: string;
  name: string;
}

const CURRENT_USER: CurrentUser = { id: "me", name: "You" };

// Block 58 — Mock availability slots (replace with Google Calendar data later)
const AVAILABILITY_SLOTS: AvailabilitySlot[] = [
  { id: "1", date: "2026-03-05", time: "10:00 AM", booked: false },
  { id: "2", date: "2026-03-05", time: "1:00 PM", booked: false },
  { id: "3", date: "2026-03-06", time: "11:00 AM", booked: false },
];

// Block 65 — Base slot keys (used to detect which slots are base vs. pilot-added)
export const BASE_SLOT_IDS = new Set(AVAILABILITY_SLOTS.map((s) => s.id));

const INITIAL_EVENTS: SportEvent[] = [
  {
    id: "evt-1",
    title: "Sunday Soccer Pickup",
    sport: "Soccer",
    datetimeLabel: "Sun Feb 28 · 10:00 AM",
    locationLabel: "Central Park",
    hostId: "host-1",
    hostName: "Chris",
    capacity: 16,
    participants: [
      { id: "p1", name: "Alex R." },
      { id: "p2", name: "Jordan M." },
      { id: "p3", name: "Maria G." },
      { id: "p4", name: "Chris E." },
    ],
    status: "active",
  },
  {
    id: "evt-2",
    title: "Basketball 3v3",
    sport: "Basketball",
    datetimeLabel: "Sat Feb 27 · 2:00 PM",
    locationLabel: "Riverside Courts",
    hostId: "host-2",
    hostName: "Taylor",
    capacity: 6,
    participants: [
      { id: "p5", name: "Jordan B." },
      { id: "p6", name: "Tyler W." },
      { id: "p7", name: "Sam K." },
    ],
    status: "active",
  },
  {
    id: "evt-3",
    title: "Morning Run Club",
    sport: "Running",
    datetimeLabel: "Mon Mar 1 · 7:00 AM",
    locationLabel: "Waterfront Trail",
    hostId: "me",
    hostName: "You",
    capacity: 30,
    participants: [
      { id: "p8", name: "Emma W." },
      { id: "p9", name: "Ryan C." },
      { id: "p10", name: "Olivia M." },
      { id: "p11", name: "James W." },
      { id: "p12", name: "Ava D." },
    ],
    status: "active",
  },
  {
    id: "evt-4",
    title: "Tennis Doubles",
    sport: "Tennis",
    datetimeLabel: "Tue Mar 2 · 6:00 PM",
    locationLabel: "City Tennis Club",
    hostId: "host-3",
    hostName: "Anna",
    capacity: 4,
    participants: [
      { id: "p13", name: "Anna C." },
      { id: "p14", name: "Ben P." },
      { id: "p15", name: "Carol K." },
    ],
    status: "active",
  },
  {
    id: "evt-5",
    title: "Yoga in the Park",
    sport: "Yoga",
    datetimeLabel: "Wed Mar 3 · 8:00 AM",
    locationLabel: "Riverside Park",
    hostId: "host-4",
    hostName: "Zoe",
    capacity: 25,
    participants: [
      { id: "p16", name: "Zoe L." },
      { id: "p17", name: "Lily M." },
      { id: "p18", name: "Grace T." },
    ],
    status: "active",
  },
];

// Safe localStorage helpers
function safeGetItem(key: string, defaultValue: string): string {
  try {
    if (typeof window === "undefined" || !window.localStorage)
      return defaultValue;
    return localStorage.getItem(key) ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // Silently fail
  }
}

function loadAttendedEventIds(): string[] {
  try {
    const stored = safeGetItem("attendedEventIds", "[]");
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface CoreState {
  coins?: number;
  trustScore?: number;
  eventsAttendedCount?: number;
  eventsHostedCount?: number;
  currentSport?: string | null;
  sportStatus?: SportStatus;
  events?: SportEvent[];
  profileCompleted?: boolean;
  helicopterReservations?: HelicopterReservation[];
  // Block 65 — Pilot Calendar Authority
  pilotSlots?: AvailabilitySlot[];
  pilotOverrides?: string[]; // array of slotKeys that are pilot-blocked
  // Block 67 — Google Calendar OAuth
  oauthSelectedCalendarId?: string | null;
}

function loadCoreState(): CoreState {
  try {
    const stored = safeGetItem("SPORT_BUDDIES_CORE", "{}");
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveCoreState(data: CoreState): void {
  safeSetItem("SPORT_BUDDIES_CORE", JSON.stringify(data));
}

function loadLocationEnabled(): boolean {
  const stored = safeGetItem("sportbuddies_location_enabled", "true");
  return stored !== "false";
}

function loadUserMode(): UserMode {
  const stored = safeGetItem("sportbuddies_user_mode", "normal");
  return stored === "buddy_finder" ? "buddy_finder" : "normal";
}

// Helicopter Reservation types (Block 58)
export interface AvailabilitySlot {
  id: string;
  date: string;
  time: string;
  booked: boolean;
  isPilotSlot?: boolean; // Block 65 — true for pilot-added custom slots
}

export interface HelicopterReservation {
  id: string;
  slot: AvailabilitySlot;
  userId: string;
  status: "confirmed" | "booked";
  slotKey: string; // Block 64 — normalised "YYYY-MM-DDTHH:mm" for conflict checks
  createdAt: number;
  updatedAt?: number;
  // Block 66 — Google Calendar event ID (optional; absent for pre-sync reservations)
  calendarEventId?: string;
  calendarSynced?: boolean; // true when the calendar event was successfully created
}

export type SportContextType = {
  // Sport state
  sportStatus: SportStatus;
  currentSport: string | null;
  activateSport: (sport: string) => void;
  deactivateSport: () => void;

  // User mode
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;

  // Location
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  toggleLocation: () => void;

  // Emergency state (Block 47 / Block 51)
  emergencyState: EmergencyState;
  emergencyLevel: number;
  emergencySnapshot: {
    sport: string | null;
    mode: string;
    timestamp: number;
  } | null;
  armEmergency: () => void;
  triggerEmergency: () => void;
  resolveEmergency: () => void;

  // Current user
  currentUser: CurrentUser;

  // Events
  events: SportEvent[];
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  completeEvent: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;

  // Attendance
  attendedEventIds: string[];
  hasAttended: (eventId: string) => boolean;
  markAttended: (eventId: string) => void;

  // Trust Score (Block 50)
  eventsAttendedCount: number;
  eventsHostedCount: number;
  trustScore: number;

  // Profile Completion Gate (Block 57)
  profileCompleted: boolean;
  setProfileCompleted: (completed: boolean) => void;

  // Helicopter Reservations (Block 58 / 64)
  availabilitySlots: AvailabilitySlot[];
  helicopterReservations: HelicopterReservation[];
  reserveHelicopter: (
    slot: AvailabilitySlot,
  ) => { ok: true } | { ok: false; error: string };
  rescheduleHelicopter: (
    reservationId: string,
    newSlot: AvailabilitySlot,
  ) => { ok: true } | { ok: false; error: string };
  cancelHelicopterReservation: (reservationId: string) => void;
  selectedSlot: AvailabilitySlot | null;
  setSelectedSlot: (slot: AvailabilitySlot | null) => void;
  // Block 64 — slot conflict guard helpers (exposed for page use)
  isSlotTaken: (
    dateKey: string,
    timeKey: string,
    ignoreReservationId?: string,
  ) => boolean;
  assertSlotAvailable: (
    dateKey: string,
    timeKey: string,
    ignoreId?: string,
  ) => { ok: true } | { ok: false; reason: string };

  // Block 65 — Pilot Calendar Authority
  pilotSlots: AvailabilitySlot[];
  pilotOverrides: Set<string>;
  setPilotOverride: (slotKey: string, blocked: boolean) => void;
  addPilotSlot: (date: string, time: string) => void;
  removePilotSlot: (slotId: string) => void;

  // Block 66 — Google Calendar Sync Engine
  calendarSyncStatus: CalendarSyncStatus;
  lastCalendarSync: number | null;
  // Inject the backend actor for calendar calls (called from HelicopterPage)
  setCalendarActor: (actor: unknown) => void;

  // Block 67 — Google Calendar OAuth
  oauthConnectionState: OAuthConnectionState;
  oauthCalendars: OAuthCalendarInfo[];
  oauthSelectedCalendarId: string | null;
  oauthConnectedAt: number | null;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => void;
  selectOAuthCalendar: (calendarId: string) => void;

  // Block 68 — Manual sync: refetch busy times + update slot availability
  syncNow: () => Promise<void>;

  // Block 70 — Sport Activation Presence Engine
  myPresence: PresenceRecord | null;
  isPresenceActive: boolean;
  refreshPresence: () => void;
  expirePresence: () => void;
};

const SportContext = createContext<SportContextType | undefined>(undefined);

// Inner provider that has access to useCoinBalance
function SportProviderInner({ children }: { children: React.ReactNode }) {
  const _core = loadCoreState();
  const [sportStatus, setSportStatus] = useState<SportStatus>(
    (_core.sportStatus as SportStatus) || "inactive",
  );
  const [currentSport, setCurrentSport] = useState<string | null>(
    _core.currentSport ?? null,
  );
  const [userMode, setUserModeState] = useState<UserMode>(loadUserMode);
  const [locationEnabled, setLocationEnabledState] =
    useState<boolean>(loadLocationEnabled);
  const [events, setEvents] = useState<SportEvent[]>(
    Array.isArray(_core.events) && _core.events.length > 0
      ? _core.events
      : INITIAL_EVENTS,
  );
  const [attendedEventIds, setAttendedEventIds] =
    useState<string[]>(loadAttendedEventIds);

  // Trust Score state (Block 50) — loaded from persisted core
  const [eventsAttendedCount, setEventsAttendedCount] = useState(
    _core.eventsAttendedCount ?? 0,
  );
  const [eventsHostedCount, setEventsHostedCount] = useState(
    _core.eventsHostedCount ?? 0,
  );
  const [trustScore, setTrustScore] = useState(_core.trustScore ?? 0);

  // Profile Completion Gate (Block 57)
  const [profileCompleted, setProfileCompleted] = useState<boolean>(
    _core.profileCompleted ?? false,
  );

  // Block 68 — availabilitySlots is now state so syncNow can update it
  const [availabilitySlots, setAvailabilitySlots] =
    useState<AvailabilitySlot[]>(AVAILABILITY_SLOTS);

  // Helicopter Reservations (Block 58 / Block 60 / Block 64 — loaded from persisted core)
  // Block 64 — Hydration guard: rebuild slotKey for any legacy records that lack it,
  // and ensure status defaults to "confirmed" (active) for all loaded records.
  const [helicopterReservations, setHelicopterReservations] = useState<
    HelicopterReservation[]
  >(() => {
    if (!Array.isArray(_core.helicopterReservations)) return [];
    return _core.helicopterReservations.map((r) => {
      const needsSlotKey = !r.slotKey;
      if (needsSlotKey) {
        const dateKey = normalizeDateKey(r.slot.date);
        const timeKey = normalizeTimeKey(r.slot.time);
        return {
          ...r,
          slotKey: makeSlotKey(dateKey, timeKey),
          status: (r.status ?? "confirmed") as "confirmed" | "booked",
        };
      }
      return {
        ...r,
        status: (r.status ?? "confirmed") as "confirmed" | "booked",
      };
    });
  });
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );

  // Block 65 — Pilot Calendar Authority: custom slots + override set
  const [pilotSlots, setPilotSlots] = useState<AvailabilitySlot[]>(() => {
    if (!Array.isArray(_core.pilotSlots)) return [];
    return _core.pilotSlots;
  });
  const [pilotOverrides, setPilotOverridesState] = useState<Set<string>>(() => {
    if (!Array.isArray(_core.pilotOverrides)) return new Set();
    return new Set(_core.pilotOverrides);
  });

  // Block 70 — Sport Activation Presence Engine
  const {
    myPresence,
    isPresenceActive,
    activatePresenceRecord,
    refreshPresence,
    expirePresence,
  } = usePresenceEngine();

  // Block 67 — Google Calendar OAuth
  const {
    connectionState: oauthConnectionState,
    tokens: _oauthTokens,
    calendars: oauthCalendars,
    selectedCalendarId: oauthSelectedCalendarId,
    connectedAt: oauthConnectedAt,
    connect: connectGoogleCalendar,
    disconnect: disconnectGoogleCalendar,
    selectCalendar: selectOAuthCalendar,
  } = useGoogleOAuth();

  // Block 66 — Google Calendar Sync Engine state
  const [calendarSyncStatus, setCalendarSyncStatus] =
    useState<CalendarSyncStatus>("idle");
  const [lastCalendarSync, setLastCalendarSync] = useState<number | null>(null);
  // Holds a reference to the backend actor, injected from HelicopterPage via setCalendarActor()
  const calendarActorRef = useRef<unknown>(null);
  const setCalendarActor = useCallback((actor: unknown) => {
    calendarActorRef.current = actor;
  }, []);

  // Block 68 — keep a ref to current merged slots so syncNow always reads latest
  const availabilitySlotsRef = useRef<AvailabilitySlot[]>(availabilitySlots);
  useEffect(() => {
    availabilitySlotsRef.current = availabilitySlots;
  }, [availabilitySlots]);

  // Block 68 / Block 69 — Manual "Sync Now": refetch busy times from Google Calendar and
  // update slot availability immediately. Falls back silently when not connected.
  // Block 69: calendarId is encoded into the endTime suffix by syncCalendarAvailability.
  const syncNow = useCallback(async () => {
    const actor = calendarActorRef.current as {
      checkHelicopterAvailability: (
        start: string,
        end: string,
      ) => Promise<string>;
    } | null;

    if (!actor) {
      // No actor available — nothing to sync, stay on local state
      return;
    }

    setCalendarSyncStatus("syncing");

    // Merge base + pilot custom slots for the sync window
    const mergedSlots = [...availabilitySlotsRef.current, ...pilotSlots];

    const result = await syncCalendarAvailability(
      actor,
      oauthSelectedCalendarId,
      mergedSlots,
      helicopterReservationsRef.current,
    );

    if (result.ok && result.updatedSlots) {
      // Only update the base availability slots (not the pilot custom slots —
      // those are managed separately via setPilotSlots)
      const baseUpdated = result.updatedSlots.filter((s) => !s.isPilotSlot);
      setAvailabilitySlots(baseUpdated);
      setCalendarSyncStatus("synced");
      setLastCalendarSync(Date.now());
    } else {
      console.warn("[CalendarSync] syncNow failed:", result.error);
      setCalendarSyncStatus("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthSelectedCalendarId, pilotSlots]);

  // Block 64 — keep a ref so stable isSlotTaken callback always reads current reservations
  const helicopterReservationsRef = useRef<HelicopterReservation[]>(
    helicopterReservations,
  );
  useEffect(() => {
    helicopterReservationsRef.current = helicopterReservations;
  }, [helicopterReservations]);

  // Block 64 — slot conflict helpers (pure, work against a snapshot of reservations)
  const isSlotTaken = useCallback(
    (
      dateKey: string,
      timeKey: string,
      ignoreReservationId?: string,
    ): boolean => {
      const key = makeSlotKey(dateKey, timeKey);
      // We capture helicopterReservations via closure; use a ref-backed version
      // to keep the callback stable while reading current state.
      return helicopterReservationsRef.current.some((r) => {
        if (ignoreReservationId && r.id === ignoreReservationId) return false;
        const rKey =
          r.slotKey ||
          makeSlotKey(
            normalizeDateKey(r.slot.date),
            normalizeTimeKey(r.slot.time),
          );
        return (
          rKey === key && (r.status === "confirmed" || r.status === "booked")
        );
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const assertSlotAvailable = useCallback(
    (
      dateKey: string,
      timeKey: string,
      ignoreId?: string,
    ): { ok: true } | { ok: false; reason: string } => {
      if (isSlotTaken(dateKey, timeKey, ignoreId)) {
        return {
          ok: false,
          reason: "That time is already booked. Please pick another slot.",
        };
      }
      return { ok: true };
    },
    [isSlotTaken],
  );

  const reserveHelicopter = useCallback(
    (slot: AvailabilitySlot): { ok: true } | { ok: false; error: string } => {
      if (!profileCompleted) {
        return {
          ok: false,
          error: "Complete your profile before reserving a slot.",
        };
      }
      if (!slot) {
        return { ok: false, error: "No slot selected." };
      }

      // Block 64 — Enforce no double-booking using normalised slot keys
      const dateKey = normalizeDateKey(slot.date);
      const timeKey = normalizeTimeKey(slot.time);
      const check = assertSlotAvailable(dateKey, timeKey);
      if (!check.ok) {
        return { ok: false, error: check.reason };
      }

      const slotKey = makeSlotKey(dateKey, timeKey);
      const reservationId = Date.now().toString();
      const reservation: HelicopterReservation = {
        id: reservationId,
        slot,
        userId: "currentUser",
        status: "confirmed",
        slotKey,
        createdAt: Date.now(),
        calendarSynced: false,
      };
      setHelicopterReservations((prev) => [...prev, reservation]);

      // Block 66 / Block 68 — Fire-and-forget: create Google Calendar event
      // This is non-blocking. If it fails, the local reservation is preserved.
      // Block 68: pass oauthSelectedCalendarId so the event lands in the correct calendar.
      const actor = calendarActorRef.current as {
        bookHelicopter: (b: unknown) => Promise<string>;
      } | null;

      if (actor) {
        setCalendarSyncStatus("syncing");
        createCalendarEvent(
          actor,
          reservation,
          20 * 60_000,
          oauthSelectedCalendarId,
        )
          .then((result) => {
            if (result.ok) {
              setCalendarSyncStatus("synced");
              setLastCalendarSync(Date.now());
              // Patch reservation with calendarEventId if we got one
              if (result.eventId) {
                setHelicopterReservations((prev) =>
                  prev.map((r) =>
                    r.id === reservationId
                      ? {
                          ...r,
                          calendarEventId: result.eventId,
                          calendarSynced: true,
                        }
                      : r,
                  ),
                );
              } else {
                // Mark synced even without an eventId (backend acknowledged)
                setHelicopterReservations((prev) =>
                  prev.map((r) =>
                    r.id === reservationId ? { ...r, calendarSynced: true } : r,
                  ),
                );
              }
            } else {
              // Calendar call failed — log and fall back to local-only
              console.warn(
                "[CalendarSync] Could not create calendar event for reservation",
                reservationId,
                ":",
                result.error,
              );
              setCalendarSyncStatus("error");
            }
          })
          .catch((err) => {
            console.warn("[CalendarSync] createCalendarEvent threw:", err);
            setCalendarSyncStatus("error");
          });
      }

      return { ok: true };
    },
    [profileCompleted, assertSlotAvailable, oauthSelectedCalendarId],
  );

  // Block 63 / Block 64 / Block 66 — Reschedule: validate new slot, update locally, sync calendar
  const rescheduleHelicopter = useCallback(
    (
      reservationId: string,
      newSlot: AvailabilitySlot,
    ): { ok: true } | { ok: false; error: string } => {
      const dateKey = normalizeDateKey(newSlot.date);
      const timeKey = normalizeTimeKey(newSlot.time);
      // Ignore the reservation being rescheduled so it doesn't conflict with itself
      const check = assertSlotAvailable(dateKey, timeKey, reservationId);
      if (!check.ok) {
        return { ok: false, error: check.reason };
      }

      const slotKey = makeSlotKey(dateKey, timeKey);

      // Capture the old calendar event ID before we overwrite
      const oldReservation = helicopterReservationsRef.current.find(
        (r) => r.id === reservationId,
      );
      const oldCalendarEventId = oldReservation?.calendarEventId;

      // Build the updated reservation object before touching state
      const updatedReservation: HelicopterReservation | null = oldReservation
        ? {
            ...oldReservation,
            slot: newSlot,
            slotKey,
            updatedAt: Date.now(),
            // Clear old calendar sync info — will be re-synced below
            calendarEventId: undefined,
            calendarSynced: false,
          }
        : null;

      // Update local state
      setHelicopterReservations((prev) =>
        prev.map((r) => {
          if (r.id === reservationId) {
            return (
              updatedReservation ?? {
                ...r,
                slot: newSlot,
                slotKey,
                updatedAt: Date.now(),
                calendarEventId: undefined,
                calendarSynced: false,
              }
            );
          }
          return r;
        }),
      );

      // Block 66 / Block 68 — Fire-and-forget calendar sync for reschedule:
      // 1. Delete old event (best-effort)
      // 2. Create new event in the selected calendar (best-effort)
      const actor = calendarActorRef.current as {
        bookHelicopter: (b: unknown) => Promise<string>;
      } | null;

      if (actor && updatedReservation) {
        setCalendarSyncStatus("syncing");

        // Step 1: delete old event (if any) — pass calendarId for routing
        const deletePromise = oldCalendarEventId
          ? deleteCalendarEvent(
              actor,
              oldCalendarEventId,
              oauthSelectedCalendarId,
            ).catch(() => ({
              ok: false,
              error: "delete threw",
            }))
          : Promise.resolve({ ok: true });

        // Step 2: create new event in the selected calendar
        deletePromise
          .then(() =>
            createCalendarEvent(
              actor,
              updatedReservation,
              20 * 60_000,
              oauthSelectedCalendarId,
            ),
          )
          .then((result) => {
            if (result.ok) {
              setCalendarSyncStatus("synced");
              setLastCalendarSync(Date.now());
              if (result.eventId) {
                setHelicopterReservations((prev) =>
                  prev.map((r) =>
                    r.id === reservationId
                      ? {
                          ...r,
                          calendarEventId: result.eventId,
                          calendarSynced: true,
                        }
                      : r,
                  ),
                );
              } else {
                setHelicopterReservations((prev) =>
                  prev.map((r) =>
                    r.id === reservationId ? { ...r, calendarSynced: true } : r,
                  ),
                );
              }
            } else {
              console.warn(
                "[CalendarSync] Could not create rescheduled calendar event:",
                result.error,
              );
              setCalendarSyncStatus("error");
            }
          })
          .catch((err) => {
            console.warn("[CalendarSync] reschedule calendar sync threw:", err);
            setCalendarSyncStatus("error");
          });
      }

      return { ok: true };
    },
    [assertSlotAvailable, oauthSelectedCalendarId],
  );

  const cancelHelicopterReservation = useCallback(
    (reservationId: string) => {
      // Block 66 — Find the reservation's calendarEventId before removing it locally
      const reservation = helicopterReservationsRef.current.find(
        (r) => r.id === reservationId,
      );

      // Remove locally first (local-first, never blocked by calendar)
      setHelicopterReservations((prev) =>
        prev.filter((r) => r.id !== reservationId),
      );

      // Block 66 / Block 68 — Fire-and-forget: delete calendar event if we have one.
      // Pass oauthSelectedCalendarId so the backend routes to the correct calendar.
      if (reservation?.calendarEventId) {
        const actor = calendarActorRef.current;
        deleteCalendarEvent(
          actor,
          reservation.calendarEventId,
          oauthSelectedCalendarId,
        )
          .then((result) => {
            if (!result.ok) {
              console.warn(
                "[CalendarSync] Could not delete calendar event",
                reservation.calendarEventId,
                ":",
                result.error,
                "— reservation removed locally.",
              );
            } else {
              console.info(
                "[CalendarSync] Calendar event deleted:",
                reservation.calendarEventId,
              );
            }
          })
          .catch((err) => {
            console.warn("[CalendarSync] deleteCalendarEvent threw:", err);
          });
      }
    },
    [oauthSelectedCalendarId],
  );

  // Block 65 — Pilot Calendar Authority actions
  const setPilotOverride = useCallback((slotKey: string, blocked: boolean) => {
    setPilotOverridesState((prev) => {
      const next = new Set(prev);
      if (blocked) {
        next.add(slotKey);
      } else {
        next.delete(slotKey);
      }
      return next;
    });
  }, []);

  const addPilotSlot = useCallback((date: string, time: string) => {
    if (!date || !time) return;
    const newSlot: AvailabilitySlot = {
      id: `pilot-${Date.now()}`,
      date,
      time,
      booked: false,
      isPilotSlot: true,
    };
    setPilotSlots((prev) => [...prev, newSlot]);
  }, []);

  const removePilotSlot = useCallback((slotId: string) => {
    setPilotSlots((prev) => prev.filter((s) => s.id !== slotId));
    // Also remove any override for this slot
    setPilotOverridesState((prev) => {
      const next = new Set(prev);
      // We don't have slotKey here easily, so we clear any entry that matches
      // by rebuilding from remaining slots — simpler: just leave override set
      // cleanup to natural lifecycle (blocked slot won't appear if slot is gone)
      return next;
    });
  }, []);

  // Emergency state (Block 47 / Block 51)
  const [emergencyState, setEmergencyState] = useState<EmergencyState>("idle");
  const [emergencyLevel, setEmergencyLevel] = useState<number>(0);
  const [emergencySnapshot, setEmergencySnapshot] = useState<{
    sport: string | null;
    mode: string;
    timestamp: number;
  } | null>(null);

  const emergencyResolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const escalationTimer1Ref = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const escalationTimer2Ref = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { addCoins, balance: coinBalance, updateBalance } = useCoinBalance();

  // Persist locationEnabled to localStorage whenever it changes
  useEffect(() => {
    safeSetItem(
      "sportbuddies_location_enabled",
      locationEnabled ? "true" : "false",
    );
  }, [locationEnabled]);

  // Persist userMode to localStorage whenever it changes
  useEffect(() => {
    safeSetItem("sportbuddies_user_mode", userMode);
  }, [userMode]);

  // Persist core state (Block 54 / Block 55 / Block 57 / Block 60 / Block 65 / Block 67)
  useEffect(() => {
    saveCoreState({
      trustScore,
      eventsAttendedCount,
      eventsHostedCount,
      currentSport,
      sportStatus,
      events,
      profileCompleted,
      helicopterReservations,
      // Block 65 — persist pilot calendar authority data
      pilotSlots,
      pilotOverrides: Array.from(pilotOverrides),
      // Block 67 — persist selected OAuth calendar (tokens managed by useGoogleOAuth's own storage)
      oauthSelectedCalendarId,
    });
  }, [
    trustScore,
    eventsAttendedCount,
    eventsHostedCount,
    currentSport,
    sportStatus,
    events,
    profileCompleted,
    helicopterReservations,
    pilotSlots,
    pilotOverrides,
    oauthSelectedCalendarId,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (emergencyResolveTimerRef.current)
        clearTimeout(emergencyResolveTimerRef.current);
      if (escalationTimer1Ref.current)
        clearTimeout(escalationTimer1Ref.current);
      if (escalationTimer2Ref.current)
        clearTimeout(escalationTimer2Ref.current);
    };
  }, []);

  // Block 56 — Core State Integrity Validation
  const validateCoreState = useCallback(() => {
    // Fix invalid sport state: active but no sport selected
    setCurrentSport((prevSport) => {
      setSportStatus((prevStatus) => {
        if (prevStatus === "active" && !prevSport) {
          return "inactive";
        }
        return prevStatus;
      });
      return prevSport;
    });

    // Prevent negative coin / trust values
    if (coinBalance < 0) updateBalance(0);
    setTrustScore((prev) => (prev < 0 ? 0 : prev));

    // Validate events: completed events must have participants
    setEvents((prev) =>
      prev.map((event) => {
        if (event.status === "completed" && !event.participants) {
          return { ...event, status: "active" as EventStatus };
        }
        return event;
      }),
    );
  }, [coinBalance, updateBalance]);

  // Run validation once after initial load
  const validateCoreStateRef = useRef(validateCoreState);
  validateCoreStateRef.current = validateCoreState;
  useEffect(() => {
    const timer = setTimeout(() => {
      validateCoreStateRef.current();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const activateSport = (sport: string) => {
    setCurrentSport(sport);
    setSportStatus("active");
    // Block 70 — write presence record and start refresh heartbeat
    activatePresenceRecord(sport);
  };

  const deactivateSport = () => {
    setCurrentSport(null);
    setSportStatus("inactive");
    // Block 70 — clear presence record
    expirePresence();
  };

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
  };

  const setLocationEnabled = (enabled: boolean) => {
    setLocationEnabledState(enabled);
  };

  const toggleLocation = () => {
    setLocationEnabledState((prev) => !prev);
  };

  // Emergency actions (Block 47)
  const armEmergency = useCallback(() => {
    setEmergencyState("armed");
  }, []);

  const startEscalationTimer = useCallback(() => {
    // Clear any existing escalation timers
    if (escalationTimer1Ref.current) clearTimeout(escalationTimer1Ref.current);
    if (escalationTimer2Ref.current) clearTimeout(escalationTimer2Ref.current);

    escalationTimer1Ref.current = setTimeout(() => {
      setEmergencyState("escalated");
      setEmergencyLevel(2);

      escalationTimer2Ref.current = setTimeout(() => {
        setEmergencyState("rescue");
        setEmergencyLevel(3);
      }, 10000);
    }, 10000);
  }, []);

  const triggerEmergency = useCallback(() => {
    // Block trigger if location is disabled
    if (!locationEnabled) return;

    setEmergencySnapshot({
      sport: currentSport || null,
      mode: userMode || "normal",
      timestamp: Date.now(),
    });
    setEmergencyState("triggered");
    setEmergencyLevel(1);

    startEscalationTimer();
  }, [locationEnabled, currentSport, userMode, startEscalationTimer]);

  const resolveEmergency = useCallback(() => {
    // Cancel escalation timers
    if (escalationTimer1Ref.current) clearTimeout(escalationTimer1Ref.current);
    if (escalationTimer2Ref.current) clearTimeout(escalationTimer2Ref.current);

    setEmergencyState("resolved");
    setEmergencyLevel(0);

    // Clear any existing resolve timer
    if (emergencyResolveTimerRef.current) {
      clearTimeout(emergencyResolveTimerRef.current);
    }

    emergencyResolveTimerRef.current = setTimeout(() => {
      setEmergencyState("idle");
      setEmergencySnapshot(null);
      emergencyResolveTimerRef.current = null;
    }, 3000);
  }, []);

  // Auto-cancel emergency if sport deactivates or location turns off (Block 53)
  useEffect(() => {
    if (emergencyLevel > 0) {
      if (sportStatus === "inactive") {
        resolveEmergency();
      } else if (!locationEnabled) {
        resolveEmergency();
      }
    }
  }, [sportStatus, locationEnabled, emergencyLevel, resolveEmergency]);

  const joinEvent = useCallback(
    (eventId: string) => {
      // Block 57: profile must be complete before joining events
      if (!profileCompleted) return;

      setEvents((prev) =>
        prev.map((evt) => {
          if (evt.id !== eventId) return evt;
          if (evt.status !== "active") return evt;
          if (evt.participants.length >= evt.capacity) return evt;
          if (evt.participants.some((p) => p.id === CURRENT_USER.id))
            return evt;
          return {
            ...evt,
            participants: [
              ...evt.participants,
              { id: CURRENT_USER.id, name: CURRENT_USER.name },
            ],
          };
        }),
      );
    },
    [profileCompleted],
  );

  const leaveEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          participants: evt.participants.filter(
            (p) => p.id !== CURRENT_USER.id,
          ),
        };
      }),
    );
  }, []);

  const completeEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        // Trust Score: reward host on completion (Block 50)
        if (evt.hostId === CURRENT_USER.id) {
          setEventsHostedCount((c) => c + 1);
          setTrustScore((c) => c + 15);
        }
        return { ...evt, status: "completed" as EventStatus };
      }),
    );
  }, []);

  const cancelEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, status: "canceled" as EventStatus }
          : evt,
      ),
    );
  }, []);

  const hasAttended = useCallback(
    (eventId: string): boolean => {
      return attendedEventIds.includes(eventId);
    },
    [attendedEventIds],
  );

  const markAttended = useCallback(
    (eventId: string) => {
      if (attendedEventIds.includes(eventId)) return;
      const newIds = [...attendedEventIds, eventId];
      setAttendedEventIds(newIds);
      safeSetItem("attendedEventIds", JSON.stringify(newIds));
      addCoins(5);
      // Trust Score (Block 50)
      setEventsAttendedCount((prev) => prev + 1);
      setTrustScore((prev) => prev + 10);
    },
    [attendedEventIds, addCoins],
  );

  return (
    <SportContext.Provider
      value={{
        sportStatus,
        currentSport,
        userMode,
        locationEnabled,
        emergencyState,
        emergencyLevel,
        emergencySnapshot,
        activateSport,
        deactivateSport,
        setUserMode,
        setLocationEnabled,
        toggleLocation,
        armEmergency,
        triggerEmergency,
        resolveEmergency,
        currentUser: CURRENT_USER,
        events,
        joinEvent,
        leaveEvent,
        completeEvent,
        cancelEvent,
        attendedEventIds,
        hasAttended,
        markAttended,
        eventsAttendedCount,
        eventsHostedCount,
        trustScore,
        profileCompleted,
        setProfileCompleted,
        availabilitySlots,
        helicopterReservations,
        reserveHelicopter,
        rescheduleHelicopter,
        cancelHelicopterReservation,
        selectedSlot,
        setSelectedSlot,
        isSlotTaken,
        assertSlotAvailable,
        // Block 65 — Pilot Calendar Authority
        pilotSlots,
        pilotOverrides,
        setPilotOverride,
        addPilotSlot,
        removePilotSlot,
        // Block 66 — Google Calendar Sync Engine
        calendarSyncStatus,
        lastCalendarSync,
        setCalendarActor,
        // Block 67 — Google Calendar OAuth
        oauthConnectionState,
        oauthCalendars,
        oauthSelectedCalendarId,
        oauthConnectedAt,
        connectGoogleCalendar,
        disconnectGoogleCalendar,
        selectOAuthCalendar,
        // Block 68 — Manual sync
        syncNow,
        // Block 70 — Sport Activation Presence Engine
        myPresence,
        isPresenceActive,
        refreshPresence,
        expirePresence,
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export const SportProvider = ({ children }: { children: React.ReactNode }) => {
  return <SportProviderInner>{children}</SportProviderInner>;
};

export const useSport = (): SportContextType => {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error("useSport must be used inside SportProvider");
  }
  return context;
};
