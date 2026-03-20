import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Package, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";

const FEATURED_ITEMS = [
  {
    id: "1",
    title: "Paddleboard Rental",
    emoji: "🏄",
    message: "Rental details coming soon",
  },
  {
    id: "2",
    title: "Beach Gear",
    emoji: "🏖️",
    message: "Gear listings coming soon",
  },
  {
    id: "3",
    title: "Sport Equipment",
    emoji: "⚽",
    message: "Equipment listings coming soon",
  },
];

const QUICK_ACTIONS = [
  {
    id: "list",
    label: "List an Item",
    icon: Tag,
    message: "Listing tools coming soon",
  },
  {
    id: "rentals",
    label: "My Rentals",
    icon: Package,
    message: "No rentals yet",
  },
  {
    id: "saved",
    label: "Saved Items",
    icon: ShoppingBag,
    message: "No saved items yet",
  },
];

export default function MarketplacePage() {
  const navigate = useNavigate();

  return (
    <div
      data-ocid="marketplace.page"
      className="min-h-screen pb-24"
      style={{ backgroundColor: "#1A0305", color: "#fff" }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center gap-3">
        <button
          type="button"
          data-ocid="marketplace.back_button"
          onClick={() => navigate({ to: "/more" })}
          className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
          style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
        >
          <ArrowLeft size={18} style={{ color: "#D4AF37" }} />
        </button>
        <div>
          <h1
            className="text-2xl font-bold leading-tight"
            style={{ color: "#D4AF37" }}
            data-ocid="marketplace.header"
          >
            Marketplace
          </h1>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
            Gear, rentals, and featured items
          </p>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {/* Section 1: Featured Items */}
        <section data-ocid="marketplace.featured_section">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Featured Items
          </h2>
          <div className="space-y-3">
            {FEATURED_ITEMS.map((item) => (
              <div
                key={item.id}
                data-ocid={`marketplace.featured_card.${item.id}`}
                className="flex items-center justify-between rounded-xl px-4 py-4"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#F5F5F5" }}
                  >
                    {item.title}
                  </span>
                </div>
                <button
                  type="button"
                  data-ocid={`marketplace.featured_card.${item.id}.view_button`}
                  onClick={() => toast(item.message)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-transform"
                  style={{
                    backgroundColor: "#D4AF3722",
                    color: "#D4AF37",
                    border: "1px solid #D4AF3744",
                  }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Quick Actions */}
        <section data-ocid="marketplace.quick_actions_section">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Quick Actions
          </h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  data-ocid={`marketplace.quick_action.${action.id}`}
                  onClick={() => toast(action.message)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-4 text-left active:opacity-75 transition-opacity"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(212,175,55,0.12)" }}
                  >
                    <Icon size={16} style={{ color: "#D4AF37" }} />
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: "#F5F5F5" }}
                  >
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
