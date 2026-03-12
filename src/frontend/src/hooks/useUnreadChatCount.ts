/**
 * Block 81 — Chat Activity Badge
 * Tracks unread chat messages for the user's active sport using a localStorage watermark.
 * - Storage key for messages: `sb_chat_{sport}` (same as useSportChat)
 * - Storage key for watermark: `sb_chat_read_{sport}`
 * - unreadCount = max(0, messageCount - watermark)
 * - markAsRead() updates the watermark to the current message count
 */
import { useCallback, useEffect, useState } from "react";

function chatKey(sport: string): string {
  return `sb_chat_${sport.toLowerCase()}`;
}

function watermarkKey(sport: string): string {
  return `sb_chat_read_${sport.toLowerCase()}`;
}

function readCount(sport: string): number {
  try {
    const raw = localStorage.getItem(chatKey(sport));
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

function readWatermark(sport: string): number {
  try {
    const raw = localStorage.getItem(watermarkKey(sport));
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

export function useUnreadChatCount(sport: string | null | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  const recompute = useCallback(() => {
    if (!sport) {
      setUnreadCount(0);
      return;
    }
    const count = readCount(sport);
    const wm = readWatermark(sport);
    setUnreadCount(Math.max(0, count - wm));
  }, [sport]);

  // Recompute on mount and when sport changes
  useEffect(() => {
    recompute();
  }, [recompute]);

  // Listen for storage changes to the chat key (new messages from same or other tabs)
  useEffect(() => {
    if (!sport) return;
    const key = chatKey(sport);
    const handler = (e: StorageEvent) => {
      if (e.key === key) recompute();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [sport, recompute]);

  const markAsRead = useCallback(() => {
    if (!sport) return;
    const current = readCount(sport);
    try {
      localStorage.setItem(watermarkKey(sport), String(current));
    } catch {
      // ignore storage errors
    }
    setUnreadCount(0);
  }, [sport]);

  return { unreadCount, markAsRead };
}
