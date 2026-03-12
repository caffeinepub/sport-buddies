/**
 * Block 80 — Demo Chat Seeder
 *
 * Seeds up to 5 demo chat messages per sport into the `sb_chat_{sport}`
 * localStorage keys used by `useSportChat`.
 *
 * Rules:
 * - Only seeds if the chat is currently empty (never overwrites real messages).
 * - Max 5 messages per sport.
 * - Demo authors match the athletes defined in `demoPresenceSeed.ts`.
 * - Timestamps are staggered to look like organic activity over the last ~25 min.
 * - Author IDs use the "demo_" prefix so they are easily identifiable and removable.
 */

import type { ChatMessage } from "../hooks/useSportChat";

const STORAGE_KEY = (sport: string) => `sb_chat_${sport.toLowerCase()}`;

/** Seconds ago helpers for staggered timestamps */
function minsAgo(n: number): number {
  return Date.now() - n * 60 * 1000;
}

/**
 * Per-sport demo messages.
 * Each entry: [authorId, authorName, text, minutesAgo]
 */
const DEMO_MESSAGES: Record<string, Array<[string, string, string, number]>> = {
  soccer: [
    [
      "demo_alex_r",
      "Alex R.",
      "Anyone up for a pickup game this afternoon?",
      24,
    ],
    ["demo_drew_s", "Drew S.", "I'm down! Heading to the south field.", 21],
    ["demo_alex_r", "Alex R.", "Perfect — meet at 4pm by the main gate?", 18],
    ["demo_drew_s", "Drew S.", "Sounds good. Bringing my cleats.", 14],
    ["demo_alex_r", "Alex R.", "Field's open, see you there! ⚽", 8],
  ],
  basketball: [
    [
      "demo_jordan_m",
      "Jordan M.",
      "Anyone playing at Riverside courts today?",
      22,
    ],
    [
      "demo_jordan_m",
      "Jordan M.",
      "Just got here — 3 on 3 going if anyone wants in.",
      17,
    ],
    [
      "demo_jordan_m",
      "Jordan M.",
      "We need one more player, spot's open 🏀",
      12,
    ],
    ["demo_jordan_m", "Jordan M.", "Game was fun! Same time tomorrow?", 6],
    ["demo_jordan_m", "Jordan M.", "I'll be here every weekday after 5pm.", 3],
  ],
  tennis: [
    [
      "demo_sam_k",
      "Sam K.",
      "Court 2 is free right now if anyone wants to rally.",
      25,
    ],
    ["demo_sam_k", "Sam K.", "Looking for a doubles partner for Saturday.", 19],
    ["demo_sam_k", "Sam K.", "Anyone have a spare racket? Mine cracked 😅", 15],
    ["demo_sam_k", "Sam K.", "Got one from the pro shop, all good!", 11],
    [
      "demo_sam_k",
      "Sam K.",
      "Hit me up if you want a hitting partner this week.",
      5,
    ],
  ],
  running: [
    [
      "demo_taylor_b",
      "Taylor B.",
      "Morning 5k at the park — who's joining?",
      26,
    ],
    [
      "demo_taylor_b",
      "Taylor B.",
      "Starting in 10 mins at the north entrance.",
      20,
    ],
    [
      "demo_taylor_b",
      "Taylor B.",
      "Pace will be easy 9:30/mi, all levels welcome.",
      16,
    ],
    [
      "demo_taylor_b",
      "Taylor B.",
      "Just finished! 5.2 miles, felt great 🏃",
      9,
    ],
    [
      "demo_taylor_b",
      "Taylor B.",
      "Same run tomorrow morning. See you out there!",
      4,
    ],
  ],
  yoga: [
    [
      "demo_casey_l",
      "Casey L.",
      "Sunrise session starting in 20 mins at the pavilion.",
      23,
    ],
    [
      "demo_casey_l",
      "Casey L.",
      "Bring a mat if you have one, extras available.",
      18,
    ],
    [
      "demo_casey_l",
      "Casey L.",
      "We've got 6 people here — great turnout!",
      13,
    ],
    ["demo_casey_l", "Casey L.", "Flow class done. Feeling so centered 🧘", 7],
    ["demo_casey_l", "Casey L.", "Next session Thursday at 7am, same spot.", 2],
  ],
  cycling: [
    [
      "demo_morgan_p",
      "Morgan P.",
      "Group ride leaving the trailhead at 8am tomorrow.",
      27,
    ],
    [
      "demo_morgan_p",
      "Morgan P.",
      "Route is the river loop — about 18 miles.",
      22,
    ],
    [
      "demo_morgan_p",
      "Morgan P.",
      "Helmets required, pace is moderate. All bikes welcome.",
      17,
    ],
    [
      "demo_morgan_p",
      "Morgan P.",
      "Just back from a solo spin — trails are in great shape!",
      10,
    ],
    [
      "demo_morgan_p",
      "Morgan P.",
      "Anyone want to ride this evening? I'm free after 6pm 🚴",
      3,
    ],
  ],
  swimming: [
    [
      "demo_riley_v",
      "Riley V.",
      "Lane 3 is open at the community pool all morning.",
      24,
    ],
    [
      "demo_riley_v",
      "Riley V.",
      "Masters swim practice at 7am — casual, no pressure.",
      19,
    ],
    ["demo_riley_v", "Riley V.", "Water temp is perfect today, come in!", 14],
    ["demo_riley_v", "Riley V.", "Finished 2k, feeling strong 🏊", 8],
    [
      "demo_riley_v",
      "Riley V.",
      "Pool closes at 9pm tonight, plan accordingly.",
      3,
    ],
  ],
};

/** All sports that have demo messages. */
export const DEMO_CHAT_SPORTS = Object.keys(DEMO_MESSAGES);

/**
 * Seeds demo messages for a single sport.
 * Only writes if the chat is currently empty.
 */
export function seedDemoChat(sport: string): void {
  const key = STORAGE_KEY(sport);
  try {
    const existing = localStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Chat already has messages — do not overwrite
        return;
      }
    }

    const templates = DEMO_MESSAGES[sport.toLowerCase()];
    if (!templates) return;

    const messages: ChatMessage[] = templates.map(
      ([authorId, authorName, text, mins], idx) => ({
        id: `demo_chat_${sport.toLowerCase()}_${idx}`,
        authorId,
        authorName,
        text,
        sentAt: minsAgo(mins),
      }),
    );

    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Seeds demo messages for all sports that have demo content.
 * Each sport is only seeded if its chat is currently empty.
 */
export function seedAllDemoChats(): void {
  for (const sport of DEMO_CHAT_SPORTS) {
    seedDemoChat(sport);
  }
}
