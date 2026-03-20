import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useCallback, useState } from "react";
import BottomTabBar from "./components/BottomTabBar";
import { GameDetailCard } from "./components/GameDetailCard";
import Header from "./components/Header";
import { SportProvider, useSport } from "./context/SportContext";
import { useGameSessions } from "./hooks/useGameSessions";
import { useNewGameNotification } from "./hooks/useNewGameNotification";
import ActivateSportScreen from "./pages/ActivateSportScreen";
import AuthPage from "./pages/AuthPage";
import BadgeScreen from "./pages/BadgeScreen";
import CoinGrabPage from "./pages/CoinGrabPage";
import CoinsPage from "./pages/CoinsPage";
import CreateEventPage from "./pages/CreateEventPage";
import EmergencyPage from "./pages/EmergencyPage";
import EmergencyShieldPage from "./pages/EmergencyShieldPage";
import EventDetailPage from "./pages/EventDetailPage";
import EventsPage from "./pages/EventsPage";
import HelicopterPage from "./pages/HelicopterPage";
import HomePage from "./pages/HomePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import InvitePage from "./pages/InvitePage";
import MapPage from "./pages/MapPage";
import MarketplacePage from "./pages/MarketplacePage";
import MorePage from "./pages/MorePage";
import NotFoundPage from "./pages/NotFoundPage";
import PresenceDetailPage from "./pages/PresenceDetailPage";
import ProfilePage from "./pages/ProfilePage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import RedemptionDetailPage from "./pages/RedemptionDetailPage";
import SOSLogPage from "./pages/SOSLogPage";
import SafetyPage from "./pages/SafetyPage";
import ScanPage from "./pages/ScanPage";
import ScannerStubPage from "./pages/ScannerStubPage";
import SessionPage from "./pages/SessionPage";
import StorePage from "./pages/StorePage";

const queryClient = new QueryClient();

// Block 86/87 — fires in-app toast when a new game is created for the user's active sport.
// Block 87 adds a "Join" action button on the toast that auto-joins and opens the lobby.
function GameNotificationWatcher() {
  const { currentSport } = useSport();
  const { joinSession } = useGameSessions();
  const [lobbyGameId, setLobbyGameId] = useState<string | null>(null);
  const [lobbyOpen, setLobbyOpen] = useState(false);

  const handleJoinFromToast = useCallback(
    (gameId: string) => {
      joinSession(gameId);
      setLobbyGameId(gameId);
      setLobbyOpen(true);
    },
    [joinSession],
  );

  useNewGameNotification(currentSport, handleJoinFromToast);

  return (
    <GameDetailCard
      open={lobbyOpen}
      gameId={lobbyGameId}
      onClose={() => setLobbyOpen(false)}
    />
  );
}

// Emergency banner shown globally when triggered/escalated/rescue
function EmergencyBanner() {
  const { emergencyState, emergencyLevel } = useSport();
  const isActive =
    emergencyState === "triggered" ||
    emergencyState === "escalated" ||
    emergencyState === "rescue";
  if (!isActive) return null;

  const bannerText =
    emergencyLevel === 3
      ? "⚠ Level 3: Rescue Dispatch"
      : emergencyLevel === 2
        ? "⚠ Level 2: Escalating to 911"
        : "⚠ Level 1: Alerting Friends";

  return (
    <div
      data-ocid="emergency.banner.panel"
      className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center py-2 px-4"
      style={{ backgroundColor: "#DC2626" }}
    >
      <span className="text-white font-bold text-sm uppercase tracking-widest">
        {bannerText}
      </span>
    </div>
  );
}

// Layout with full nav (header + bottom tab bar)
function LayoutWithNav() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <EmergencyBanner />
      <main className="flex-1 pb-16 pt-14">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  );
}

// Layout with header only (no bottom tab bar)
function LayoutHeaderOnly() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <EmergencyBanner />
      <main className="flex-1 pt-14">
        <Outlet />
      </main>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NotFoundPage,
});

// Main nav routes (with bottom tab bar)
const layoutWithNavRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout-with-nav",
  component: LayoutWithNav,
});

const homeRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/",
  component: HomePage,
});

const mapRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/map",
  component: MapPage,
});

const eventsRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/events",
  component: EventsPage,
});

const eventDetailRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/events/$eventId",
  component: EventDetailPage,
});

const coinsRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/coins",
  component: CoinsPage,
});

const storeRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/store",
  component: StorePage,
});

const marketplaceRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/marketplace",
  component: MarketplacePage,
});

const moreRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/more",
  component: MorePage,
});

const profileRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/profile",
  component: ProfilePage,
});

const safetyRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/safety",
  component: SafetyPage,
});

const presenceDetailRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/presence-detail/$id",
  component: PresenceDetailPage,
});

const redemptionDetailRoute = createRoute({
  getParentRoute: () => layoutWithNavRoute,
  path: "/redemption/$id",
  component: RedemptionDetailPage,
});

// Header-only routes (no bottom tab bar)
const layoutHeaderOnlyRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout-header-only",
  component: LayoutHeaderOnly,
});

// /activate — Glove Mode / One-Touch Activation (NOT a tab)
const activateRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/activate",
  component: ActivateSportScreen,
});

const emergencyRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/emergency",
  component: EmergencyPage,
});

const sosRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/sos",
  component: EmergencyShieldPage,
});

const sosLogRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/sos-log",
  component: SOSLogPage,
});

const scanRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/scan",
  component: ScanPage,
});

const coinGrabRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/coin-grab",
  component: CoinGrabPage,
});

const scannerRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/scanner",
  component: ScanPage,
});

const scannerStubRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/scanner-stub",
  component: ScannerStubPage,
});

const helicopterRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/helicopter",
  component: HelicopterPage,
});

const authRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/auth",
  component: AuthPage,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/profile-setup",
  component: ProfileSetupPage,
});

const sessionRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/session/$sessionId",
  component: SessionPage,
});

const createEventRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/create-event",
  component: CreateEventPage,
});

const inviteRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/invite",
  component: InvitePage,
});

const howItWorksRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/how-it-works",
  component: HowItWorksPage,
});

const badgeRoute = createRoute({
  getParentRoute: () => layoutHeaderOnlyRoute,
  path: "/badge",
  component: BadgeScreen,
});

const routeTree = rootRoute.addChildren([
  layoutWithNavRoute.addChildren([
    homeRoute,
    mapRoute,
    eventsRoute,
    eventDetailRoute,
    coinsRoute,
    storeRoute,
    marketplaceRoute,
    moreRoute,
    profileRoute,
    safetyRoute,
    presenceDetailRoute,
    redemptionDetailRoute,
  ]),
  layoutHeaderOnlyRoute.addChildren([
    activateRoute,
    emergencyRoute,
    sosRoute,
    sosLogRoute,
    scanRoute,
    coinGrabRoute,
    scannerRoute,
    scannerStubRoute,
    helicopterRoute,
    authRoute,
    profileSetupRoute,
    sessionRoute,
    createEventRoute,
    inviteRoute,
    howItWorksRoute,
    badgeRoute,
  ]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SportProvider>
        <GameNotificationWatcher />
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors />
      </SportProvider>
    </QueryClientProvider>
  );
}
