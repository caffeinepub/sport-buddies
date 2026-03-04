import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar, Coins, Home, Map as MapIcon, User } from "lucide-react";

const TABS = [
  { path: "/", icon: Home, label: "Home", ocid: "nav.home.tab" },
  { path: "/map", icon: MapIcon, label: "Map", ocid: "nav.map.tab" },
  { path: "/events", icon: Calendar, label: "Events", ocid: "nav.events.tab" },
  { path: "/coins", icon: Coins, label: "Coins", ocid: "nav.coins.tab" },
  { path: "/profile", icon: User, label: "Profile", ocid: "nav.profile.tab" },
];

export default function BottomTabBar() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t"
      style={{
        backgroundColor: "#2A070B",
        borderTopColor: "rgba(255,255,255,0.08)",
      }}
    >
      {TABS.map(({ path, icon: Icon, label, ocid }) => {
        // Home tab is active only on exact '/', other tabs match prefix
        const isActive =
          path === "/"
            ? currentPath === "/"
            : currentPath === path || currentPath.startsWith(`${path}/`);
        return (
          <Link
            key={path}
            to={path}
            data-ocid={ocid}
            className="flex flex-col items-center justify-center flex-1 py-2 text-xs transition-colors"
            style={{
              color: isActive ? "#D4AF37" : "rgba(255,255,255,0.55)",
            }}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="mt-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
