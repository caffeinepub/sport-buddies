import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type AvailabilitySlot,
  BASE_SLOT_IDS,
  useSport,
} from "@/context/SportContext";
import { useActor } from "@/hooks/useActor";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { useHelicopterAvailability } from "@/hooks/useHelicopterAvailability";
import { useHelicopterBooking } from "@/hooks/useHelicopterBooking";
import {
  makeSlotKey,
  normalizeDateKey,
  normalizeTimeKey,
} from "@/lib/reservationSlot";
import type { CalendarSyncStatus } from "@/services/googleCalendarSync";
import type {
  OAuthCalendarInfo,
  OAuthConnectionState,
} from "@/services/googleOAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plane,
  RefreshCw,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Block 65 — Pilot Calendar Panel
// A collapsible admin panel protected by a simple PIN ("PILOT" for MVP).
// ---------------------------------------------------------------------------

const PILOT_PIN = "PILOT";

interface PilotCalendarPanelProps {
  availabilitySlots: AvailabilitySlot[];
  pilotSlots: AvailabilitySlot[];
  pilotOverrides: Set<string>;
  setPilotOverride: (slotKey: string, blocked: boolean) => void;
  addPilotSlot: (date: string, time: string) => void;
  removePilotSlot: (slotId: string) => void;
  // Block 67 — Google Calendar OAuth
  oauthConnectionState: OAuthConnectionState;
  oauthCalendars: OAuthCalendarInfo[];
  oauthSelectedCalendarId: string | null;
  oauthConnectedAt: number | null;
  connectGoogleCalendar: () => Promise<void>;
  disconnectGoogleCalendar: () => void;
  selectOAuthCalendar: (calendarId: string) => void;
  // Block 68 — Manual sync
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
  calendarSyncStatus: CalendarSyncStatus;
  lastCalendarSync: number | null;
}

