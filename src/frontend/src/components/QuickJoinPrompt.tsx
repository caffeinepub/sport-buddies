import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, DoorOpen, MapPin, Users, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { GameSession } from "../hooks/useGameSessions";
import { SPORT_COLOR, SPORT_EMOJI } from "../hooks/useMapMarkers";
import { computeHeatLevel } from "../lib/gameHeat";

interface QuickJoinPromptProps {
  games: GameSession[];
  currentSport: string | null;
  joinSession: (id: string) => void;
  leaveSession: (id: string) => void;
  onViewLobby: (id: string) => void;
}

function formatStartTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  return isToday
    ? `Today ${timeStr}`
    : `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${timeStr}`;
}

const REJOIN_WINDOW_MS = 5_000;

export function QuickJoinPrompt({
  games,
  currentSport,
  joinSession,
  leaveSession,
  onViewLobby,
}: QuickJoinPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [joined, setJoined] = useState(false);
  const [leftGameId, setLeftGameId] = useState<string | null>(null);

  // Track the most recent "left game" for the rejoin window
  const rejoinGameIdRef = useRef<string | null>(null);
  const rejoinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rejoinToastIdRef = useRef<string | number | null>(null);

  // Clear the rejoin window (called on timeout, on joining another game, or on unmount)
  const clearRejoinWindow = useCallback(() => {
    rejoinGameIdRef.current = null;
    if (rejoinTimerRef.current) {
      clearTimeout(rejoinTimerRef.current);
      rejoinTimerRef.current = null;
    }
    if (rejoinToastIdRef.current !== null) {
      toast.dismiss(rejoinToastIdRef.current);
      rejoinToastIdRef.current = null;
    }
  }, []);

  useEffect(() => () => clearRejoinWindow(), [clearRejoinWindow]);

  if (!currentSport || dismissed) return null;

  const now = Date.now();

  // Include games the user is already in so we can show "View Lobby" / "Leave Game"
  const eligible = games
    .filter((g) => {
      if (g.archived) return false;
      if (g.id === leftGameId) return false; // hide a game the user just left
      if (g.sport.toLowerCase() !== currentSport.toLowerCase()) return false;
      if (
        g.participants.length >= g.maxPlayers &&
        !g.participants.includes("me")
      )
        return false;
      if (new Date(g.startTime).getTime() <= now) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  // After joining, check if the joined game is still eligible
  if (joined) {
    const joinedGame = eligible.find((g) => g.participants.includes("me"));
    if (!joinedGame) return null;
  }

  if (eligible.length === 0) {
    // Show the "no active games" empty state when user left and nothing remains
    if (leftGameId) {
      return (
        <div
          data-ocid="quick_join.empty_state"
          className="mx-0 mb-4 rounded-2xl overflow-hidden px-4 py-3 text-center text-sm text-muted-foreground"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(255,255,255,0.08)",
          }}
        >
          No active games —{" "}
          <button
            type="button"
            data-ocid="quick_join.empty_start_one"
            className="font-semibold underline underline-offset-2"
            style={{ color: "#D4AF37" }}
            onClick={() => setDismissed(true)}
          >
            start one
          </button>
        </div>
      );
    }
    return null;
  }

  // Prefer a game the user hasn't joined yet; fall back to one they're already in
  const game =
    eligible.find((g) => !g.participants.includes("me")) ?? eligible[0];

  const isAlreadyIn = game.participants.includes("me");
  const heatLevel = computeHeatLevel(game);

  const sportKey = game.sport.toLowerCase();
  const emoji = SPORT_EMOJI[sportKey] ?? SPORT_EMOJI.default ?? "🏅";
  const color = SPORT_COLOR[sportKey] ?? SPORT_COLOR.default ?? "#D4AF37";
  const openSpots = game.maxPlayers - game.participants.length;

  const handleJoin = () => {
    // If user joins a new game, cancel any pending rejoin window
    clearRejoinWindow();
    joinSession(game.id);
    setJoined(true);
    toast.success(`Joined! Game starts at ${formatStartTime(game.startTime)}`);
    onViewLobby(game.id);
  };

  const handleViewLobby = () => {
    onViewLobby(game.id);
  };

  const handleLeave = () => {
    const leavingGameId = game.id;

    // Cancel any existing rejoin window (handles multiple-leave taps)
    clearRejoinWindow();

    // Remove user from the game immediately
    leaveSession(leavingGameId);
    setLeftGameId(leavingGameId);
    setJoined(false);

    // Track the most recent left game for potential rejoin
    rejoinGameIdRef.current = leavingGameId;

    // Show compact undo toast
    const toastId = toast("Left game", {
      duration: REJOIN_WINDOW_MS,
      action: {
        label: "Rejoin",
        onClick: () => {
          const targetId = rejoinGameIdRef.current;
          if (!targetId) return;

          // Graceful failure: check if game still exists and has room
          const target = games.find((g) => g.id === targetId);
          if (!target || target.archived) {
            toast.error("That game is no longer available.");
            clearRejoinWindow();
            setLeftGameId(null);
            return;
          }
          if (
            target.participants.length >= target.maxPlayers &&
            !target.participants.includes("me")
          ) {
            toast.error("Game is full — can't rejoin.");
            clearRejoinWindow();
            setLeftGameId(null);
            return;
          }

          // Restore user to the game
          joinSession(targetId);
          clearRejoinWindow();
          setLeftGameId(null);
          setJoined(true);
          toast.success("You're back in the game!");
        },
      },
    });

    rejoinToastIdRef.current = toastId;

    // Auto-expire the rejoin window after 5 s
    rejoinTimerRef.current = setTimeout(() => {
      rejoinGameIdRef.current = null;
      rejoinToastIdRef.current = null;
      rejoinTimerRef.current = null;
    }, REJOIN_WINDOW_MS);
  };

  return (
    <div
      data-ocid="quick_join.card"
      className="relative mx-0 mb-4 rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1.5px solid ${color}55`,
        boxShadow: `0 4px 24px ${color}22`,
      }}
    >
      {/* Top accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
      />

      {/* Dismiss button */}
      <button
        type="button"
        data-ocid="quick_join.dismiss_button"
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors z-10"
        aria-label="Dismiss quick join"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="p-4 pr-8">
        {/* Header row: label */}
        <div className="flex items-center gap-1.5 mb-3">
          {isAlreadyIn ? (
            <DoorOpen className="w-3 h-3" style={{ color }} />
          ) : (
            <Zap className="w-3 h-3" style={{ color }} />
          )}
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color }}
          >
            {isAlreadyIn ? "You're In This Game" : "Quick Join"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Sport emoji */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
            style={{
              backgroundColor: `${color}22`,
              border: `1px solid ${color}33`,
            }}
          >
            {emoji}
          </div>

          {/* Game info */}
          <div className="flex-1 min-w-0">
            <p
              data-ocid="quick_join.sport_label"
              className="font-bold text-sm text-foreground leading-tight"
            >
              {game.sport}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span
                data-ocid="quick_join.location"
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[120px]">
                  {game.locationLabel}
                </span>
              </span>
              <span
                data-ocid="quick_join.time"
                className="flex items-center gap-1 text-xs text-muted-foreground"
              >
                <Clock className="w-3 h-3 flex-shrink-0" />
                {formatStartTime(game.startTime)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <Badge
                data-ocid="quick_join.player_count"
                variant="secondary"
                className="text-[10px] px-2 py-0 h-5 font-semibold"
                style={{
                  backgroundColor: `${color}22`,
                  color,
                  border: `1px solid ${color}44`,
                }}
              >
                <Users className="w-2.5 h-2.5 mr-1" />
                {isAlreadyIn
                  ? `${game.participants.length}/${game.maxPlayers} players`
                  : `${game.participants.length}/${game.maxPlayers} · ${openSpots} spot${openSpots !== 1 ? "s" : ""} left`}
              </Badge>
            </div>
            {/* Block 111 — Heat urgency signals */}
            {heatLevel === "high" && (
              <div className="mt-1.5 flex flex-col gap-0.5">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "#f97316" }}
                >
                  👥 Players joining now
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "#fb923c" }}
                >
                  ⚡ Spots filling fast
                </span>
              </div>
            )}
            {heatLevel === "medium" && (
              <div className="mt-1.5">
                <span
                  className="text-[11px] font-medium"
                  style={{ color: "#d97706" }}
                >
                  🟠 Building players
                </span>
              </div>
            )}
            {heatLevel === "low" && (
              <div className="mt-1.5">
                <span className="text-[11px] text-muted-foreground">
                  ⚪ Open game
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isAlreadyIn ? (
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <Button
                data-ocid="quick_join.view_lobby_button"
                onClick={handleViewLobby}
                size="sm"
                className="font-bold text-xs px-4 h-9 rounded-xl shadow-lg transition-all active:scale-95"
                style={{
                  backgroundColor: color,
                  color: "#000",
                  boxShadow: `0 4px 16px ${color}55`,
                }}
              >
                View Lobby
              </Button>
              <button
                type="button"
                data-ocid="quick_join.leave_button"
                onClick={handleLeave}
                className="text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors underline underline-offset-2 px-1"
              >
                Leave Game
              </button>
            </div>
          ) : (
            <Button
              data-ocid="quick_join.join_button"
              onClick={handleJoin}
              size="sm"
              className="flex-shrink-0 font-bold text-xs px-4 h-9 rounded-xl shadow-lg transition-all active:scale-95"
              style={{
                backgroundColor: color,
                color: "#000",
                boxShadow: `0 4px 16px ${color}55`,
              }}
            >
              Join Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
