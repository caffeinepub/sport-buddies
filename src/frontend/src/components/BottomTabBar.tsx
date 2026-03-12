import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar, Coins, Home, Map as MapIcon, User } from "lucide-react";
import { useSport } from "../context/SportContext";
import { useAvailableGames } from "../hooks/useAvailableGames";
import { useOpenGameSpots } from "../hooks/useOpenGameSpots";
import { useUnreadChatCount } from "../hooks/useUnreadChatCount";

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
  const { currentSport } = useSport();
  const { unreadCount } = useUnreadChatCount(currentSport);
  const { openSpots } = useOpenGameSpots(currentSport);
  const { availableGames } = useAvailableGames(currentSport);

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
            <div className="relative">
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {path === "/map" && unreadCount > 0 && (
                <span
                  data-ocid="nav.map.chat_badge"
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              {path === "/map" && openSpots > 0 && (
                <span
                  data-ocid="nav.map.open_spots_badge"
                  className="absolute -top-1.5 -left-2 min-w-[16px] h-4 px-1 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
                >
                  {openSpots > 99 ? "99+" : openSpots}
                </span>
              )}
              {path === "/events" && availableGames > 0 && (
                <span
                  data-ocid="nav.events.available_games_badge"
                  className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
                >
                  {availableGames > 99 ? "99+" : availableGames}
                </span>
              )}
            </div>
            <span className="mt-1">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
