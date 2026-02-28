import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import Header from "./components/Header";
import BottomTabBar from "./components/BottomTabBar";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import EventsPage from "./pages/EventsPage";
import CoinsPage from "./pages/CoinsPage";
import StorePage from "./pages/StorePage";
import MarketplacePage from "./pages/MarketplacePage";
import ProfilePage from "./pages/ProfilePage";
import SessionPage from "./pages/SessionPage";
import EmergencyPage from "./pages/EmergencyPage";
import EmergencyShieldPage from "./pages/EmergencyShieldPage";
import SOSLogPage from "./pages/SOSLogPage";
import AuthPage from "./pages/AuthPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import CoinGrabPage from "./pages/CoinGrabPage";
import ScanPage from "./pages/ScanPage";
import HelicopterPage from "./pages/HelicopterPage";
import SafetyPage from "./pages/SafetyPage";
import EventDetailPage from "./pages/EventDetailPage";
import CreateEventPage from "./pages/CreateEventPage";
import PresenceDetailPage from "./pages/PresenceDetailPage";
import RedemptionDetailPage from "./pages/RedemptionDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import InvitePage from "./pages/InvitePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import ActivateSportScreen from "./pages/ActivateSportScreen";
import ScannerStubPage from "./pages/ScannerStubPage";
import { SportProvider } from "./context/SportContext";

const queryClient = new QueryClient();

// Layout with full nav (header + bottom tab bar)
function LayoutWithNav() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
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
  path: "/events/$id",
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

const routeTree = rootRoute.addChildren([
  layoutWithNavRoute.addChildren([
    homeRoute,
    mapRoute,
    eventsRoute,
    eventDetailRoute,
    coinsRoute,
    storeRoute,
    marketplaceRoute,
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
        <RouterProvider router={router} />
        <Toaster position="bottom-center" richColors />
      </SportProvider>
    </QueryClientProvider>
  );
}
