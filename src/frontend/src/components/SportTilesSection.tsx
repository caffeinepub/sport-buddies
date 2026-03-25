import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSport } from "../context/SportContext";

interface SportTile {
  emoji: string;
  name: string;
  bg: string;
  text: string;
  contextSport?: string;
}

const SPORT_TILES: SportTile[] = [
  {
    emoji: "🏐",
    name: "Volleyball",
    bg: "bg-teal-900/60",
    text: "text-teal-200",
    contextSport: "Volleyball",
  },
  {
    emoji: "🎾",
    name: "Tennis",
    bg: "bg-lime-900/60",
    text: "text-lime-200",
    contextSport: "Tennis",
  },
  {
    emoji: "🏓",
    name: "Pickleball",
    bg: "bg-yellow-900/60",
    text: "text-yellow-200",
    contextSport: "Pickleball",
  },
  {
    emoji: "⚽",
    name: "Soccer",
    bg: "bg-emerald-900/60",
    text: "text-emerald-200",
    contextSport: "Soccer",
  },
  {
    emoji: "🏀",
    name: "Basketball",
    bg: "bg-orange-900/60",
    text: "text-orange-200",
    contextSport: "Basketball",
  },
  {
    emoji: "🏄",
    name: "Surfing",
    bg: "bg-sky-900/60",
    text: "text-sky-200",
    contextSport: "Surfing",
  },
  {
    emoji: "🪂",
    name: "Paragliding",
    bg: "bg-violet-900/60",
    text: "text-violet-200",
    contextSport: "Paragliding",
  },
  {
    emoji: "♿",
    name: "Wheelchair Basketball",
    bg: "bg-amber-900/60",
    text: "text-amber-200",
    contextSport: "Wheelchair Basketball",
  },
  {
    emoji: "🤸",
    name: "Adaptive Sports",
    bg: "bg-rose-900/60",
    text: "text-rose-200",
    contextSport: "Adaptive Sports",
  },
  {
    emoji: "🧠",
    name: "Mental Health Training",
    bg: "bg-purple-900/60",
    text: "text-purple-200",
    contextSport: "Mental Health Training",
  },
];

const SUPPORTED_MAP_SPORTS = new Set([
  "soccer",
  "basketball",
  "tennis",
  "running",
  "swimming",
  "cycling",
  "yoga",
]);

export function SportTilesSection() {
  const { activateSport, sportStatus, locationEnabled, emergencyState } =
    useSport();
  const navigate = useNavigate();

  const handleTileTap = (tile: SportTile) => {
    const sportKey = (tile.contextSport ?? "").toLowerCase();
    if (SUPPORTED_MAP_SPORTS.has(sportKey)) {
      if (
        sportStatus !== "active" &&
        locationEnabled &&
        emergencyState !== "triggered"
      ) {
        try {
          activateSport(tile.contextSport!);
        } catch {
          // ignore
        }
      }
      navigate({ to: "/map" });
    } else {
      toast.info(`${tile.name} games coming soon`);
    }
  };

  return (
    <section
      data-ocid="sport_tiles.section"
      className="w-full max-w-sm space-y-3"
    >
      {/* Header */}
      <div data-ocid="sport_tiles.header" className="text-center space-y-0.5">
        <h2 className="text-lg font-extrabold tracking-widest uppercase text-foreground">
          Sports
        </h2>
        <p className="text-xs text-muted-foreground tracking-wider">
          Tap a sport to find games
        </p>
      </div>

      {/* Grid */}
      <div data-ocid="sport_tiles.list" className="grid grid-cols-2 gap-3">
        {SPORT_TILES.map((tile, idx) => (
          <button
            key={tile.name}
            type="button"
            data-ocid={`sport_tiles.item.${idx + 1}`}
            onClick={() => handleTileTap(tile)}
            className={`
              flex flex-col items-center justify-center gap-2
              rounded-xl px-3 py-5
              min-h-[100px]
              border border-white/10
              ${tile.bg}
              active:scale-95 transition-transform duration-100
              hover:brightness-110
              shadow-md
              cursor-pointer
              select-none
            `}
          >
            <span className="text-4xl leading-none">{tile.emoji}</span>
            <span
              className={`text-xs font-bold uppercase tracking-wide text-center leading-tight ${tile.text}`}
            >
              {tile.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
