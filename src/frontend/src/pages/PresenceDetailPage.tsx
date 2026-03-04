import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, MapPin, QrCode } from "lucide-react";

const MOCK_USERS: Record<
  string,
  { name: string; sport: string; status: string; distance: string }
> = {
  "1": {
    name: "Alex M.",
    sport: "Soccer",
    status: "Out Now",
    distance: "0.3 mi",
  },
  "2": {
    name: "Jordan K.",
    sport: "Basketball",
    status: "On My Way",
    distance: "0.7 mi",
  },
  "3": {
    name: "Sam R.",
    sport: "Tennis",
    status: "Planned",
    distance: "1.2 mi",
  },
  "4": {
    name: "Casey L.",
    sport: "Running",
    status: "Out Now",
    distance: "0.5 mi",
  },
  "5": {
    name: "Morgan T.",
    sport: "Cycling",
    status: "Out Now",
    distance: "0.9 mi",
  },
};

export default function PresenceDetailPage() {
  const navigate = useNavigate();
  // Use strict: false to avoid route-id mismatch with nested layout routes
  const { id } = useParams({ strict: false });
  const user =
    id && MOCK_USERS[id]
      ? MOCK_USERS[id]
      : {
          name: "Unknown Buddy",
          sport: "Unknown",
          status: "Unknown",
          distance: "?",
        };

  const statusColor =
    user.status === "Out Now"
      ? "text-green-400"
      : user.status === "On My Way"
        ? "text-yellow-400"
        : "text-muted-foreground";

  return (
    <div className="p-4 max-w-lg mx-auto">
      <button
        type="button"
        onClick={() => navigate({ to: "/map" })}
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Map
      </button>

      <div className="bg-charcoal rounded-xl p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{user.name}</h1>
            <p className="text-muted-foreground">{user.sport}</p>
          </div>
          <span className={`text-sm font-semibold ${statusColor}`}>
            {user.status}
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4" />
          <span>{user.distance} away</span>
        </div>
      </div>

      {/* Public billboard */}
      <div className="bg-charcoal rounded-xl p-4 mb-4">
        <p className="text-sm text-muted-foreground mb-2">Public Billboard</p>
        <input
          type="text"
          disabled
          placeholder="No message set"
          className="w-full bg-transparent text-foreground text-sm border border-white/10 rounded-lg px-3 py-2 opacity-60"
        />
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate({ to: "/events" })}
          className="w-full bg-charcoal rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <Calendar className="w-5 h-5 text-gold" />
          <span className="text-foreground font-medium">Invite to Event</span>
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/scan" })}
          className="w-full bg-charcoal rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <QrCode className="w-5 h-5 text-gold" />
          <span className="text-foreground font-medium">Scan Buddy QR</span>
        </button>
      </div>
    </div>
  );
}
