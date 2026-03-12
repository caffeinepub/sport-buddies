/**
 * Block 75/76 — Invite Records
 * Reads/writes localStorage key `sb_invite_records`.
 * Stores simple invite records locally (demo — no backend).
 * Block 76: Added storage event listener so the list stays reactive
 * across components and browser tabs.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "sb_invite_records";

export interface InviteRecord {
  id: string;
  toId: string;
  toName: string;
  sport: string;
  sentAt: number;
}

function readRecords(): InviteRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecords(records: InviteRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

export function useInviteRecords() {
  const [inviteRecords, setInviteRecords] =
    useState<InviteRecord[]>(readRecords);

  // Re-read from localStorage whenever another component (or tab) writes to
  // sb_invite_records so the list stays in sync without a page reload.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setInviteRecords(readRecords());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const sendInvite = (toId: string, toName: string, sport: string): void => {
    const newRecord: InviteRecord = {
      id: Date.now().toString(),
      toId,
      toName,
      sport,
      sentAt: Date.now(),
    };
    setInviteRecords((prev) => {
      const updated = [...prev, newRecord];
      writeRecords(updated);
      // Dispatch so the same-tab storage listener also fires
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
      return updated;
    });
  };

  const clearInvites = (): void => {
    setInviteRecords([]);
    writeRecords([]);
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  };

  const inviteCountFor = (athleteId: string): number =>
    inviteRecords.filter((r) => r.toId === athleteId).length;

  const lastInviteFor = (athleteId: string): number | null => {
    const matching = inviteRecords.filter((r) => r.toId === athleteId);
    if (matching.length === 0) return null;
    return Math.max(...matching.map((r) => r.sentAt));
  };

  return {
    inviteRecords,
    sendInvite,
    clearInvites,
    inviteCountFor,
    lastInviteFor,
  };
}
