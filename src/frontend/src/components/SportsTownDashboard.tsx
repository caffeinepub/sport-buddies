/**
 * Block 94 — Sports Town Dashboard
 * Block 95 — Top Athletes Leaderboard
 * Block 96 — Leaderboard rows: sport badge + View Profile button
 */
import { useState } from "react";
import { useGameSessions } from "../hooks/useGameSessions";
import { useSportActivityCounts } from "../hooks/useSportActivityCounts";
import { useTopAthletes } from "../hooks/useTopAthletes";
import { AthleteProfileCard } from "./AthleteProfileCard";
import type { AthleteProfileCardAthlete } from "./AthleteProfileCard";

const SPORT_EMOJI: Record<string, string> = {
  soccer: "⚽",
  basketball: "🏀",
  tennis: "🎾",
  running: "🏃",
  yoga: "🧘",
  cycling: "🚴",
  swimming: "🏊",
  default: "🏅",
};

const SPORT_COLOR: Record<string, string> = {
  soccer: "#4ADE80",
  basketball: "#FB923C",
  tennis: "#FACC15",
  running: "#60A5FA",
  yoga: "#F472B6",
  cycling: "#C084FC",
  swimming: "#22D3EE",
  default: "#D4AF37",
};

const MEDALS = ["🥇", "🥈", "🥉"];

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getSportEmoji(sport: string): string {
  return SPORT_EMOJI[sport] ?? SPORT_EMOJI.default;
}

function getSportColor(sport: string): string {
  return SPORT_COLOR[sport] ?? SPORT_COLOR.default;
}

interface StatCardProps {
  label: string;
  value: string | number;
  ocid: string;
}

function StatCard({ label, value, ocid }: StatCardProps) {
  return (
    <div
      data-ocid={ocid}
      className="bg-charcoal border border-white/10 rounded-xl p-4 flex flex-col gap-1"
    >
      <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </span>
      <span className="text-2xl font-extrabold text-gold leading-none">
        {value}
      </span>
    </div>
  );
}

export function SportsTownDashboard() {
  const counts = useSportActivityCounts();
  const { sessions } = useGameSessions();
  const topAthletes = useTopAthletes();

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileAthlete, setProfileAthlete] =
    useState<AthleteProfileCardAthlete | null>(null);

  const openProfile = (athlete: {
    id: string;
    name: string;
    topSport: string;
  }) => {
    const sport = athlete.topSport || "soccer";
    setProfileAthlete({
      id: athlete.id,
      displayName: athlete.name,
      sport: capitalize(sport),
      sportEmoji: getSportEmoji(sport),
      markerColor: getSportColor(sport),
      distanceLabel: undefined,
      expiresAt: Date.now() + 10 * 60_000,
    });
    setProfileOpen(true);
  };

  const playersNearby = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const now = Date.now();
  const gamesSoon = sessions.filter((s) => {
    const t = new Date(s.startTime).getTime();
    return t > now && t - now <= 60 * 60_000;
  }).length;
  const activeGames = sessions.length;

  let trendingSport = "—";
  const countEntries = Object.entries(counts);
  if (countEntries.length > 0) {
    const top = countEntries.reduce((best, curr) =>
      curr[1] > best[1] ? curr : best,
    );
    if (top[1] > 0)
      trendingSport = `${SPORT_EMOJI[top[0]] ?? SPORT_EMOJI.default} ${capitalize(top[0])}`;
  }

  return (
    <div data-ocid="sports_town.panel" className="w-full max-w-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base font-extrabold text-gold tracking-wide">
          🏙️ Sports Town
        </span>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Players Nearby"
          value={playersNearby}
          ocid="sports_town.players_nearby.card"
        />
        <StatCard
          label="Games Soon"
          value={gamesSoon}
          ocid="sports_town.games_soon.card"
        />
        <StatCard
          label="Active Games"
          value={activeGames}
          ocid="sports_town.active_games.card"
        />
        <StatCard
          label="Trending Sport"
          value={trendingSport}
          ocid="sports_town.trending_sport.card"
        />
      </div>

      <div
        data-ocid="sports_town.leaderboard.card"
        className="mt-3 bg-charcoal border border-white/10 rounded-xl p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <span className="text-sm font-bold text-gold tracking-wide">
            🏆 Top Athletes
          </span>
        </div>

        {topAthletes.length === 0 ? (
          <p
            data-ocid="sports_town.leaderboard.empty_state"
            className="text-xs text-muted-foreground text-center py-2"
          >
            No activity yet
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {topAthletes.map((athlete, index) => {
              const sport = athlete.topSport || "soccer";
              const sportEmoji = getSportEmoji(sport);
              const sportColor = getSportColor(sport);
              return (
                <div
                  key={athlete.id}
                  data-ocid={`sports_town.leaderboard.item.${index + 1}`}
                  className="flex items-center gap-2"
                >
                  {/* Medal */}
                  <span className="text-base leading-none flex-shrink-0">
                    {MEDALS[index]}
                  </span>

                  {/* Name */}
                  <span className="text-sm font-bold text-foreground flex-1 min-w-0 truncate">
                    {athlete.name}
                  </span>

                  {/* Sport badge */}
                  <span
                    data-ocid={`sports_town.leaderboard.sport_badge.${index + 1}`}
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    style={{
                      backgroundColor: `${sportColor}22`,
                      border: `1px solid ${sportColor}55`,
                      color: sportColor,
                    }}
                  >
                    <span>{sportEmoji}</span>
                    <span>{capitalize(sport)}</span>
                  </span>

                  {/* View Profile */}
                  <button
                    type="button"
                    data-ocid={`sports_town.leaderboard.view_profile_button.${index + 1}`}
                    onClick={() => openProfile(athlete)}
                    className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors active:scale-95"
                    style={{
                      borderColor: "rgba(212,175,55,0.4)",
                      color: "#D4AF37",
                      backgroundColor: "rgba(212,175,55,0.08)",
                    }}
                  >
                    Profile
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AthleteProfileCard
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        athlete={profileAthlete}
      />
    </div>
  );
}