function PilotCalendarPanel({
  availabilitySlots,
  pilotSlots,
  pilotOverrides,
  setPilotOverride,
  addPilotSlot,
  removePilotSlot,
  oauthConnectionState,
  oauthCalendars,
  oauthSelectedCalendarId,
  oauthConnectedAt,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  selectOAuthCalendar,
  onSyncNow,
  isSyncing,
  calendarSyncStatus,
  lastCalendarSync,
}: PilotCalendarPanelProps) {
  const [pinInput, setPinInput] = useState("");
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  // New custom slot form
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const handlePinSubmit = () => {
    if (pinInput === PILOT_PIN) {
      setPinUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const getSlotKey = (slot: AvailabilitySlot) =>
    makeSlotKey(normalizeDateKey(slot.date), normalizeTimeKey(slot.time));

  const allManagedSlots = [...availabilitySlots, ...pilotSlots];

  return (
    <Collapsible open={panelOpen} onOpenChange={setPanelOpen}>
      <CollapsibleTrigger asChild>
        <Button
          data-ocid="pilot.panel.toggle"
          variant="outline"
          className="w-full border-primary/30 text-muted-foreground hover:text-foreground flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Pilot Calendar Control
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${panelOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card className="mt-2 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Pilot Schedule Authority
            </CardTitle>
            <CardDescription>
              Override slot availability and manage the schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!pinUnlocked ? (
              /* PIN Gate */
              <div className="space-y-3">
                <Label htmlFor="pilot-pin">Pilot PIN</Label>
                <div className="flex gap-2">
                  <Input
                    id="pilot-pin"
                    data-ocid="pilot.pin.input"
                    type="password"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError(false);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                    placeholder="Enter PIN"
                    className="border-primary/30 flex-1"
                  />
                  <Button
                    data-ocid="pilot.pin.submit_button"
                    onClick={handlePinSubmit}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    Unlock
                  </Button>
                </div>
                {pinError && (
                  <p
                    data-ocid="pilot.pin.error_state"
                    className="text-sm text-destructive"
                  >
                    Incorrect PIN. Access denied.
                  </p>
                )}
              </div>
            ) : (
              /* Pilot control panel — unlocked */
              <div className="space-y-5">
                {/* Block 67 — OAuth Connection Status */}
                <div className="space-y-3 pb-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-accent" />
                      Google Calendar
                    </p>
                    {/* Connection status badge */}
                    <span
                      data-ocid="pilot.oauth.status_badge"
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        oauthConnectionState === "connected"
                          ? "bg-green-500/15 text-green-500 dark:text-green-400"
                          : oauthConnectionState === "connecting"
                            ? "bg-yellow-500/15 text-yellow-500"
                            : oauthConnectionState === "error"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {oauthConnectionState === "connected"
                        ? "Connected"
                        : oauthConnectionState === "connecting"
                          ? "Connecting…"
                          : oauthConnectionState === "error"
                            ? "Error"
                            : "Not Connected"}
                    </span>
                  </div>

                  {/* Connected state: show calendar selector + metadata */}
                  {oauthConnectionState === "connected" && (
                    <div className="space-y-2">
                      {oauthConnectedAt && (
                        <p className="text-xs text-muted-foreground">
                          Connected{" "}
                          {new Date(oauthConnectedAt).toLocaleDateString()} ·{" "}
                          {new Date(oauthConnectedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      )}

                      {/* Calendar selector */}
                      {oauthCalendars.length > 0 && (
                        <div className="space-y-1">
                          <label
                            htmlFor="pilot-oauth-calendar-select"
                            className="text-xs text-muted-foreground"
                          >
                            Active calendar
                          </label>
                          <select
                            id="pilot-oauth-calendar-select"
                            data-ocid="pilot.oauth.calendar_select"
                            value={oauthSelectedCalendarId ?? ""}
                            onChange={(e) =>
                              selectOAuthCalendar(e.target.value)
                            }
                            className="w-full rounded-md border border-primary/30 bg-background text-foreground text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-accent"
                          >
                            <option value="" disabled>
                              Select a calendar
                            </option>
                            {oauthCalendars.map((cal) => (
                              <option key={cal.id} value={cal.id}>
                                {cal.summary}
                                {cal.primary ? " (Primary)" : ""}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {/* Block 68 — Sync Now button */}
                        <Button
                          data-ocid="pilot.oauth.sync_now_button"
                          size="sm"
                          variant="outline"
                          className="flex-1 border-accent/50 text-accent hover:bg-accent/10 text-xs"
                          disabled={isSyncing}
                          onClick={onSyncNow}
                        >
                          {isSyncing ? (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                              Syncing…
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Sync Now
                            </>
                          )}
                        </Button>
                        <Button
                          data-ocid="pilot.oauth.disconnect_button"
                          size="sm"
                          variant="outline"
                          className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10 text-xs"
                          onClick={disconnectGoogleCalendar}
                        >
                          Disconnect
                        </Button>
                      </div>
                      {/* Block 68 — Last sync timestamp + status */}
                      {(calendarSyncStatus === "synced" ||
                        calendarSyncStatus === "error") &&
                        lastCalendarSync && (
                          <p
                            data-ocid="pilot.oauth.last_sync"
                            className={`text-xs ${
                              calendarSyncStatus === "synced"
                                ? "text-green-500 dark:text-green-400"
                                : "text-yellow-500"
                            }`}
                          >
                            {calendarSyncStatus === "synced"
                              ? "Synced"
                              : "Sync error"}{" "}
                            ·{" "}
                            {new Date(lastCalendarSync).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                    </div>
                  )}

                  {/* Connecting state */}
                  {oauthConnectionState === "connecting" && (
                    <div
                      data-ocid="pilot.oauth.connecting_state"
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting to Google Calendar…
                    </div>
                  )}

                  {/* Disconnected / error state: connect button + fallback notice */}
                  {(oauthConnectionState === "disconnected" ||
                    oauthConnectionState === "error") && (
                    <div className="space-y-2">
                      {oauthConnectionState === "error" && (
                        <p
                          data-ocid="pilot.oauth.error_state"
                          className="text-xs text-destructive"
                        >
                          Connection failed. Try again.
                        </p>
                      )}
                      <Button
                        data-ocid="pilot.oauth.connect_button"
                        size="sm"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs"
                        onClick={connectGoogleCalendar}
                      >
                        Connect Google Calendar
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Using local schedule — connect Google Calendar for live
                        sync.
                      </p>
                    </div>
                  )}
                </div>

                {/* Override toggles for all slots */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Slot Override Controls
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Toggle a slot blocked to prevent new bookings.
                  </p>
                  {allManagedSlots.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No slots defined.
                    </p>
                  )}
                  {allManagedSlots.map((slot, idx) => {
                    const key = getSlotKey(slot);
                    const isBlocked = pilotOverrides.has(key);
                    const isPilotAdded = !!slot.isPilotSlot;
                    return (
                      <div
                        key={slot.id}
                        data-ocid={`pilot.slot_override.item.${idx + 1}`}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2 bg-card"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">
                            {slot.date} · {slot.time}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isPilotAdded ? "Custom slot" : "Base slot"}
                            {isBlocked && (
                              <span className="ml-1 text-destructive font-semibold">
                                · Blocked
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            data-ocid={`pilot.slot_override.toggle.${idx + 1}`}
                            size="sm"
                            variant={isBlocked ? "default" : "outline"}
                            className={
                              isBlocked
                                ? "bg-destructive hover:bg-destructive/90 text-white text-xs"
                                : "border-accent/50 text-accent hover:bg-accent/10 text-xs"
                            }
                            onClick={() => setPilotOverride(key, !isBlocked)}
                          >
                            {isBlocked ? "Unblock" : "Block"}
                          </Button>
                          {isPilotAdded && (
                            <Button
                              data-ocid={`pilot.slot_remove.${idx + 1}`}
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10 px-2"
                              onClick={() => removePilotSlot(slot.id)}
                              title="Remove custom slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add custom slot */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-semibold text-foreground">
                    Add Custom Slot
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="pilot-new-date" className="text-xs">
                        Date
                      </Label>
                      <Input
                        id="pilot-new-date"
                        data-ocid="pilot.add_slot.date_input"
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="border-primary/30 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pilot-new-time" className="text-xs">
                        Time
                      </Label>
                      <Input
                        id="pilot-new-time"
                        data-ocid="pilot.add_slot.time_input"
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="border-primary/30 text-sm"
                      />
                    </div>
                  </div>
                  <Button
                    data-ocid="pilot.add_slot.submit_button"
                    size="sm"
                    disabled={!newDate || !newTime}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs"
                    onClick={() => {
                      // Convert time input (HH:mm 24h) to display format
                      const [h, m] = newTime.split(":").map(Number);
                      const period = h >= 12 ? "PM" : "AM";
                      const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
                      const displayTime = `${displayH}:${String(m).padStart(2, "0")} ${period}`;
                      addPilotSlot(newDate, displayTime);
                      setNewDate("");
                      setNewTime("");
                      toast.success("Custom slot added.");
                    }}
                  >
                    Add Slot
                  </Button>
                </div>

                {/* Lock panel */}
                <Button
                  data-ocid="pilot.panel.lock_button"
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-foreground text-xs"
                  onClick={() => {
                    setPinUnlocked(false);
                    setPinInput("");
                  }}
                >
                  Lock Panel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

const COIN_COST = 2000;
const DEFAULT_DURATION_MINUTES = 20;

export default function HelicopterPage() {
  const navigate = useNavigate();
  const { balance, updateBalance } = useCoinBalance();
  const bookingMutation = useHelicopterBooking();
  const { actor } = useActor();
  const {
    availabilitySlots,
    helicopterReservations,
    reserveHelicopter,
    rescheduleHelicopter,
    cancelHelicopterReservation,
    selectedSlot,
    setSelectedSlot,
    profileCompleted,
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
    // Block 67 — OAuth
    oauthConnectionState,
    oauthCalendars,
    oauthSelectedCalendarId,
    oauthConnectedAt,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    selectOAuthCalendar,
    // Block 68 — Manual sync
    syncNow,
  } = useSport();

  // Block 66 — Inject the actor into the context so SportContext can fire
  // calendar calls without needing to use hooks directly (hooks cannot be
  // called inside callbacks).
  useEffect(() => {
    if (actor) {
      setCalendarActor(actor);
    }
  }, [actor, setCalendarActor]);

  // Block 69 — Auto-fetch availability when calendar selection changes or on mount.
  // syncNow is memoized with oauthSelectedCalendarId in its deps (SportContext),
  // so changing the selected calendar triggers a fresh sync automatically.
  useEffect(() => {
    if (!actor) return;
    syncNow().catch(() => {
      // Fallback: local availability remains authoritative — no crash
    });
  }, [actor, syncNow]);

  // Form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [passengerCount, setPassengerCount] = useState("1");
  const [totalWeight, setTotalWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [safeConfirmed, setSafeConfirmed] = useState(false);

  // Cancel confirmation modal state
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedResId, setSelectedResId] = useState<string | null>(null);

  // Block 63 — Reschedule mode state
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [editingReservationId, setEditingReservationId] = useState<
    string | null
  >(null);

  const startReschedule = (reservationId: string) => {
    setEditingReservationId(reservationId);
    setRescheduleMode(true);
    setSelectedSlot(null);
  };

  const handleCancelPress = (resId: string) => {
    setSelectedResId(resId);
    setCancelModalVisible(true);
  };

  const confirmCancel = () => {
    if (selectedResId) {
      cancelHelicopterReservation(selectedResId);
    }
    setCancelModalVisible(false);
    setSelectedResId(null);
  };

  // UI state
  const [hasCheckedAvailability, setHasCheckedAvailability] = useState(false);
  const [availabilityCheckParams, setAvailabilityCheckParams] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    date: string;
    time: string;
    paymentMode: string;
  } | null>(null);

  // Calculate start and end times
  const getStartEndTimes = () => {
    if (!date || !time) return null;

    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(
      startDateTime.getTime() + DEFAULT_DURATION_MINUTES * 60000,
    );

    return {
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
    };
  };

  // Availability query — Block 69: pass oauthSelectedCalendarId for backend routing
  const {
    data: availabilityData,
    isLoading: isCheckingAvailability,
    error: _availabilityError,
  } = useHelicopterAvailability(
    availabilityCheckParams?.start || "",
    availabilityCheckParams?.end || "",
    !!availabilityCheckParams,
    oauthSelectedCalendarId,
  );

  const handleCheckAvailability = () => {
    const times = getStartEndTimes();
    if (!times) return;

    setAvailabilityCheckParams(times);
    setHasCheckedAvailability(true);
  };

  const isSlotAvailable = () => {
    if (!hasCheckedAvailability || !availabilityData) return false;
    if (availabilityData.error) return false;

    const times = getStartEndTimes();
    if (!times) return false;

    // Check if requested slot conflicts with any busy blocks
    const requestStart = new Date(times.start);
    const requestEnd = new Date(times.end);

    for (const busy of availabilityData.busy) {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);

      // Check for overlap
      if (requestStart < busyEnd && requestEnd > busyStart) {
        return false;
      }
    }

    return true;
  };

  const isFormValid = () => {
    return (
      date &&
      time &&
      name.trim() &&
      email.trim() &&
      phone.trim() &&
      passengerCount &&
      Number.parseInt(passengerCount) >= 1 &&
      Number.parseInt(passengerCount) <= 2 &&
      totalWeight.trim() &&
      Number.parseFloat(totalWeight) > 0
    );
  };

  const handleBooking = async (paymentMode: "paid" | "coins") => {
    if (!isFormValid() || !isSlotAvailable()) return;

    const times = getStartEndTimes();
    if (!times) return;

    // Check coin balance if using coins
    if (paymentMode === "coins" && balance < COIN_COST) {
      return;
    }

    try {
      const result = await bookingMutation.mutateAsync({
        startTime: times.start,
        endTime: times.end,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        passengerCount: Number.parseInt(passengerCount),
        weights: totalWeight.trim(),
        notes: notes.trim(),
        paymentMode,
      });

      if (result.ok) {
        // Deduct coins if payment mode is coins
        if (paymentMode === "coins") {
          updateBalance(balance - COIN_COST);

          // Log redemption to localStorage
          const redemptionLog = {
            timestamp: Date.now(),
            amount: COIN_COST,
            description: "Helicopter Reservation",
            date,
            time,
          };

          try {
            const existingLogs = localStorage.getItem(
              "sb_helicopterRedemptions",
            );
            const logs = existingLogs ? JSON.parse(existingLogs) : [];
            logs.push(redemptionLog);
            localStorage.setItem(
              "sb_helicopterRedemptions",
              JSON.stringify(logs),
            );
          } catch (error) {
            console.error("Error logging redemption:", error);
          }
        }

        // Show success screen
        setSuccessDetails({
          date,
          time,
          paymentMode,
        });
        setShowSuccess(true);
      } else if (result.reason === "busy") {
        // Slot was taken between check and booking
        setHasCheckedAvailability(false);
        setAvailabilityCheckParams(null);
      }
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  const handleGoHome = () => {
    navigate({ to: "/" });
  };

  // Success screen
  if (showSuccess && successDetails) {
    return (
      <main className="min-h-screen px-6 pb-24 pt-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-accent">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
              </div>
              <CardTitle className="text-2xl">Reservation Confirmed!</CardTitle>
              <CardDescription>
                Your helicopter booking has been processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="text-lg font-semibold">
                    {new Date(
                      `${successDetails.date}T${successDetails.time}`,
                    ).toLocaleString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold">
                    {DEFAULT_DURATION_MINUTES} minutes
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Payment</p>
                  <p className="text-lg font-semibold">
                    {successDetails.paymentMode === "coins"
                      ? `${COIN_COST} Coins`
                      : "Payment Pending"}
                  </p>
                </div>
              </div>

              <Alert className="border-accent/50 bg-accent/10">
                <CheckCircle2 className="h-4 w-4 text-accent" />
                <AlertTitle>Pilot Calendar Updated</AlertTitle>
                <AlertDescription>
                  Your reservation has been added to the pilot's calendar. You
                  will receive a confirmation email shortly.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleGoHome}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Main form
  return (
    <main className="min-h-screen px-6 pb-24 pt-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Plane className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-foreground">
              Helicopter Reservation
            </h1>
          </div>
          <p className="text-muted-foreground">
            Live availability powered by the pilot calendar
          </p>
        </div>

        {/* Block 58 — Slot Reservation Test UI */}
        <Card className="mb-6 border-accent/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-accent" />
              Quick Book — Available Slots
            </CardTitle>
            <CardDescription>
              Select a slot and tap Reserve. Your reservations appear below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!profileCompleted && (
              <p className="text-sm text-destructive">
                Complete your profile before reserving a slot.
              </p>
            )}

            {/* Block 65 — Slot list: base + pilot custom slots, respecting pilot overrides */}
            {(() => {
              const bookedSlotIds = helicopterReservations
                .filter((r) => !rescheduleMode || r.id !== editingReservationId)
                .map((r) => r.slot.id);

              // Merge base slots + pilot-added custom slots
              const allSlots = [...availabilitySlots, ...pilotSlots];

              return (
                <div className="space-y-2">
                  {allSlots.map((slot, idx) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const isBooked = bookedSlotIds.includes(slot.id);
                    const slotKey = makeSlotKey(
                      normalizeDateKey(slot.date),
                      normalizeTimeKey(slot.time),
                    );
                    const isPilotBlocked = pilotOverrides.has(slotKey);
                    const isDisabled = isBooked || isPilotBlocked;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        data-ocid={`helicopter.slot.${BASE_SLOT_IDS.has(slot.id) ? slot.id : `custom-${idx + 1}`}.button`}
                        disabled={isDisabled}
                        onClick={() =>
                          !isDisabled &&
                          setSelectedSlot(isSelected ? null : slot)
                        }
                        style={{ opacity: isDisabled ? 0.5 : 1 }}
                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                          isDisabled
                            ? "border-muted bg-muted/20 text-muted-foreground cursor-not-allowed"
                            : isSelected
                              ? "border-accent bg-accent/15 text-foreground"
                              : "border-primary/30 bg-card hover:border-accent/60 text-foreground"
                        }`}
                      >
                        <span className="font-semibold">{slot.date}</span>
                        <span className="mx-2 text-muted-foreground">·</span>
                        <span>{slot.time}</span>
                        {slot.isPilotSlot && !isDisabled && (
                          <Badge className="ml-2 bg-primary/40 text-foreground text-xs">
                            Custom
                          </Badge>
                        )}
                        {isPilotBlocked ? (
                          <Badge className="ml-2 bg-muted text-muted-foreground text-xs">
                            Blocked
                          </Badge>
                        ) : isBooked ? (
                          <Badge className="ml-2 bg-destructive/80 text-white text-xs">
                            Booked
                          </Badge>
                        ) : isSelected ? (
                          <Badge className="ml-2 bg-accent text-accent-foreground text-xs">
                            Selected
                          </Badge>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            {/* Block 63 — Reschedule mode message */}
            {rescheduleMode && (
              <p
                className="text-sm font-semibold text-center"
                style={{ color: "orange" }}
              >
                Select a new time slot to reschedule your flight
              </p>
            )}

            <Button
              data-ocid="helicopter.reserve_slot.button"
              disabled={!selectedSlot || !profileCompleted}
              onClick={() => {
                if (!selectedSlot) return;
                if (rescheduleMode && editingReservationId) {
                  // Block 64 — handle reschedule result
                  const result = rescheduleHelicopter(
                    editingReservationId,
                    selectedSlot,
                  );
                  if (!result.ok) {
                    toast.error(result.error);
                    // Keep reschedule mode open so user can pick a different slot
                    return;
                  }
                  toast.success("Flight rescheduled!");
                  setRescheduleMode(false);
                  setEditingReservationId(null);
                } else {
                  // Block 64 — handle reserve result
                  const result = reserveHelicopter(selectedSlot);
                  if (!result.ok) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Slot reserved!");
                }
                setSelectedSlot(null);
              }}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {rescheduleMode ? "Confirm Reschedule" : "Reserve This Slot"}
            </Button>

            {/* Reservation list */}
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-foreground">
                  Your Flight Bookings
                </p>
                {/* Block 66 — Calendar sync status indicator (no redesign, minimal) */}
                {calendarSyncStatus !== "idle" && (
                  <span
                    data-ocid="helicopter.calendar_sync.status"
                    className={`text-xs flex items-center gap-1 ${
                      calendarSyncStatus === "syncing"
                        ? "text-muted-foreground"
                        : calendarSyncStatus === "synced"
                          ? "text-green-500 dark:text-green-400"
                          : "text-yellow-500"
                    }`}
                    title={
                      lastCalendarSync
                        ? `Last synced: ${new Date(lastCalendarSync).toLocaleTimeString()}`
                        : "Calendar sync status"
                    }
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${calendarSyncStatus === "syncing" ? "animate-spin" : ""}`}
                    />
                    {calendarSyncStatus === "syncing"
                      ? "Syncing…"
                      : calendarSyncStatus === "synced"
                        ? "Calendar synced"
                        : "Sync unavailable"}
                  </span>
                )}
              </div>

              {helicopterReservations.length === 0 && (
                <p
                  data-ocid="helicopter.reservations.empty_state"
                  className="text-sm text-muted-foreground text-center pt-1"
                >
                  No reservations yet.
                </p>
              )}

              {helicopterReservations.map((r) => {
                const formatDateTime = (timestamp: number) => {
                  const d = new Date(timestamp);
                  return d.toLocaleString();
                };
                return (
                  <div
                    key={r.id}
                    data-ocid="helicopter.reservation.card"
                    className="rounded-xl border border-accent/40 bg-card p-4 shadow-sm space-y-1"
                  >
                    <p className="font-bold text-base text-foreground">
                      🚁 Flight Reserved
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Date:</span>{" "}
                      {r.slot.date}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Time:</span>{" "}
                      {r.slot.time}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Booked On:
                      </span>{" "}
                      {formatDateTime(r.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium text-foreground">
                        Status:
                      </span>{" "}
                      <span className="capitalize">{r.status}</span>
                      {/* Block 66 — Calendar sync indicator */}
                      {r.calendarSynced && (
                        <span className="ml-2 text-xs text-green-500 dark:text-green-400">
                          · Calendar event created
                        </span>
                      )}
                    </p>
                    <div className="pt-2 flex gap-2">
                      <Button
                        data-ocid="helicopter.reservation.reschedule.button"
                        variant="outline"
                        size="sm"
                        className="flex-1 border-accent/50 text-accent hover:bg-accent/10 text-xs"
                        onClick={() => startReschedule(r.id)}
                      >
                        Reschedule
                      </Button>
                      <Button
                        data-ocid="helicopter.reservation.cancel.button"
                        variant="outline"
                        size="sm"
                        className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => handleCancelPress(r.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Configuration Error */}
        {availabilityData?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              {availabilityData.error === "Calendar not configured"
                ? "The calendar system is not configured yet. Please contact support."
                : availabilityData.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Conflict Error */}
        {bookingMutation.data?.reason === "busy" && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Slot Unavailable</AlertTitle>
            <AlertDescription>
              That slot was just taken. Please choose another time.
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Error */}
        {bookingMutation.data?.error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Booking Error</AlertTitle>
            <AlertDescription>{bookingMutation.data.error}</AlertDescription>
          </Alert>
        )}

        {/* Availability Picker */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Check Availability</CardTitle>
            <CardDescription>
              Select your preferred date and time
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setHasCheckedAvailability(false);
                    setAvailabilityCheckParams(null);
                  }}
                  min={new Date().toISOString().split("T")[0]}
                  className="border-primary/30"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => {
                    setTime(e.target.value);
                    setHasCheckedAvailability(false);
                    setAvailabilityCheckParams(null);
                  }}
                  className="border-primary/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-base py-1 px-3">
                  {DEFAULT_DURATION_MINUTES} minutes
                </Badge>
                <span className="text-sm text-muted-foreground">
                  (Standard flight time)
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckAvailability}
              disabled={!date || !time || isCheckingAvailability}
              variant="outline"
              className="w-full border-2 border-accent text-accent hover:bg-accent/10"
            >
              {isCheckingAvailability ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Availability"
              )}
            </Button>

            {/* Availability Status */}
            {hasCheckedAvailability &&
              !isCheckingAvailability &&
              availabilityData &&
              !availabilityData.error && (
                <div className="mt-4">
                  {isSlotAvailable() ? (
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertTitle className="text-green-600 dark:text-green-400">
                        Available
                      </AlertTitle>
                      <AlertDescription className="text-green-600/80 dark:text-green-400/80">
                        This time slot is available for booking.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Unavailable</AlertTitle>
                      <AlertDescription>
                        This time slot conflicts with an existing booking.
                        Please choose a different time.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Show busy blocks */}
                  {availabilityData.busy.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">
                        Busy times today:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availabilityData.busy.map((block) => (
                          <Badge
                            key={`${block.start}-${block.end}`}
                            variant="secondary"
                            className="text-xs"
                          >
                            {new Date(block.start).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(block.end).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </CardContent>
        </Card>

        {/* Reservation Form */}
        <Card className="mb-6 border-primary/20">
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
            <CardDescription>
              Complete the form to request your flight
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Legal Name *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="border-primary/30"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passengerCount">Passenger Count *</Label>
                <Input
                  id="passengerCount"
                  type="number"
                  min="1"
                  max="2"
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(e.target.value)}
                  className="border-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum 2 passengers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalWeight">Total Weight (lbs) *</Label>
                <Input
                  id="totalWeight"
                  type="number"
                  min="1"
                  value={totalWeight}
                  onChange={(e) => setTotalWeight(e.target.value)}
                  placeholder="350"
                  className="border-primary/30"
                />
                <p className="text-xs text-muted-foreground">
                  Combined weight of all passengers
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information..."
                className="border-primary/30 min-h-[100px]"
              />
            </div>

            {/* Booking Buttons */}
            <div className="space-y-3 pt-4 border-t border-border">
              <Button
                onClick={() => handleBooking("coins")}
                disabled={
                  !isSlotAvailable() ||
                  !isFormValid() ||
                  balance < COIN_COST ||
                  bookingMutation.isPending
                }
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Reserve with ${COIN_COST.toLocaleString()} Coins`
                )}
              </Button>
              {balance < COIN_COST && (
                <p className="text-sm text-destructive text-center">
                  Insufficient coins. You need {COIN_COST.toLocaleString()}{" "}
                  coins (you have {balance.toLocaleString()})
                </p>
              )}

              <Button
                onClick={() => handleBooking("paid")}
                disabled={
                  !isSlotAvailable() ||
                  !isFormValid() ||
                  bookingMutation.isPending
                }
                variant="outline"
                className="w-full border-2 border-accent text-accent hover:bg-accent/10"
              >
                {bookingMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Reserve (Paid)"
                )}
              </Button>
            </div>
            {/* Safe Mode: Request Booking */}
            <div className="space-y-3 pt-4 border-t border-border">
              {safeConfirmed ? (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-600 dark:text-green-400">
                    Request Received
                  </AlertTitle>
                  <AlertDescription className="text-green-600/80 dark:text-green-400/80">
                    We'll confirm your booking shortly.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  onClick={() => {
                    toast.success("Request received — we'll confirm shortly");
                    setSafeConfirmed(true);
                  }}
                  disabled={
                    !name.trim() ||
                    !email.trim() ||
                    !phone.trim() ||
                    !date ||
                    !time
                  }
                  variant="outline"
                  className="w-full border-2 border-primary/50 text-foreground hover:bg-primary/10"
                  data-ocid="helicopter.form.request_booking_button"
                >
                  Request Booking
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Check real-time availability from the pilot's Google Calendar
            </p>
            <p>• Complete your reservation details and choose payment method</p>
            <p>• Your booking is instantly added to the pilot's calendar</p>
            <p>• Both you and the pilot receive confirmation emails</p>
            <p>
              • Paid bookings will be marked as "Payment Pending" until
              processed
            </p>
          </CardContent>
        </Card>

        {/* Block 65 / Block 67 — Pilot Calendar Control Panel */}
        <div className="mt-6">
          <PilotCalendarPanel
            availabilitySlots={availabilitySlots}
            pilotSlots={pilotSlots}
            pilotOverrides={pilotOverrides}
            setPilotOverride={setPilotOverride}
            addPilotSlot={addPilotSlot}
            removePilotSlot={removePilotSlot}
            oauthConnectionState={oauthConnectionState}
            oauthCalendars={oauthCalendars}
            oauthSelectedCalendarId={oauthSelectedCalendarId}
            oauthConnectedAt={oauthConnectedAt}
            connectGoogleCalendar={connectGoogleCalendar}
            disconnectGoogleCalendar={disconnectGoogleCalendar}
            selectOAuthCalendar={selectOAuthCalendar}
            onSyncNow={syncNow}
            isSyncing={calendarSyncStatus === "syncing"}
            calendarSyncStatus={calendarSyncStatus}
            lastCalendarSync={lastCalendarSync}
          />
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      <Dialog
        open={cancelModalVisible}
        onOpenChange={(open) => {
          if (!open) {
            setCancelModalVisible(false);
            setSelectedResId(null);
          }
        }}
      >
        <DialogContent
          data-ocid="helicopter.cancel_confirm.modal"
          className="max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>Cancel Reservation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this reservation? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 justify-end">
            <Button
              data-ocid="helicopter.cancel_confirm.cancel_button"
              variant="outline"
              onClick={() => {
                setCancelModalVisible(false);
                setSelectedResId(null);
              }}
            >
              No, Keep It
            </Button>
            <Button
              data-ocid="helicopter.cancel_confirm.confirm_button"
              variant="destructive"
              onClick={confirmCancel}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
