/**
 * Block 80 — useDemoChatSeed
 *
 * Calls `seedAllDemoChats()` once on mount.
 * Seeding is idempotent: chats that already contain messages are never touched.
 */

import { useEffect } from "react";
import { seedAllDemoChats } from "../lib/demoChatSeed";

export function useDemoChatSeed(): void {
  useEffect(() => {
    seedAllDemoChats();
  }, []);
}
