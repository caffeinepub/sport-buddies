/**
 * Google Calendar Integration Service (Stub)
 *
 * This module provides stub functions for Google Calendar integration.
 * Google Calendar is the source of truth for:
 * - Pilot availability (free/busy status)
 * - Confirmed helicopter bookings
 *
 * In production, these functions will:
 * - Use Google Calendar API to check real-time availability
 * - Create actual calendar events when bookings are confirmed
 * - Allow pilot to block times, edit bookings, and manage schedule
 *
 * Current implementation returns mocked values for MVP.
 */

interface BookingDetails {
  date: string;
  startTime: string;
  duration: string;
  pickupLocation?: string;
  notes?: string;
  timestamp: number;
}

/**
 * Check if a time slot is available in the pilot's calendar
 *
 * @param date - Date in YYYY-MM-DD format
 * @param startTime - Start time in HH:MM format
 * @param duration - Duration string (e.g., "15m", "20m", "30m")
 * @returns Promise<boolean> - true if available, false if busy
 *
 * TODO: Replace with real Google Calendar API free/busy query
 * - Use Calendar API freebusy.query endpoint
 * - Check pilot's calendar for conflicts
 * - Return actual availability status
 */
export async function getCalendarFreeBusy(
  date: string,
  startTime: string,
  duration: string,
): Promise<boolean> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // MVP: Always return available
  // In production, this will query Google Calendar API
  console.log("[Calendar Stub] Checking availability:", {
    date,
    startTime,
    duration,
  });

  return true; // Stub always returns available
}

/**
 * Create a booking event in the pilot's calendar
 *
 * @param details - Booking details including date, time, duration, location, notes
 * @returns Promise<string> - Booking ID from calendar event
 *
 * TODO: Replace with real Google Calendar API event creation
 * - Use Calendar API events.insert endpoint
 * - Create event with all booking details
 * - Set event status to "tentative" until pilot confirms
 * - Return actual Google Calendar event ID
 */
export async function createBookingEvent(
  details: BookingDetails,
): Promise<string> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // MVP: Return mocked booking ID
  // In production, this will create a real calendar event
  const mockBookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log("[Calendar Stub] Creating booking event:", details);
  console.log("[Calendar Stub] Generated booking ID:", mockBookingId);

  return mockBookingId;
}

/**
 * Future functions to implement:
 *
 * - confirmBooking(bookingId: string): Promise<void>
 *   Update event status from tentative to confirmed
 *
 * - cancelBooking(bookingId: string): Promise<void>
 *   Delete or mark event as cancelled
 *
 * - getUpcomingBookings(): Promise<BookingDetails[]>
 *   Fetch all upcoming confirmed bookings
 *
 * - updateBooking(bookingId: string, updates: Partial<BookingDetails>): Promise<void>
 *   Modify existing booking details
 */
