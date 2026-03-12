/**
 * Block 86 — New Game Notification
 * Block 87 — adds optional onJoin callback wired to toast action button
 * Watches the game sessions storage key for newly created sessions.
 * When a new session appears for the user's active sport, fires a toast.
 * Uses StorageEvent so it triggers even when the user is on another tab.
 */
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { SPORT_EMOJI } from "./useMapMarkers";

const STORAGE_KEY = "sb_game_sessions";
const SEEN_KEY = "sb_game_notifications_seen";

function loadSeenIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

export function useNewGameNotification(
  activeSport: string | null,
  onJoin?: (gameId: string) => void,
) {
  // Keep a ref to seenIds so the effect closure always has the latest value.
  const seenIdsRef = useRef<Set<string>>(loadSeenIds());
  // Keep a ref to onJoin so the storage handler always calls the latest version.
  const onJoinRef = useRef(onJoin);
  onJoinRef.current = onJoin;

  useEffect(() => {
    if (!activeSport) return;

    function checkForNewGames() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const sessions = JSON.parse(raw) as Array<{
          id: string;
          sport: string;
          locationLabel?: string;
          hostId?: string;
        }>;

        const seenIds = seenIdsRef.current;
        let changed = false;

        for (const session of sessions) {
          if (seenIds.has(session.id)) continue;

          // Mark as seen regardless — avoids spamming even for non-matching sport.
          seenIds.add(session.id);
          changed = true;

          // Only notify if sport matches the current user's active sport.
          if (
            activeSport &&
            session.sport?.toLowerCase() === activeSport.toLowerCase() &&
            session.hostId !== "me" // don't notify the creator
          ) {
            const emoji = SPORT_EMOJI[session.sport?.toLowerCase()] ?? "🏅";
            const sessionId = session.id;
            toast(`${emoji} New ${session.sport} game starting nearby.`, {
              duration: 6000,
              action: onJoinRef.current
                ? {
                    label: "Join",
                    onClick: () => onJoinRef.current?.(sessionId),
                  }
                : undefined,
            });
          }
        }

        if (changed) saveSeenIds(seenIds);
      } catch {
        // ignore parse errors
      }
    }

    // Run once on mount to seed seenIds without notifying (for already-existing sessions).
    // We do a silent seed first so we only fire for truly new additions.
    function silentSeed() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const sessions = JSON.parse(raw) as Array<{ id: string }>;
        const seenIds = seenIdsRef.current;
        let changed = false;
        for (const s of sessions) {
          if (!seenIds.has(s.id)) {
            seenIds.add(s.id);
            changed = true;
          }
        }
        if (changed) saveSeenIds(seenIds);
      } catch {
        // ignore
      }
    }

    silentSeed();

    // StorageEvent fires in OTHER tabs when localStorage changes.
    function handleStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) {
        checkForNewGames();
      }
    }

    // Also catch same-tab writes via a custom event dispatched by useGameSessions.
    function handleCustom(e: Event) {
      const key = (e as CustomEvent<{ key: string }>).detail?.key;
      if (key === STORAGE_KEY) {
        checkForNewGames();
      }
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("sb_storage_write", handleCustom as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "sb_storage_write",
        handleCustom as EventListener,
      );
    };
  }, [activeSport]);
}
