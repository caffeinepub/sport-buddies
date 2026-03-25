import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Coins,
  Plane,
  Shield,
  ShoppingBag,
  User,
} from "lucide-react";
import { toast } from "sonner";

const items = [
  {
    id: "coins",
    icon: Coins,
    label: "Coins",
    color: "#D4AF37",
    action: "navigate",
    path: "/coins",
  },
  {
    id: "helicopter",
    icon: Plane,
    label: "Aviation / Helicopter",
    color: "#60A5FA",
    action: "navigate",
    path: "/helicopter",
  },
  {
    id: "marketplace",
    icon: ShoppingBag,
    label: "Marketplace",
    color: "#A78BFA",
    action: "navigate",
    path: "/marketplace",
  },
  {
    id: "emergency",
    icon: Shield,
    label: "Emergency Shield",
    color: "#F87171",
    action: "navigate",
    path: "/sos",
  },
  {
    id: "profile",
    icon: User,
    label: "Profile",
    color: "#34D399",
    action: "navigate",
    path: "/profile",
  },
] as const;

export default function MorePage() {
  const navigate = useNavigate();

  function handleTap(item: (typeof items)[number]) {
    if (item.action === "navigate") {
      navigate({ to: item.path });
    } else {
      toast((item as { message?: string }).message ?? "");
    }
  }

  return (
    <div
      data-ocid="more.page"
      className="min-h-screen px-4 pt-6 pb-8"
      style={{ backgroundColor: "#1A0305", color: "#fff" }}
    >
      <h1
        className="text-2xl font-bold mb-6"
        style={{ color: "#D4AF37" }}
        data-ocid="more.header"
      >
        More
      </h1>

      <div className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              type="button"
              key={item.id}
              data-ocid={`more.item.${item.id}`}
              onClick={() => handleTap(item)}
              className="flex items-center gap-4 w-full text-left rounded-xl px-4 py-4 transition-colors active:opacity-75"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}22` }}
              >
                <Icon size={20} style={{ color: item.color }} />
              </div>
              <span
                className="flex-1 text-base font-medium"
                style={{ color: "#F5F5F5" }}
              >
                {item.label}
              </span>
              <ChevronRight
                size={18}
                style={{ color: "rgba(255,255,255,0.3)" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
