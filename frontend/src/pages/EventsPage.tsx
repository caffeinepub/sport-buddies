import { useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Calendar, Users, MapPin, Plus } from "lucide-react";
import { useEventJoinState } from "../hooks/useEventJoinState";
import ScreenBanner from "../components/ScreenBanner";

export const MOCK_EVENTS = [
  {
    id: "1",
    title: "Sunday Soccer Pickup",
    sport: "Soccer",
    date: "Sun Feb 28",
    time: "10:00 AM",
    location: "Central Park",
    baseParticipants: 8,
    maxParticipants: 16,
    hostId: "user-abc",
    description: "Casual pickup soccer game at Central Park. All skill levels welcome! Bring water and cleats.",
    participants: ["Alex T.", "Maria G.", "Chris E.", "Lisa A.", "Mark J.", "Rachel G.", "David M.", "Sophie T."],
  },
  {
    id: "2",
    title: "Basketball 3v3",
    sport: "Basketball",
    date: "Sat Feb 27",
    time: "2:00 PM",
    location: "Riverside Courts",
    baseParticipants: 5,
    maxParticipants: 6,
    hostId: "user-def",
    description: "Competitive 3v3 basketball tournament. Teams of 3, round-robin format. Winner gets bragging rights!",
    participants: ["Jordan B.", "Tyler W.", "Sam K.", "Casey R.", "Morgan L."],
  },
  {
    id: "3",
    title: "Morning Run Club",
    sport: "Running",
    date: "Mon Mar 1",
    time: "7:00 AM",
    location: "Waterfront Trail",
    baseParticipants: 12,
    maxParticipants: 30,
    hostId: "current-user-123",
    description: "Weekly morning run along the waterfront trail. 5K route, all paces welcome. We finish with coffee!",
    participants: ["Emma W.", "Ryan C.", "Olivia M.", "James W.", "Ava D.", "Noah P.", "Isabella F.", "Liam H.", "Mia S.", "Ethan B.", "Charlotte N.", "Oliver K."],
  },
  {
    id: "4",
    title: "Tennis Doubles",
    sport: "Tennis",
    date: "Tue Mar 2",
    time: "6:00 PM",
    location: "City Tennis Club",
    baseParticipants: 3,
    maxParticipants: 4,
    hostId: "user-ghi",
    description: "Friendly doubles match at the City Tennis Club. Intermediate level. Rackets available to borrow.",
    participants: ["Anna C.", "Ben P.", "Carol K."],
  },
  {
    id: "5",
    title: "Yoga in the Park",
    sport: "Yoga",
    date: "Wed Mar 3",
    time: "8:00 AM",
    location: "Riverside Park",
    baseParticipants: 15,
    maxParticipants: 25,
    hostId: "user-jkl",
    description: "Outdoor yoga session for all levels. Bring your mat and enjoy the fresh air. Instructor-led flow.",
    participants: ["Zoe L.", "Lily M.", "Grace T.", "Chloe R.", "Ella B.", "Nora S.", "Aria F.", "Scarlett H.", "Violet P.", "Aurora K.", "Penelope N.", "Luna W.", "Hazel D.", "Stella C.", "Ivy J."],
  },
  {
    id: "6",
    title: "Basketball Pickup Game",
    sport: "Basketball",
    date: "Thu Mar 4",
    time: "5:30 PM",
    location: "Downtown Gym",
    baseParticipants: 7,
    maxParticipants: 10,
    hostId: "user-mno",
    description: "Casual pickup basketball at the downtown gym. Full court, 5v5. All skill levels welcome.",
    participants: ["Derek F.", "Marcus T.", "Kevin L.", "Andre W.", "Darius M.", "Jamal B.", "Terrence H."],
  },
];

const SPORT_FILTERS = ["All", "Soccer", "Basketball", "Running", "Tennis", "Yoga"];

export default function EventsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSport, setSelectedSport] = useState("All");
  const { isJoined, getParticipantCount } = useEventJoinState();

  const filtered =
    selectedSport === "All"
      ? MOCK_EVENTS
      : MOCK_EVENTS.filter((e) => e.sport === selectedSport);

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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No events for {selectedSport} yet.</p>
          </div>
        )}
        {filtered.map((event) => {
          const joined = isJoined(event.id);
          const count = getParticipantCount(event.id, event.baseParticipants);
          return (
            <button
              key={event.id}
              onClick={() => navigate({ to: "/events/$id", params: { id: event.id } })}
              className="w-full bg-charcoal rounded-xl p-4 text-left hover:opacity-90 active:scale-[0.99] transition-all border border-white/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{event.title}</p>
                  <span className="text-xs text-gold/70 font-medium">{event.sport}</span>
                </div>
                {joined && (
                  <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1 ml-2 flex-shrink-0">
                    ✓ Joined
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {event.date} · {event.time}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <Users className="w-3 h-3" />
                <span>{count}/{event.maxParticipants} joined</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
