import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_JOINED_IDS = 'sb_joinedEventIds';
const STORAGE_KEY_PARTICIPANT_OVERRIDES = 'sb_eventParticipantOverrides';

interface EventJoinState {
  joinedEventIds: string[];
  participantOverrides: Record<string, number>;
}

// Safe localStorage operations with fallback
function safeGetItem(key: string, defaultValue: string): string {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

function loadState(): EventJoinState {
  try {
    const joinedIds = JSON.parse(safeGetItem(STORAGE_KEY_JOINED_IDS, '[]'));
    const overrides = JSON.parse(safeGetItem(STORAGE_KEY_PARTICIPANT_OVERRIDES, '{}'));
    
    return {
      joinedEventIds: Array.isArray(joinedIds) ? joinedIds : [],
      participantOverrides: typeof overrides === 'object' && overrides !== null ? overrides : {},
    };
  } catch {
    return {
      joinedEventIds: [],
      participantOverrides: {},
    };
  }
}

function saveState(state: EventJoinState): void {
  safeSetItem(STORAGE_KEY_JOINED_IDS, JSON.stringify(state.joinedEventIds));
  safeSetItem(STORAGE_KEY_PARTICIPANT_OVERRIDES, JSON.stringify(state.participantOverrides));
  
  // Dispatch custom event for cross-tab/component synchronization
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('eventJoinStateChanged', { detail: state }));
  }
}

export function useEventJoinState() {
  const [state, setState] = useState<EventJoinState>(loadState);

  // Listen for changes from other tabs or components
  useEffect(() => {
    const handleStorageChange = () => {
      setState(loadState());
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<EventJoinState>;
      if (customEvent.detail) {
        setState(customEvent.detail);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('eventJoinStateChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('eventJoinStateChanged', handleCustomEvent);
    };
  }, []);

  const isJoined = useCallback(
    (eventId: string): boolean => {
      return state.joinedEventIds.includes(eventId);
    },
    [state.joinedEventIds]
  );

  const getParticipantCount = useCallback(
    (eventId: string, seedCount: number): number => {
      return state.participantOverrides[eventId] ?? seedCount;
    },
    [state.participantOverrides]
  );

  const joinEvent = useCallback(
    (eventId: string, currentCount: number) => {
      if (state.joinedEventIds.includes(eventId)) {
        return; // Already joined
      }

      const newJoinedIds = [...state.joinedEventIds, eventId];
      const newCount = currentCount + 1;
      const newOverrides = { ...state.participantOverrides, [eventId]: newCount };

      const newState = {
        joinedEventIds: newJoinedIds,
        participantOverrides: newOverrides,
      };

      setState(newState);
      saveState(newState);
    },
    [state]
  );

  const leaveEvent = useCallback(
    (eventId: string, currentCount: number) => {
      if (!state.joinedEventIds.includes(eventId)) {
        return; // Not joined
      }

      const newJoinedIds = state.joinedEventIds.filter((id) => id !== eventId);
      const newCount = Math.max(currentCount - 1, 0);
      const newOverrides = { ...state.participantOverrides, [eventId]: newCount };

      const newState = {
        joinedEventIds: newJoinedIds,
        participantOverrides: newOverrides,
      };

      setState(newState);
      saveState(newState);
    },
    [state]
  );

  const getJoinedEventIds = useCallback((): string[] => {
    return state.joinedEventIds;
  }, [state.joinedEventIds]);

  return {
    isJoined,
    getParticipantCount,
    joinEvent,
    leaveEvent,
    getJoinedEventIds,
  };
}
