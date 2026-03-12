/**
 * Block 85 — Game Lobby Screen
 * Block 88 — Countdown Timer added.
 * Block 89 — Game Full / Locked State.
 */
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { useGameSessions } from "../hooks/useGameSessions";

interface Props {
  open: boolean;
  onClose: () => void;
  gameId: string | null;
}

/** Known participant display names */
const PARTICIPANT_NAMES: Record<string, string> = {
  me: "You",
  demo_alex: "Alex R.",
  demo_jordan: "Jordan M.",
  demo_sam: "Sam K.",
};

function getDisplayName(id: string): string {
  return PARTICIPANT_NAMES[id] ?? id;
}

/** Format an ISO date string nicely: "Mon Mar 9 · 3:00 PM" */
function formatStartTime(iso: string): string {
  try {
    const d = new Date(iso);
    const dayLabel = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const timeLabel = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dayLabel} · ${timeLabel}`;
  } catch {
    return iso;
  }
}

/** Compute countdown label from an ISO startTime string. */
function computeCountdown(startTime: string): string {
  const diffMs = new Date(startTime).getTime() - Date.now();
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes <= 0) return "Game starting now";
  if (totalMinutes < 60)
    return `Game starts in ${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (mins === 0)
    return `Game starts in ${hours} hour${hours === 1 ? "" : "s"}`;
  return `Game starts in ${hours} hour${hours === 1 ? "" : "s"} ${mins} minute${mins === 1 ? "" : "s"}`;
}

/** Returns a human-readable countdown string, updated every 60 seconds. */
function useCountdown(startTime: string): string {
  const [label, setLabel] = useState(() => computeCountdown(startTime));

  useEffect(() => {
    setLabel(computeCountdown(startTime));
    const id = setInterval(() => {
      setLabel(computeCountdown(startTime));
    }, 60000);
    return () => clearInterval(id);
  }, [startTime]);

  return label;
}

export function GameDetailCard({ open, onClose, gameId }: Props) {
  const { getSession, joinSession, leaveSession } = useGameSessions();
  const game = getSession(gameId);

  const countdown = useCountdown(game?.startTime ?? new Date().toISOString());
  const isStartingNow = countdown === "Game starting now";

  const isHost = game?.hostId === "me";
  const isParticipant = game?.participants.includes("me") ?? false;
  const participantCount = game?.participants.length ?? 0;
  const fillPercent =
    game != null
      ? Math.min(100, (participantCount / game.maxPlayers) * 100)
      : 0;

  // ── Block 89: Full / Locked state ──────────────────────────────────
  const isFull = game != null && game.participants.length >= game.maxPlayers;
  // Locked = start time is in the past
  const isLocked =
    game != null && new Date(game.startTime).getTime() <= Date.now();

  // Can the non-participant, non-host join?
  const canJoin = !isParticipant && !isHost && !isFull && !isLocked;

  // ───────────────────────────────────────────────────────────────────

  const handleJoin = () => {
    if (!game || !canJoin) return;
    joinSession(game.id);
  };

  const handleLeave = () => {
    if (!game) return;
    leaveSession(game.id);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        data-ocid="game_lobby.panel"
        style={{
          backgroundColor: "#141418",
          borderTop: "1px solid rgba(212,175,55,0.3)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        className="rounded-t-2xl pb-6 max-h-[90vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-1 pb-3">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "rgba(212,175,55,0.3)" }}
          />
        </div>

        {game ? (
          <>
            <SheetHeader className="px-5 pb-2">
              {/* Sport emoji + sport name */}
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.12)",
                    border: "2px solid rgba(212,175,55,0.4)",
                  }}
                >
                  {(() => {
                    const sportKey = game.sport.toLowerCase();
                    const emojiMap: Record<string, string> = {
                      soccer: "⚽",
                      basketball: "🏀",
                      tennis: "🎾",
                      running: "🏃",
                      swimming: "🏊",
                      cycling: "🚴",
                      yoga: "🧘",
                    };
                    return emojiMap[sportKey] ?? "🏅";
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle
                    className="text-xl font-bold truncate capitalize"
                    style={{ color: "#D4AF37" }}
                  >
                    {game.sport}
                  </SheetTitle>
                  <SheetDescription className="text-sm mt-0.5">
                    🎮 Game Lobby
                  </SheetDescription>
                </div>

                {/* ── Block 89: Full / Locked badge beside title ── */}
                {isLocked && (
                  <span
                    data-ocid="game_lobby.locked_badge"
                    className="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(156,163,175,0.15)",
                      color: "#9ca3af",
                      border: "1px solid rgba(156,163,175,0.3)",
                    }}
                  >
                    🔒 Locked
                  </span>
                )}
                {!isLocked && isFull && (
                  <span
                    data-ocid="game_lobby.full_badge"
                    className="text-xs px-2 py-1 rounded-full font-bold flex-shrink-0"
                    style={{
                      backgroundColor: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    ⛔ Full
                  </span>
                )}
              </div>
            </SheetHeader>

            {/* Metadata rows */}
            <div className="px-5 space-y-3 mb-4">
              {/* Host */}
              <div className="flex items-center gap-2">
                <span className="text-base">👑</span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {game.hostId === "me" ? "You" : game.hostName}
                </span>
                {isHost && (
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium ml-auto"
                    style={{
                      backgroundColor: "rgba(212,175,55,0.15)",
                      color: "#D4AF37",
                      border: "1px solid rgba(212,175,55,0.3)",
                    }}
                  >
                    You're hosting
                  </span>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <span className="text-base">📍</span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {game.locationLabel}
                </span>
              </div>

              {/* Start time */}
              <div className="flex items-center gap-2">
                <span className="text-base">🕐</span>
                <span
                  className="text-sm"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  {formatStartTime(game.startTime)}
                </span>
              </div>

              {/* ── Countdown timer (Block 88) ── */}
              <div
                className="flex items-center gap-2"
                data-ocid="game_lobby.countdown"
              >
                <span className="text-base">⏱</span>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isLocked
                      ? "#9ca3af"
                      : isStartingNow
                        ? "#4ade80"
                        : "rgba(255,255,255,0.75)",
                  }}
                >
                  {isLocked ? "Game Locked — start time passed" : countdown}
                </span>
              </div>

              {/* Players count + progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">👥</span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      {participantCount} / {game.maxPlayers} players
                    </span>
                  </div>
                  {isFull && !isLocked && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-bold"
                      style={{
                        backgroundColor: "rgba(239,68,68,0.15)",
                        color: "#f87171",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                    >
                      Full
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div
                  className="w-full rounded-full overflow-hidden"
                  style={{
                    height: 6,
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${fillPercent}%`,
                      backgroundColor: isLocked
                        ? "#6b7280"
                        : fillPercent >= 100
                          ? "#f87171"
                          : "#D4AF37",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Player List ── */}
            <div className="px-5 mb-4" data-ocid="game_lobby.player_list">
              {/* Section header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">👥</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    Players
                  </span>
                </div>
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.12)",
                    color: "#D4AF37",
                    border: "1px solid rgba(212,175,55,0.25)",
                  }}
                >
                  {participantCount}
                </span>
              </div>

              {/* Scrollable list */}
              <div
                className="space-y-2 overflow-y-auto"
                style={{ maxHeight: "36vh" }}
              >
                {game.participants.map((pid, idx) => {
                  const displayName = getDisplayName(pid);
                  const initial = displayName.charAt(0).toUpperCase();
                  const isMe = pid === "me";
                  const isGameHost = pid === game.hostId;

                  return (
                    <div
                      key={pid}
                      data-ocid={`game_lobby.player.item.${idx + 1}`}
                      className="flex items-center gap-3 py-2 px-3 rounded-xl"
                      style={{
                        backgroundColor: isMe
                          ? "rgba(212,175,55,0.08)"
                          : "rgba(255,255,255,0.04)",
                        border: isMe
                          ? "1px solid rgba(212,175,55,0.2)"
                          : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {/* Avatar circle */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={
                          isMe
                            ? {
                                backgroundColor: "#D4AF37",
                                color: "#0B0B0D",
                              }
                            : {
                                backgroundColor: "rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.85)",
                              }
                        }
                      >
                        {initial}
                      </div>

                      {/* Name */}
                      <span
                        className="flex-1 text-sm font-medium truncate"
                        style={{
                          color: isMe ? "#D4AF37" : "rgba(255,255,255,0.85)",
                        }}
                      >
                        {displayName}
                      </span>

                      {/* Host badge */}
                      {isGameHost && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={{
                            backgroundColor: "rgba(212,175,55,0.15)",
                            color: "#D4AF37",
                            border: "1px solid rgba(212,175,55,0.3)",
                          }}
                        >
                          Host 👑
                        </span>
                      )}
                    </div>
                  );
                })}

                {game.participants.length === 0 && (
                  <p
                    className="text-sm text-center py-4"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    No players yet. Be the first to join!
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div
              className="mx-5 mb-4"
              style={{ height: 1, backgroundColor: "rgba(212,175,55,0.15)" }}
            />

            {/* Action buttons */}
            <div className="px-5">
              {isHost ? (
                // Host sees a muted badge — no join/leave button
                <div
                  className="w-full py-3 rounded-xl text-center text-sm font-semibold"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.08)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    color: "rgba(212,175,55,0.7)",
                  }}
                >
                  👑 You're the host
                </div>
              ) : isParticipant ? (
                <button
                  type="button"
                  data-ocid="game_lobby.leave_button"
                  onClick={handleLeave}
                  className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                  style={{
                    backgroundColor: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }}
                >
                  Leave Game
                </button>
              ) : (
                // ── Block 89: disabled state with Full / Locked label ──
                <button
                  type="button"
                  data-ocid="game_lobby.join_button"
                  onClick={handleJoin}
                  disabled={!canJoin}
                  className="w-full py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isLocked
                      ? "rgba(107,114,128,0.15)"
                      : isFull
                        ? "rgba(239,68,68,0.15)"
                        : "#D4AF37",
                    color: isLocked
                      ? "#9ca3af"
                      : isFull
                        ? "#f87171"
                        : "#0B0B0D",
                    border: isLocked
                      ? "1px solid rgba(107,114,128,0.3)"
                      : isFull
                        ? "1px solid rgba(239,68,68,0.3)"
                        : "none",
                  }}
                >
                  {isLocked
                    ? "🔒 Game Locked"
                    : isFull
                      ? "⛔ Game Full"
                      : "Join Game"}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="px-5 py-8 text-center">
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Game not found.
            </p>
          </div>
        )}

        <SheetClose data-ocid="game_lobby.close_button" className="sr-only" />
      </SheetContent>
    </Sheet>
  );
}
