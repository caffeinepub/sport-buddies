/**
 * Block 82 — Create Game Modal
 * A bottom sheet form for creating a new game session.
 */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Gamepad2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGameSessions } from "../hooks/useGameSessions";
import { SPORT_EMOJI } from "../hooks/useMapMarkers";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultSport: string;
}

export function CreateGameModal({ open, onClose, defaultSport }: Props) {
  const { createSession } = useGameSessions();

  const sportKey = defaultSport.toLowerCase();
  const sportEmoji = SPORT_EMOJI[sportKey] ?? SPORT_EMOJI.default;

  // Default start time: 30 minutes from now formatted for datetime-local input
  function getDefaultStartTime(): string {
    const d = new Date(Date.now() + 30 * 60_000);
    // Format as YYYY-MM-DDTHH:mm
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const [location, setLocation] = useState("Current Location");
  const [startTime, setStartTime] = useState(getDefaultStartTime);
  const [maxPlayers, setMaxPlayers] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      toast.error("Please enter a location.");
      return;
    }
    if (!startTime) {
      toast.error("Please select a start time.");
      return;
    }
    createSession({
      sport: defaultSport,
      locationLabel: location.trim(),
      startTime: new Date(startTime).toISOString(),
      maxPlayers,
      hostId: "me",
      hostName: "You",
    });
    toast.success(`Game created for ${defaultSport}!`);
    onClose();
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
        data-ocid="create_game.panel"
        style={{
          backgroundColor: "#141418",
          borderTop: "1px solid rgba(212,175,55,0.3)",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
        }}
        className="rounded-t-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-1 pb-3">
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "rgba(212,175,55,0.3)" }}
          />
        </div>

        <SheetHeader className="px-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-gold" />
              <SheetTitle
                className="text-lg font-bold"
                style={{ color: "#D4AF37" }}
              >
                Create Game
              </SheetTitle>
            </div>
            <button
              type="button"
              data-ocid="create_game.close_button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="px-5 space-y-4 pb-6">
          {/* Sport — read-only display */}
          <div className="space-y-1.5">
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Sport
            </p>
            <div
              className="w-full flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
              style={{
                backgroundColor: "rgba(212,175,55,0.08)",
                border: "1px solid rgba(212,175,55,0.25)",
                color: "#D4AF37",
              }}
            >
              <span className="text-base">{sportEmoji}</span>
              <span>{defaultSport}</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <label
              htmlFor="game-location"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Location
            </label>
            <input
              id="game-location"
              type="text"
              data-ocid="create_game.location.input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Central Park, Court 3"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              style={{
                backgroundColor: "#1c1c22",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
              }}
            />
          </div>

          {/* Start Time */}
          <div className="space-y-1.5">
            <label
              htmlFor="game-start-time"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Start Time
            </label>
            <input
              id="game-start-time"
              type="datetime-local"
              data-ocid="create_game.start_time.input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              style={{
                backgroundColor: "#1c1c22",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
                colorScheme: "dark",
              }}
            />
          </div>

          {/* Max Players */}
          <div className="space-y-1.5">
            <label
              htmlFor="game-max-players"
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Max Players
            </label>
            <input
              id="game-max-players"
              type="number"
              data-ocid="create_game.max_players.input"
              value={maxPlayers}
              min={2}
              max={30}
              onChange={(e) =>
                setMaxPlayers(
                  Math.max(
                    2,
                    Math.min(30, Number.parseInt(e.target.value) || 2),
                  ),
                )
              }
              className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gold/40"
              style={{
                backgroundColor: "#1c1c22",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.9)",
              }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            data-ocid="create_game.submit_button"
            className="w-full py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform mt-2"
            style={{ backgroundColor: "#D4AF37", color: "#0B0B0D" }}
          >
            Create Game
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
