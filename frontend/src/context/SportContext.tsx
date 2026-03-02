import React, { createContext, useContext, useState, useCallback } from "react";
import { useCoinBalance } from "../hooks/useCoinBalance";

export type SportStatus = "inactive" | "active";
export type UserMode = "Out Now" | "On My Way" | "Planned";
export type EventStatus = "active" | "completed" | "canceled";

export interface Participant {
  id: string;
  name: string;
}

export interface SportEvent {
  id: string;
  title: string;
  sport: string;
  datetimeLabel: string;
  locationLabel: string;
  hostId: string;
  hostName: string;
  capacity: number;
  participants: Participant[];
  status: EventStatus;
}

export interface CurrentUser {
  id: string;
  name: string;
}

const CURRENT_USER: CurrentUser = { id: "me", name: "You" };

const INITIAL_EVENTS: SportEvent[] = [
  {
    id: "evt-1",
    title: "Sunday Soccer Pickup",
    sport: "Soccer",
    datetimeLabel: "Sun Feb 28 · 10:00 AM",
    locationLabel: "Central Park",
    hostId: "host-1",
    hostName: "Chris",
    capacity: 16,
    participants: [
      { id: "p1", name: "Alex R." },
      { id: "p2", name: "Jordan M." },
      { id: "p3", name: "Maria G." },
      { id: "p4", name: "Chris E." },
    ],
    status: "active",
  },
  {
    id: "evt-2",
    title: "Basketball 3v3",
    sport: "Basketball",
    datetimeLabel: "Sat Feb 27 · 2:00 PM",
    locationLabel: "Riverside Courts",
    hostId: "host-2",
    hostName: "Taylor",
    capacity: 6,
    participants: [
      { id: "p5", name: "Jordan B." },
      { id: "p6", name: "Tyler W." },
      { id: "p7", name: "Sam K." },
    ],
    status: "active",
  },
  {
    id: "evt-3",
    title: "Morning Run Club",
    sport: "Running",
    datetimeLabel: "Mon Mar 1 · 7:00 AM",
    locationLabel: "Waterfront Trail",
    hostId: "me",
    hostName: "You",
    capacity: 30,
    participants: [
      { id: "p8", name: "Emma W." },
      { id: "p9", name: "Ryan C." },
      { id: "p10", name: "Olivia M." },
      { id: "p11", name: "James W." },
      { id: "p12", name: "Ava D." },
    ],
    status: "active",
  },
  {
    id: "evt-4",
    title: "Tennis Doubles",
    sport: "Tennis",
    datetimeLabel: "Tue Mar 2 · 6:00 PM",
    locationLabel: "City Tennis Club",
    hostId: "host-3",
    hostName: "Anna",
    capacity: 4,
    participants: [
      { id: "p13", name: "Anna C." },
      { id: "p14", name: "Ben P." },
      { id: "p15", name: "Carol K." },
    ],
    status: "active",
  },
  {
    id: "evt-5",
    title: "Yoga in the Park",
    sport: "Yoga",
    datetimeLabel: "Wed Mar 3 · 8:00 AM",
    locationLabel: "Riverside Park",
    hostId: "host-4",
    hostName: "Zoe",
    capacity: 25,
    participants: [
      { id: "p16", name: "Zoe L." },
      { id: "p17", name: "Lily M." },
      { id: "p18", name: "Grace T." },
    ],
    status: "active",
  },
];

// Safe localStorage helpers
function safeGetItem(key: string, defaultValue: string): string {
  try {
    if (typeof window === "undefined" || !window.localStorage) return defaultValue;
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // Silently fail
  }
}

function loadAttendedEventIds(): string[] {
  try {
    const stored = safeGetItem("attendedEventIds", "[]");
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export type SportContextType = {
  // Existing state
  sportStatus: SportStatus;
  currentSport: string | null;
  userMode: UserMode;
  locationEnabled: boolean;
  activateSport: (sport: string) => void;
  deactivateSport: () => void;
  setUserMode: (mode: UserMode) => void;
  toggleLocation: () => void;

  // New: current user
  currentUser: CurrentUser;

  // New: events
  events: SportEvent[];
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  completeEvent: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;

  // New: attendance
  attendedEventIds: string[];
  hasAttended: (eventId: string) => boolean;
  markAttended: (eventId: string) => void;
};

const SportContext = createContext<SportContextType | undefined>(undefined);

// Inner provider that has access to useCoinBalance
function SportProviderInner({ children }: { children: React.ReactNode }) {
  const [sportStatus, setSportStatus] = useState<SportStatus>("inactive");
  const [currentSport, setCurrentSport] = useState<string | null>(null);
  const [userMode, setUserModeState] = useState<UserMode>("Planned");
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);
  const [events, setEvents] = useState<SportEvent[]>(INITIAL_EVENTS);
  const [attendedEventIds, setAttendedEventIds] = useState<string[]>(loadAttendedEventIds);

  const { addCoins } = useCoinBalance();

  const activateSport = (sport: string) => {
    setCurrentSport(sport);
    setSportStatus("active");
    setUserModeState("Out Now");
  };

  const deactivateSport = () => {
    setCurrentSport(null);
    setSportStatus("inactive");
    setUserModeState("Planned");
  };

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
  };

  const toggleLocation = () => {
    setLocationEnabled((prev) => !prev);
  };

  const joinEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        if (evt.status !== "active") return evt;
        if (evt.participants.length >= evt.capacity) return evt;
        if (evt.participants.some((p) => p.id === CURRENT_USER.id)) return evt;
        return {
          ...evt,
          participants: [...evt.participants, { id: CURRENT_USER.id, name: CURRENT_USER.name }],
        };
      })
    );
  }, []);

  const leaveEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          participants: evt.participants.filter((p) => p.id !== CURRENT_USER.id),
        };
      })
    );
  }, []);

  const completeEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId ? { ...evt, status: "completed" as EventStatus } : evt
      )
    );
  }, []);

  const cancelEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId ? { ...evt, status: "canceled" as EventStatus } : evt
      )
    );
  }, []);

  const hasAttended = useCallback(
    (eventId: string): boolean => {
      return attendedEventIds.includes(eventId);
    },
    [attendedEventIds]
  );

  const markAttended = useCallback(
    (eventId: string) => {
      if (attendedEventIds.includes(eventId)) return;
      const newIds = [...attendedEventIds, eventId];
      setAttendedEventIds(newIds);
      safeSetItem("attendedEventIds", JSON.stringify(newIds));
      addCoins(5);
    },
    [attendedEventIds, addCoins]
  );

  return (
    <SportContext.Provider
      value={{
        sportStatus,
        currentSport,
        userMode,
        locationEnabled,
        activateSport,
        deactivateSport,
        setUserMode,
        toggleLocation,
        currentUser: CURRENT_USER,
        events,
        joinEvent,
        leaveEvent,
        completeEvent,
        cancelEvent,
        attendedEventIds,
        hasAttended,
        markAttended,
      }}
    >
      {children}
    </SportContext.Provider>
  );
}

export const SportProvider = ({ children }: { children: React.ReactNode }) => {
  return <SportProviderInner>{children}</SportProviderInner>;
};

export const useSport = (): SportContextType => {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error("useSport must be used inside SportProvider");
  }
  return context;
};
