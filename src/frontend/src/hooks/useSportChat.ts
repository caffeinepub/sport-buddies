/**
 * Block 79 — Live Sport Chat
 * Reads/writes per-sport chat messages from localStorage key `sb_chat_{sport}`.
 * Max 50 messages per sport. Reactive across components via StorageEvent.
 */
import { useCallback, useEffect, useState } from "react";

const MAX_MESSAGES = 50;

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  sentAt: number;
}

function storageKey(sport: string): string {
  return `sb_chat_${sport.toLowerCase()}`;
}

function readMessages(sport: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(sport));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessages(sport: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(storageKey(sport), JSON.stringify(messages));
  } catch {
    // ignore storage errors
  }
}

export function useSportChat(sport: string | null | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    sport ? readMessages(sport) : [],
  );

  // Re-read when sport changes
  useEffect(() => {
    if (!sport) {
      setMessages([]);
      return;
    }
    setMessages(readMessages(sport));
  }, [sport]);

  // Sync across components in same tab and other tabs
  useEffect(() => {
    if (!sport) return;
    const key = storageKey(sport);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) {
        setMessages(readMessages(sport));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [sport]);

  const postMessage = useCallback(
    (text: string, authorId: string, authorName: string) => {
      if (!sport || !text.trim()) return;
      const newMsg: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        authorId,
        authorName,
        text: text.trim(),
        sentAt: Date.now(),
      };
      setMessages((prev) => {
        const updated = [...prev, newMsg].slice(-MAX_MESSAGES);
        writeMessages(sport, updated);
        // Dispatch so other same-tab consumers stay in sync
        window.dispatchEvent(
          new StorageEvent("storage", { key: storageKey(sport) }),
        );
        return updated;
      });
    },
    [sport],
  );

  return { messages, postMessage };
}
