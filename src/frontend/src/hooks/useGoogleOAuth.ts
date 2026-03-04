import {
  type OAuthCalendarInfo,
  type OAuthConnectionState,
  type OAuthPersistedState,
  type OAuthTokens,
  isTokenExpired,
  loadOAuthState,
  revokeOAuthConnection,
  saveOAuthState,
  simulateOAuthConnect,
  simulateTokenRefresh,
} from "@/services/googleOAuth";
import { useCallback, useState } from "react";

export interface UseGoogleOAuthReturn {
  connectionState: OAuthConnectionState;
  tokens: OAuthTokens | null;
  calendars: OAuthCalendarInfo[];
  selectedCalendarId: string | null;
  connectedAt: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  selectCalendar: (calendarId: string) => void;
  refreshTokenIfNeeded: () => Promise<OAuthTokens | null>;
}

export function useGoogleOAuth(): UseGoogleOAuthReturn {
  const [state, setState] = useState<OAuthPersistedState>(loadOAuthState);

  const persist = useCallback((next: OAuthPersistedState) => {
    setState(next);
    saveOAuthState(next);
  }, []);

  const connect = useCallback(async () => {
    persist({ ...state, connectionState: "connecting" });

    const result = await simulateOAuthConnect();

    if (result.ok && result.tokens) {
      const next: OAuthPersistedState = {
        connectionState: "connected",
        tokens: result.tokens,
        calendars: result.calendars ?? [],
        // Auto-select the first calendar (primary if available)
        selectedCalendarId:
          result.calendars?.find((c) => c.primary)?.id ??
          result.calendars?.[0]?.id ??
          null,
        connectedAt: Date.now(),
      };
      persist(next);
    } else {
      persist({
        ...state,
        connectionState: "error",
        tokens: null,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, persist]);

  const disconnect = useCallback(() => {
    revokeOAuthConnection();
    const next: OAuthPersistedState = {
      connectionState: "disconnected",
      tokens: null,
      selectedCalendarId: null,
      calendars: [],
      connectedAt: null,
    };
    persist(next);
  }, [persist]);

  const selectCalendar = useCallback(
    (calendarId: string) => {
      const next = { ...state, selectedCalendarId: calendarId };
      persist(next);
    },
    [state, persist],
  );

  const refreshTokenIfNeeded =
    useCallback(async (): Promise<OAuthTokens | null> => {
      if (!state.tokens) return null;
      if (!isTokenExpired(state.tokens)) return state.tokens;

      const result = await simulateTokenRefresh(state.tokens);
      if (result.ok && result.tokens) {
        const next = { ...state, tokens: result.tokens };
        persist(next);
        return result.tokens;
      }
      return null;
    }, [state, persist]);

  return {
    connectionState: state.connectionState,
    tokens: state.tokens,
    calendars: state.calendars,
    selectedCalendarId: state.selectedCalendarId,
    connectedAt: state.connectedAt,
    connect,
    disconnect,
    selectCalendar,
    refreshTokenIfNeeded,
  };
}
