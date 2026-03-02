import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Calendar, Users, MapPin, Plus } from "lucide-react";
import { useSport } from "../context/SportContext";
import ScreenBanner from "../components/ScreenBanner";

const SPORT_FILTERS = ["All", "Soccer", "Basketball", "Running", "Tennis", "Yoga"];

export default function EventsPage() {
  const navigate = useNavigate();
  const [selectedSport, setSelectedSport] = useState("All");
  const { events, currentUser, sportStatus, currentSport } = useSport();

  // Auto-sync filter with active sport from SportContext
  useEffect(() => {
    if (sportStatus === "active" && currentSport) {
      setSelectedSport(currentSport);
    } else {
      setSelectedSport("All");
    }
  }, [sportStatus, currentSport]);

  const filteredEvents =
    selectedSport === "All"
      ? events
      : events.filter((e) => e.sport === selectedSport);

  return (
    <div className="p-4 max-w-lg mx-auto pb-6">
      <ScreenBanner screenName="EventsScreen" routeName="Events" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 pt-2">
        <h1 className="text-2xl font-bold text-foreground">Events</h1>
        <button
          onClick={() => navigate({ to: "/create-event" })}
          className="flex items-center gap-1 text-sm text-gold hover:opacity-80 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Create
        </button>
      </div>

      {/* Sport filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {SPORT_FILTERS.map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedSport === sport
                ? "bg-gold text-black"
                : "bg-charcoal text-muted-foreground hover:text-foreground"
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="space-y-3">
        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No events for {selectedSport} yet.</p>
          </div>
        )}
        {filteredEvents.map((event) => {
          const isJoined = event.participants.some((p) => p.id === currentUser.id);
          const participantCount = event.participants.length;

          return (
            <button
              key={event.id}
              onClick={() => navigate({ to: "/events/$eventId", params: { eventId: event.id } })}
              className="w-full bg-charcoal rounded-xl p-4 text-left hover:opacity-90 active:scale-[0.99] transition-all border border-white/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{event.title}</p>
                  <span className="text-xs text-gold/70 font-medium">{event.sport}</span>
                </div>
                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  {event.status !== "active" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.status === "completed"
                        ? "bg-blue-900/40 text-blue-400"
                        : "bg-red-900/40 text-red-400"
                    }`}>
                      {event.status === "completed" ? "Completed" : "Canceled"}
                    </span>
                  )}
                  {isJoined && (
                    <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      ✓ Joined
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.datetimeLabel}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.locationLabel}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{participantCount}/{event.capacity} participants</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
