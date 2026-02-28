import { useState, useEffect, useCallback } from 'react';

interface PresenceState {
  presenceStatus: 'OUT_NOW' | null;
  presenceSport: string | null;
  presenceActivatedAt: number | null;
  presenceExpiresAt: number | null;
  pocketFlashUntil: number | null;
}

const PRESENCE_KEYS = {
  status: 'presenceStatus',
  sport: 'presenceSport',
  activatedAt: 'presenceActivatedAt',
  expiresAt: 'presenceExpiresAt',
  flashUntil: 'pocketFlashUntil',
};

const PRESENCE_DURATION = 10 * 60 * 1000; // 10 minutes
const FLASH_DURATION = 10 * 1000; // 10 seconds

export function usePresenceState() {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    presenceStatus: null,
    presenceSport: null,
    presenceActivatedAt: null,
    presenceExpiresAt: null,
    pocketFlashUntil: null,
  });

  // Load presence state from localStorage
  const loadPresenceState = useCallback(() => {
    const status = localStorage.getItem(PRESENCE_KEYS.status) as 'OUT_NOW' | null;
    const sport = localStorage.getItem(PRESENCE_KEYS.sport);
    const activatedAt = localStorage.getItem(PRESENCE_KEYS.activatedAt);
    const expiresAt = localStorage.getItem(PRESENCE_KEYS.expiresAt);
    const flashUntil = localStorage.getItem(PRESENCE_KEYS.flashUntil);

    return {
      presenceStatus: status,
      presenceSport: sport,
      presenceActivatedAt: activatedAt ? parseInt(activatedAt, 10) : null,
      presenceExpiresAt: expiresAt ? parseInt(expiresAt, 10) : null,
      pocketFlashUntil: flashUntil ? parseInt(flashUntil, 10) : null,
    };
  }, []);

  // Check if presence is expired
  const checkExpiry = useCallback(() => {
    const state = loadPresenceState();
    if (state.presenceExpiresAt && Date.now() > state.presenceExpiresAt) {
      clearPresence();
      return true;
    }
    return false;
  }, [loadPresenceState]);

  // Initialize and check expiry on mount
  useEffect(() => {
    const state = loadPresenceState();
    if (state.presenceStatus === 'OUT_NOW') {
      if (!checkExpiry()) {
        setPresenceState(state);
      }
    }
  }, [loadPresenceState, checkExpiry]);

  // Periodic expiry check every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (presenceState.presenceStatus === 'OUT_NOW') {
        if (checkExpiry()) {
          setPresenceState({
            presenceStatus: null,
            presenceSport: null,
            presenceActivatedAt: null,
            presenceExpiresAt: null,
            pocketFlashUntil: null,
          });
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [presenceState.presenceStatus, checkExpiry]);

  // Activate presence
  const activatePresence = useCallback((sport?: string) => {
    const now = Date.now();
    const expiresAt = now + PRESENCE_DURATION;
    const flashUntil = now + FLASH_DURATION;
    const sportName = sport || 'General';

    localStorage.setItem(PRESENCE_KEYS.status, 'OUT_NOW');
    localStorage.setItem(PRESENCE_KEYS.sport, sportName);
    localStorage.setItem(PRESENCE_KEYS.activatedAt, now.toString());
    localStorage.setItem(PRESENCE_KEYS.expiresAt, expiresAt.toString());
    localStorage.setItem(PRESENCE_KEYS.flashUntil, flashUntil.toString());

    setPresenceState({
      presenceStatus: 'OUT_NOW',
      presenceSport: sportName,
      presenceActivatedAt: now,
      presenceExpiresAt: expiresAt,
      pocketFlashUntil: flashUntil,
    });
  }, []);

  // Clear presence
  const clearPresence = useCallback(() => {
    localStorage.removeItem(PRESENCE_KEYS.status);
    localStorage.removeItem(PRESENCE_KEYS.sport);
    localStorage.removeItem(PRESENCE_KEYS.activatedAt);
    localStorage.removeItem(PRESENCE_KEYS.expiresAt);
    localStorage.removeItem(PRESENCE_KEYS.flashUntil);

    setPresenceState({
      presenceStatus: null,
      presenceSport: null,
      presenceActivatedAt: null,
      presenceExpiresAt: null,
      pocketFlashUntil: null,
    });
  }, []);

  // Check if flash is active
  const isFlashActive = presenceState.pocketFlashUntil 
    ? Date.now() < presenceState.pocketFlashUntil 
    : false;

  return {
    ...presenceState,
    isActive: presenceState.presenceStatus === 'OUT_NOW',
    isFlashActive,
    activatePresence,
    clearPresence,
  };
}
