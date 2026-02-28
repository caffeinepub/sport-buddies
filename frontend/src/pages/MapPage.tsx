import { useState, useEffect } from "react";
import { useNavigate, useSearch, useLocation } from "@tanstack/react-router";
import { MapPin, Users, Zap } from "lucide-react";
import ScreenBanner from "../components/ScreenBanner";

const SPORTS = [
  { id: "all", label: "All" },
  { id: "soccer", label: "⚽ Soccer" },
  { id: "basketball", label: "🏀 Basketball" },
  { id: "tennis", label: "🎾 Tennis" },
  { id: "running", label: "🏃 Running" },
  { id: "swimming", label: "🏊 Swimming" },
  { id: "cycling", label: "🚴 Cycling" },
  { id: "yoga", label: "🧘 Yoga" },
];

const MOCK_BUDDIES = [
  { id: "1", name: "Alex R.", sport: "soccer", distance: "0.3 mi", status: "out_now" },
  { id: "2", name: "Jordan M.", sport: "basketball", distance: "0.5 mi", status: "planned" },
  { id: "3", name: "Sam K.", sport: "tennis", distance: "0.8 mi", status: "out_now" },
  { id: "4", name: "Taylor B.", sport: "running", distance: "1.1 mi", status: "planned" },
  { id: "5", name: "Casey L.", sport: "yoga", distance: "1.4 mi", status: "out_now" },
  { id: "6", name: "Morgan P.", sport: "cycling", distance: "1.7 mi", status: "planned" },
];

function getStatusDot(status: string) {
  if (status === "out_now") return "bg-green-400";
  if (status === "on_my_way") return "bg-blue-400";
  return "bg-gray-400";
}

function getStatusLabel(status: string) {
  if (status === "out_now") return "Out Now";
  if (status === "on_my_way") return "On My Way";
  return "Planned";
}

export default function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeName = location.pathname.replace(/^\//, "") || "map";

  const [selectedSport, setSelectedSport] = useState("all");
  const [myStatus, setMyStatus] = useState<string>(() => {
    try {
      return localStorage.getItem("sb_status") || "offline";
    } catch {
      return "offline";
    }
  });

  useEffect(() => {
    const handler = () => {
      try {
        setMyStatus(localStorage.getItem("sb_status") || "offline");
      } catch {
        // ignore
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const handleGoLive = () => {
    localStorage.setItem("sb_status", "out_now");
    setMyStatus("out_now");
  };

  const filtered =
    selectedSport === "all"
      ? MOCK_BUDDIES
      : MOCK_BUDDIES.filter((b) => b.sport === selectedSport);

  const isLive = myStatus === "out_now";

  return (
    <div className="min-h-screen bg-background pb-6">
      <ScreenBanner screenName="MapScreen" routeName="Map" />

      <div className="p-4 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pt-2">
          <h1 className="text-2xl font-bold text-foreground">Nearby Buddies</h1>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-green-400" : myStatus === "on_my_way" ? "bg-blue-400" : "bg-gray-500"}`} />
            <span className="text-xs text-muted-foreground font-medium">
              {isLive ? "Live" : myStatus === "on_my_way" ? "On My Way" : "Offline"}
            </span>
          </div>
        </div>

        {/* Go Live button */}
        {!isLive && (
          <button
            onClick={handleGoLive}
            className="w-full mb-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm active:scale-95 transition-transform"
          >
            <Zap className="w-4 h-4" />
            Go Live
          </button>
        )}
        {isLive && (
          <div className="w-full mb-4 flex items-center justify-center gap-2 bg-green-900/30 border border-green-500/30 text-green-400 rounded-xl py-3 font-semibold text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            You are Live
          </div>
        )}

        {/* Sport filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {SPORTS.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedSport === sport.id
                  ? "bg-gold text-black"
                  : "bg-charcoal text-muted-foreground hover:text-foreground"
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>

        {/* Buddies list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No buddies nearby for this sport.</p>
            </div>
          )}
          {filtered.map((buddy) => (
            <button
              key={buddy.id}
              onClick={() => navigate({ to: "/presence-detail/$id", params: { id: buddy.id } })}
              className="w-full bg-charcoal rounded-xl p-4 flex items-center gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all border border-white/5"
            >
              <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{buddy.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{buddy.sport}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${getStatusDot(buddy.status)}`} />
                  <span className="text-xs text-muted-foreground">{getStatusLabel(buddy.status)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {buddy.distance}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
