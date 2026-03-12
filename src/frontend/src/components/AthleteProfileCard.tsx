import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
/**
 * Block 75 — Athlete Profile Card
 * A bottom sheet that shows a tapped athlete's profile info
 * with an "Invite to Play" primary action (demo toast + local record).
 */
import { Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useInviteRecords } from "../hooks/useInviteRecords";

export interface AthleteProfileCardAthlete {
  id: string;
  displayName: string;
  sport: string;
  sportEmoji: string;
  markerColor: string;
  distanceLabel?: string;
  expiresAt: number;
}

interface AthleteProfileCardProps {
  open: boolean;
  onClose: () => void;
  athlete: AthleteProfileCardAthlete | null;
}

/** Returns a human-readable relative timestamp. */
function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/** Formats ms remaining into "Xm Ys left" or "Expired" */
function formatTimeLeft(expiresAt: number): string {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}m ${secs}s left`;
  }
  return `${secs}s left`;
}

export function AthleteProfileCard({
  open,
  onClose,
  athlete,
}: AthleteProfileCardProps) {
  const { sendInvite, inviteCountFor, lastInviteFor } = useInviteRecords();

  // Unconditional calls (plain functions, not hooks) — rendering is guarded below
  const inviteCount = athlete ? inviteCountFor(athlete.id) : 0;
  const lastInviteTs = athlete ? lastInviteFor(athlete.id) : null;
  const [timeLeft, setTimeLeft] = useState<string>(() =>
    athlete ? formatTimeLeft(athlete.expiresAt) : "",
  );

  // Live countdown — ticks every second while the card is open
  useEffect(() => {
    if (!open || !athlete) return;

    // Set immediately
    setTimeLeft(formatTimeLeft(athlete.expiresAt));

    const interval = setInterval(() => {
      const label = formatTimeLeft(athlete.expiresAt);
      setTimeLeft(label);
      if (label === "Expired") clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [open, athlete]);

  const handleInvite = () => {
    if (!athlete) return;
    sendInvite(athlete.id, athlete.displayName, athlete.sport);
    toast.success("Invite sent (demo)");
  };

  const isExpired = timeLeft === "Expired";

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        data-ocid="athlete_card.panel"
        style={{
          backgroundColor: "#141418",
          borderTop: "1px solid rgba(212,175,55,0.3)",
          // Override default padding from the sheet component
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        className="rounded-t-2xl pb-6 max-h-[80vh]"
      >
        {/* Drag handle indicator */}
        <div className="flex justify-center pt-1 pb-3">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "rgba(212,175,55,0.3)" }}
          />
        </div>

        {athlete ? (
          <>
            <SheetHeader className="px-5 pb-2">
              {/* Sport emoji + name */}
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{
                    backgroundColor: `${athlete.markerColor}22`,
                    border: `2px solid ${athlete.markerColor}66`,
                  }}
                >
                  {athlete.sportEmoji}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle
                    className="text-xl font-bold truncate"
                    style={{ color: "#D4AF37" }}
                  >
                    {athlete.displayName}
                  </SheetTitle>
                  <SheetDescription className="capitalize text-sm mt-0.5">
                    {athlete.sport}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            {/* Metadata rows */}
            <div className="px-5 space-y-3 mb-4">
              {/* Distance row */}
              {athlete.distanceLabel && (
                <div className="flex items-center gap-2">
                  <MapPin
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                  >
                    {athlete.distanceLabel}
                  </span>
                </div>
              )}

              {/* Invite count row — only shown after at least one invite */}
              {inviteCount > 0 && (
                <div
                  className="flex items-center gap-2"
                  data-ocid="athlete_card.invite_count"
                >
                  <Mail
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.72)" }}
                  >
                    Invited {inviteCount} time{inviteCount !== 1 ? "s" : ""}
                    {lastInviteTs !== null && (
                      <span
                        className="ml-1 text-xs"
                        style={{ color: "rgba(255,255,255,0.45)" }}
                      >
                        · Last: {formatTimeAgo(lastInviteTs)}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Status + countdown */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${isExpired ? "bg-gray-500" : "bg-green-400 animate-pulse"}`}
                  />
                  <span
                    className={`text-sm font-semibold ${isExpired ? "text-gray-500" : "text-green-400"}`}
                  >
                    {isExpired ? "Offline" : "Out Now"}
                  </span>
                </div>
                <span
                  className="text-xs"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {timeLeft}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div
              className="mx-5 mb-4"
              style={{ height: 1, backgroundColor: "rgba(212,175,55,0.15)" }}
            />

            {/* Invite to Play CTA */}
            <div className="px-5">
              <button
                type="button"
                data-ocid="athlete_card.invite_button"
                onClick={handleInvite}
                disabled={isExpired}
                className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#D4AF37", color: "#0B0B0D" }}
              >
                {isExpired ? "Player Offline" : "Invite to Play"}
              </button>
            </div>
          </>
        ) : (
          // Empty state — athlete null, render nothing meaningful
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              No athlete selected.
            </p>
          </div>
        )}

        {/* Explicit close button for accessibility */}
        <SheetClose data-ocid="athlete_card.close_button" className="sr-only" />
      </SheetContent>
    </Sheet>
  );
}
