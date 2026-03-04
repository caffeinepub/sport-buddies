/**
 * Block 67 — Google Calendar OAuth Service
 *
 * Architecture note:
 * Caffeine apps run on the Internet Computer. Real OAuth 2.0 requires a
 * server-side component to hold the client_secret. In this MVP we simulate
 * the OAuth flow in-browser (mock tokens) so the Pilot Calendar Control UI
 * is fully functional and testable. Replace `simulateOAuthConnect()` with
 * a real PKCE flow + backend token exchange when credentials are configured.
 */

export type OAuthConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix ms
  scope: string;
  tokenType: "Bearer";
}

export interface OAuthCalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
}

export interface OAuthPersistedState {
  connectionState: OAuthConnectionState;
  tokens: OAuthTokens | null;
  selectedCalendarId: string | null;
  calendars: OAuthCalendarInfo[];
  connectedAt: number | null;
}

const STORAGE_KEY = "sb_google_oauth";

const DEFAULT_STATE: OAuthPersistedState = {
  connectionState: "disconnected",
  tokens: null,
  selectedCalendarId: null,
  calendars: [],
  connectedAt: null,
};

export function loadOAuthState(): OAuthPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<OAuthPersistedState>;
    return {
      connectionState: parsed.connectionState ?? "disconnected",
      tokens: parsed.tokens ?? null,
      selectedCalendarId: parsed.selectedCalendarId ?? null,
      calendars: Array.isArray(parsed.calendars) ? parsed.calendars : [],
      connectedAt: parsed.connectedAt ?? null,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveOAuthState(state: OAuthPersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently fail
  }
}

export function isTokenExpired(tokens: OAuthTokens | null): boolean {
  if (!tokens) return true;
  return Date.now() >= tokens.expiresAt;
}

/**
 * Simulate an OAuth connect flow (MVP).
 * In production: open a real Google OAuth consent URL with PKCE, handle redirect,
 * exchange code for tokens via backend `exchangeOAuthCode` canister call.
 */
export async function simulateOAuthConnect(): Promise<{
  ok: boolean;
  tokens?: OAuthTokens;
  calendars?: OAuthCalendarInfo[];
  error?: string;
}> {
  // Simulate network delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 1800));

  // MVP: always succeeds with mock token
  const mockTokens: OAuthTokens = {
    accessToken: `mock_access_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    refreshToken: `mock_refresh_${Math.random().toString(36).slice(2, 10)}`,
    expiresAt: Date.now() + 3600 * 1000, // 1 hour
    scope:
      "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
    tokenType: "Bearer",
  };

  const mockCalendars: OAuthCalendarInfo[] = [
    {
      id: "primary",
      summary: "Primary Calendar",
      primary: true,
      accessRole: "owner",
    },
    {
      id: "pilot.schedule@sportbuddies.app",
      summary: "Pilot Schedule",
      primary: false,
      accessRole: "owner",
    },
    {
      id: "helicopter.bookings@sportbuddies.app",
      summary: "Helicopter Bookings",
      primary: false,
      accessRole: "owner",
    },
  ];

  return { ok: true, tokens: mockTokens, calendars: mockCalendars };
}

export async function simulateTokenRefresh(
  tokens: OAuthTokens,
): Promise<{ ok: boolean; tokens?: OAuthTokens; error?: string }> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const refreshed: OAuthTokens = {
    ...tokens,
    accessToken: `mock_access_${Date.now()}_refreshed`,
    expiresAt: Date.now() + 3600 * 1000,
  };
  return { ok: true, tokens: refreshed };
}

export function revokeOAuthConnection(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}
