import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Phone, Shield, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSport } from "../context/SportContext";

interface SOSLog {
  startedAt: string;
  endedAt?: string;
  actionsTaken: Array<{ action: string; timestamp: string }>;
}

type EmergencyStatus = "SAFE" | "ACTIVE";

export default function EmergencyShieldPage() {
  const { emergencyLevel, resolveEmergency } = useSport();
  const [status, setStatus] = useState<EmergencyStatus>("SAFE");
  const [holdProgress, setHoldProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [currentLog, setCurrentLog] = useState<SOSLog | null>(null);

  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 2000; // 2 seconds
  const COOLDOWN_DURATION = 60; // 60 seconds

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      if (cooldownIntervalRef.current)
        clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const handlePointerDown = () => {
    if (status === "ACTIVE" || cooldown > 0) return;

    // Start hold timer
    const startTime = Date.now();

    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
    }, 16); // ~60fps

    holdTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setHoldProgress(100);
      setShowConfirmModal(true);
    }, HOLD_DURATION);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  const handleConfirmActivation = () => {
    setStatus("ACTIVE");
    setShowConfirmModal(false);
    setHoldProgress(0);

    // Create new log entry
    const newLog: SOSLog = {
      startedAt: new Date().toISOString(),
      actionsTaken: [],
    };
    setCurrentLog(newLog);

    toast.success("Emergency Shield ACTIVATED");
  };

  const handleCancelActivation = () => {
    setShowConfirmModal(false);
    setHoldProgress(0);
  };

  const logAction = (action: string) => {
    if (!currentLog) return;

    const updatedLog = {
      ...currentLog,
      actionsTaken: [
        ...currentLog.actionsTaken,
        { action, timestamp: new Date().toISOString() },
      ],
    };
    setCurrentLog(updatedLog);
  };

  const handleNotifyBuddies = () => {
    logAction("Notify My Buddies");
    toast.info("Notifying your buddies... (stub)");
    console.log("Emergency: Notifying buddies");
  };

  const handleNotifyEmergencyContact = () => {
    logAction("Notify Emergency Contact");
    toast.info("Notifying emergency contact... (stub)");
    console.log("Emergency: Notifying emergency contact");
  };

  const handleCall911 = () => {
    logAction("Call 911");
    console.log("Emergency: Initiating 911 call");
  };

  const handleEndEmergency = () => {
    setShowEndModal(true);
  };

  const confirmEndEmergency = () => {
    if (!currentLog) return;

    // Finalize log entry
    const finalLog: SOSLog = {
      ...currentLog,
      endedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingLogs = localStorage.getItem("sosLogs");
    const logs: SOSLog[] = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(finalLog);
    localStorage.setItem("sosLogs", JSON.stringify(logs));

    // Reset state
    setStatus("SAFE");
    setCurrentLog(null);
    setShowEndModal(false);

    // Start cooldown
    setCooldown(COOLDOWN_DURATION);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    toast.success("Emergency ended. Stay safe.");
  };

  const cancelEndEmergency = () => {
    setShowEndModal(false);
  };

  return (
    <main
      style={{
        marginTop: "56px",
        padding: "16px",
        minHeight: "calc(100vh - 56px)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Emergency Shield
          </h1>
          <p className="text-muted-foreground">
            Hold to activate. Confirmation required.
          </p>
        </div>

        {/* Shield Panel */}
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-black border-4 border-accent rounded-3xl p-8 mb-8 shadow-2xl">
          <div className="flex flex-col items-center gap-6">
            {/* Shield Icon */}
            <div className="relative">
              <Shield className="w-32 h-32 text-accent" strokeWidth={1.5} />
              {status === "ACTIVE" && (
                <div className="absolute inset-0 animate-pulse">
                  <Shield
                    className="w-32 h-32 text-accent opacity-50"
                    strokeWidth={1.5}
                  />
                </div>
              )}
            </div>

            {/* Status */}
            <div className="text-center">
              <div className="text-sm text-primary-foreground/70 mb-1">
                Status
              </div>
              <div
                className={`text-3xl font-bold ${status === "ACTIVE" ? "text-accent animate-pulse" : "text-primary-foreground"}`}
              >
                {status}
              </div>
            </div>
          </div>
        </div>

        {/* Escalation Action Buttons (Block 52) */}
        {emergencyLevel > 0 && (
          <div className="space-y-3 mb-8">
            <h3
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {emergencyLevel === 1 && "Level 1 — Alerting Friends"}
              {emergencyLevel === 2 && "Level 2 — 911 Escalation"}
              {emergencyLevel === 3 && "Level 3 — Rescue Dispatch"}
            </h3>

            {emergencyLevel === 1 && (
              <>
                <button
                  type="button"
                  data-ocid="emergency.cancel_alert.button"
                  onClick={resolveEmergency}
                  className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: "#1A1A1A",
                    color: "#D4AF37",
                    border: "1px solid #D4AF37",
                  }}
                >
                  Cancel Alert
                </button>
                <button
                  type="button"
                  data-ocid="emergency.send_update.button"
                  onClick={() => toast.info("Status update sent.")}
                  className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: "#1A1A1A",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  Send Update to Friends
                </button>
              </>
            )}

            {emergencyLevel === 2 && (
              <>
                <button
                  type="button"
                  data-ocid="emergency.confirm_911.button"
                  onClick={() => toast.success("911 escalation confirmed.")}
                  className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: "#7F1D1D",
                    color: "#ffffff",
                    border: "1px solid #EF4444",
                  }}
                >
                  Confirm 911 Call
                </button>
                <button
                  type="button"
                  data-ocid="emergency.cancel_escalation.button"
                  onClick={resolveEmergency}
                  className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: "#1A1A1A",
                    color: "#D4AF37",
                    border: "1px solid #D4AF37",
                  }}
                >
                  Cancel Escalation
                </button>
              </>
            )}

            {emergencyLevel === 3 && (
              <>
                <button
                  type="button"
                  data-ocid="emergency.confirm_rescue.button"
                  onClick={() => toast.success("Rescue dispatched.")}
                  className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: "#7F1D1D",
                    color: "#ffffff",
                    border: "1px solid #EF4444",
                  }}
                >
                  Confirm Rescue Dispatch
                </button>
                <button
                  type="button"
                  data-ocid="emergency.abort_dispatch.button"
                  onClick={resolveEmergency}
                  className="w-full py-4 rounded-2xl font-bold text-base uppercase tracking-widest transition-all active:scale-95"
                  style={{
                    backgroundColor: "#1A1A1A",
                    color: "#D4AF37",
                    border: "1px solid #D4AF37",
                  }}
                >
                  Abort Dispatch
                </button>
              </>
            )}
          </div>
        )}

        {/* Activation Button */}
        {status === "SAFE" && (
          <div className="mb-8">
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              disabled={cooldown > 0}
              className="relative w-full h-24 bg-destructive hover:bg-destructive/90 disabled:bg-muted disabled:cursor-not-allowed text-destructive-foreground font-bold text-xl rounded-2xl overflow-hidden transition-colors"
            >
              {/* Progress Bar */}
              <div
                className="absolute inset-0 bg-accent/30 transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />

              {/* Button Text */}
              <span className="relative z-10">
                {cooldown > 0 ? `Cooldown: ${cooldown}s` : "HOLD TO ACTIVATE"}
              </span>
            </button>

            {cooldown === 0 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Press and hold for 2 seconds
              </p>
            )}
          </div>
        )}

        {/* Action Buttons (Only when ACTIVE) */}
        {status === "ACTIVE" && (
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Emergency Actions
            </h3>

            <Button
              onClick={handleNotifyBuddies}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 border-accent/50 hover:bg-accent/10"
            >
              <Users className="w-5 h-5 text-accent" />
              <span className="font-semibold">Notify My Buddies</span>
            </Button>

            <Button
              onClick={handleNotifyEmergencyContact}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-4 border-accent/50 hover:bg-accent/10"
            >
              <AlertTriangle className="w-5 h-5 text-accent" />
              <span className="font-semibold">Notify Emergency Contact</span>
            </Button>

            <a href="tel:911" onClick={handleCall911} className="block">
              <Button
                variant="destructive"
                className="w-full justify-start gap-3 h-auto py-4"
              >
                <Phone className="w-5 h-5" />
                <span className="font-semibold">Call 911</span>
              </Button>
            </a>

            <Button
              onClick={handleEndEmergency}
              variant="secondary"
              className="w-full h-auto py-4 mt-6"
            >
              <span className="font-semibold">END EMERGENCY</span>
            </Button>
          </div>
        )}

        {/* View Log Link */}
        <div className="text-center mt-8">
          <Link
            to="/sos-log"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            View Log
          </Link>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate Emergency Shield?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate emergency mode. You can notify contacts and
              access emergency services.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelActivation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmActivation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* End Emergency Modal */}
      <AlertDialog open={showEndModal} onOpenChange={setShowEndModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Emergency?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate emergency mode and start a 60-second cooldown
              period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelEndEmergency}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmEndEmergency}>
              End Emergency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
