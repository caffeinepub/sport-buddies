import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useCoinBalance } from "../hooks/useCoinBalance";

export type SportStatus = "inactive" | "active";
export type UserMode = "normal" | "buddy_finder";
export type EventStatus = "active" | "completed" | "canceled";
export type EmergencyState =
  | "idle"
  | "armed"
  | "triggered"
  | "escalated"
  | "rescue"
  | "resolved";

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
    if (typeof window === "undefined" || !window.localStorage)
      return defaultValue;
    return localStorage.getItem(key) ?? defaultValue;
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

interface CoreState {
  coins?: number;
  trustScore?: number;
  eventsAttendedCount?: number;
  eventsHostedCount?: number;
  currentSport?: string | null;
  sportStatus?: SportStatus;
  events?: SportEvent[];
}

function loadCoreState(): CoreState {
  try {
    const stored = safeGetItem("SPORT_BUDDIES_CORE", "{}");
    const parsed = JSON.parse(stored);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function saveCoreState(data: CoreState): void {
  safeSetItem("SPORT_BUDDIES_CORE", JSON.stringify(data));
}

function loadLocationEnabled(): boolean {
  const stored = safeGetItem("sportbuddies_location_enabled", "true");
  return stored !== "false";
}

function loadUserMode(): UserMode {
  const stored = safeGetItem("sportbuddies_user_mode", "normal");
  return stored === "buddy_finder" ? "buddy_finder" : "normal";
}

export type SportContextType = {
  // Sport state
  sportStatus: SportStatus;
  currentSport: string | null;
  activateSport: (sport: string) => void;
  deactivateSport: () => void;

  // User mode
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;

  // Location
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
  toggleLocation: () => void;

  // Emergency state (Block 47 / Block 51)
  emergencyState: EmergencyState;
  emergencyLevel: number;
  emergencySnapshot: {
    sport: string | null;
    mode: string;
    timestamp: number;
  } | null;
  armEmergency: () => void;
  triggerEmergency: () => void;
  resolveEmergency: () => void;

  // Current user
  currentUser: CurrentUser;

  // Events
  events: SportEvent[];
  joinEvent: (eventId: string) => void;
  leaveEvent: (eventId: string) => void;
  completeEvent: (eventId: string) => void;
  cancelEvent: (eventId: string) => void;

  // Attendance
  attendedEventIds: string[];
  hasAttended: (eventId: string) => boolean;
  markAttended: (eventId: string) => void;

  // Trust Score (Block 50)
  eventsAttendedCount: number;
  eventsHostedCount: number;
  trustScore: number;
};

const SportContext = createContext<SportContextType | undefined>(undefined);

// Inner provider that has access to useCoinBalance
function SportProviderInner({ children }: { children: React.ReactNode }) {
  const _core = loadCoreState();
  const [sportStatus, setSportStatus] = useState<SportStatus>(
    (_core.sportStatus as SportStatus) || "inactive",
  );
  const [currentSport, setCurrentSport] = useState<string | null>(
    _core.currentSport ?? null,
  );
  const [userMode, setUserModeState] = useState<UserMode>(loadUserMode);
  const [locationEnabled, setLocationEnabledState] =
    useState<boolean>(loadLocationEnabled);
  const [events, setEvents] = useState<SportEvent[]>(
    Array.isArray(_core.events) && _core.events.length > 0
      ? _core.events
      : INITIAL_EVENTS,
  );
  const [attendedEventIds, setAttendedEventIds] =
    useState<string[]>(loadAttendedEventIds);

  // Trust Score state (Block 50) — loaded from persisted core
  const [eventsAttendedCount, setEventsAttendedCount] = useState(
    _core.eventsAttendedCount ?? 0,
  );
  const [eventsHostedCount, setEventsHostedCount] = useState(
    _core.eventsHostedCount ?? 0,
  );
  const [trustScore, setTrustScore] = useState(_core.trustScore ?? 0);

  // Emergency state (Block 47 / Block 51)
  const [emergencyState, setEmergencyState] = useState<EmergencyState>("idle");
  const [emergencyLevel, setEmergencyLevel] = useState<number>(0);
  const [emergencySnapshot, setEmergencySnapshot] = useState<{
    sport: string | null;
    mode: string;
    timestamp: number;
  } | null>(null);

  const emergencyResolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const escalationTimer1Ref = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const escalationTimer2Ref = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const { addCoins } = useCoinBalance();

  // Persist locationEnabled to localStorage whenever it changes
  useEffect(() => {
    safeSetItem(
      "sportbuddies_location_enabled",
      locationEnabled ? "true" : "false",
    );
  }, [locationEnabled]);

  // Persist userMode to localStorage whenever it changes
  useEffect(() => {
    safeSetItem("sportbuddies_user_mode", userMode);
  }, [userMode]);

  // Persist core state (Block 54 / Block 55)
  useEffect(() => {
    saveCoreState({
      trustScore,
      eventsAttendedCount,
      eventsHostedCount,
      currentSport,
      sportStatus,
      events,
    });
  }, [
    trustScore,
    eventsAttendedCount,
    eventsHostedCount,
    currentSport,
    sportStatus,
    events,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (emergencyResolveTimerRef.current)
        clearTimeout(emergencyResolveTimerRef.current);
      if (escalationTimer1Ref.current)
        clearTimeout(escalationTimer1Ref.current);
      if (escalationTimer2Ref.current)
        clearTimeout(escalationTimer2Ref.current);
    };
  }, []);

  const activateSport = (sport: string) => {
    setCurrentSport(sport);
    setSportStatus("active");
  };

  const deactivateSport = () => {
    setCurrentSport(null);
    setSportStatus("inactive");
  };

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
  };

  const setLocationEnabled = (enabled: boolean) => {
    setLocationEnabledState(enabled);
  };

  const toggleLocation = () => {
    setLocationEnabledState((prev) => !prev);
  };

  // Emergency actions (Block 47)
  const armEmergency = useCallback(() => {
    setEmergencyState("armed");
  }, []);

  const startEscalationTimer = useCallback(() => {
    // Clear any existing escalation timers
    if (escalationTimer1Ref.current) clearTimeout(escalationTimer1Ref.current);
    if (escalationTimer2Ref.current) clearTimeout(escalationTimer2Ref.current);

    escalationTimer1Ref.current = setTimeout(() => {
      setEmergencyState("escalated");
      setEmergencyLevel(2);

      escalationTimer2Ref.current = setTimeout(() => {
        setEmergencyState("rescue");
        setEmergencyLevel(3);
      }, 10000);
    }, 10000);
  }, []);

  const triggerEmergency = useCallback(() => {
    // Block trigger if location is disabled
    if (!locationEnabled) return;

    setEmergencySnapshot({
      sport: currentSport || null,
      mode: userMode || "normal",
      timestamp: Date.now(),
    });
    setEmergencyState("triggered");
    setEmergencyLevel(1);

    startEscalationTimer();
  }, [locationEnabled, currentSport, userMode, startEscalationTimer]);

  const resolveEmergency = useCallback(() => {
    // Cancel escalation timers
    if (escalationTimer1Ref.current) clearTimeout(escalationTimer1Ref.current);
    if (escalationTimer2Ref.current) clearTimeout(escalationTimer2Ref.current);

    setEmergencyState("resolved");
    setEmergencyLevel(0);

    // Clear any existing resolve timer
    if (emergencyResolveTimerRef.current) {
      clearTimeout(emergencyResolveTimerRef.current);
    }

    emergencyResolveTimerRef.current = setTimeout(() => {
      setEmergencyState("idle");
      setEmergencySnapshot(null);
      emergencyResolveTimerRef.current = null;
    }, 3000);
  }, []);

  // Auto-cancel emergency if sport deactivates or location turns off (Block 53)
  useEffect(() => {
    if (emergencyLevel > 0) {
      if (sportStatus === "inactive") {
        resolveEmergency();
      } else if (!locationEnabled) {
        resolveEmergency();
      }
    }
  }, [sportStatus, locationEnabled, emergencyLevel, resolveEmergency]);

  const joinEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        if (evt.status !== "active") return evt;
        if (evt.participants.length >= evt.capacity) return evt;
        if (evt.participants.some((p) => p.id === CURRENT_USER.id)) return evt;
        return {
          ...evt,
          participants: [
            ...evt.participants,
            { id: CURRENT_USER.id, name: CURRENT_USER.name },
          ],
        };
      }),
    );
  }, []);

  const leaveEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        return {
          ...evt,
          participants: evt.participants.filter(
            (p) => p.id !== CURRENT_USER.id,
          ),
        };
      }),
    );
  }, []);

  const completeEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) => {
        if (evt.id !== eventId) return evt;
        // Trust Score: reward host on completion (Block 50)
        if (evt.hostId === CURRENT_USER.id) {
          setEventsHostedCount((c) => c + 1);
          setTrustScore((c) => c + 15);
        }
        return { ...evt, status: "completed" as EventStatus };
      }),
    );
  }, []);

  const cancelEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? { ...evt, status: "canceled" as EventStatus }
          : evt,
      ),
    );
  }, []);

  const hasAttended = useCallback(
    (eventId: string): boolean => {
      return attendedEventIds.includes(eventId);
    },
    [attendedEventIds],
  );

  const markAttended = useCallback(
    (eventId: string) => {
      if (attendedEventIds.includes(eventId)) return;
      const newIds = [...attendedEventIds, eventId];
      setAttendedEventIds(newIds);
      safeSetItem("attendedEventIds", JSON.stringify(newIds));
      addCoins(5);
      // Trust Score (Block 50)
      setEventsAttendedCount((prev) => prev + 1);
      setTrustScore((prev) => prev + 10);
    },
    [attendedEventIds, addCoins],
  );

  return (
    <SportContext.Provider
      value={{
        sportStatus,
        currentSport,
        userMode,
        locationEnabled,
        emergencyState,
        emergencyLevel,
        emergencySnapshot,
        activateSport,
        deactivateSport,
        setUserMode,
        setLocationEnabled,
        toggleLocation,
        armEmergency,
        triggerEmergency,
        resolveEmergency,
        currentUser: CURRENT_USER,
        events,
        joinEvent,
        leaveEvent,
        completeEvent,
        cancelEvent,
        attendedEventIds,
        hasAttended,
        markAttended,
        eventsAttendedCount,
        eventsHostedCount,
        trustScore,
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
