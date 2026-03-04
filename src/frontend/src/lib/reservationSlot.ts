/**
 * Block 64 — Shared slot key utilities for helicopter reservations.
 * Used by both the store (SportContext) and page-level guards to ensure
 * consistent, comparable slot identifiers regardless of input format.
 */

/**
 * Normalise a date value to a YYYY-MM-DD string in LOCAL time.
 * Accepts a Date object or an ISO / YYYY-MM-DD string.
 */
export function normalizeDateKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Normalise a time string to HH:mm (24-hour, zero-padded).
 * Handles inputs like "10:00 AM", "1:00 PM", "10:00", "13:00".
 */
export function normalizeTimeKey(time: string): string {
  if (!time) return "";
  const cleaned = time.trim();

  // Already in HH:mm 24h format (e.g. "10:00" or "13:00")
  const h24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    return `${String(Number(h24[1])).padStart(2, "0")}:${h24[2]}`;
  }

  // 12-hour format with AM/PM (e.g. "10:00 AM", "1:00 PM")
  const h12 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (h12) {
    let hour = Number(h12[1]);
    const minutes = h12[2];
    const period = h12[3].toUpperCase();
    if (period === "AM") {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }
    return `${String(hour).padStart(2, "0")}:${minutes}`;
  }

  // Fallback: return as-is (caller should not reach here with valid data)
  return cleaned;
}

/**
 * Build a composite slot key from a dateKey (YYYY-MM-DD) and timeKey (HH:mm).
 * Format: "YYYY-MM-DDTHH:mm"
 */
export function makeSlotKey(dateKey: string, timeKey: string): string {
  return `${dateKey}T${timeKey}`;
}

/**
 * Returns true if slot keys a and b refer to the same (date, time) pair.
 */
export function isSameSlot(a: string, b: string): boolean {
  return a === b && a !== "";
}
