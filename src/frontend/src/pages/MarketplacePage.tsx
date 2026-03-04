import { ShoppingBag, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MARKETPLACE_ITEMS = [
  {
    id: "1",
    title: "Nike Soccer Cleats (Size 10)",
    price: 120,
    seller: "Alex R.",
    sport: "soccer",
  },
  {
    id: "2",
    title: "Wilson Tennis Racket",
    price: 85,
    seller: "Jordan M.",
    sport: "tennis",
  },
  {
    id: "3",
    title: "Basketball (Official Size)",
    price: 45,
    seller: "Sam K.",
    sport: "basketball",
  },
  {
    id: "4",
    title: "Yoga Mat (Premium)",
    price: 35,
    seller: "Casey L.",
    sport: "yoga",
  },
  {
    id: "5",
    title: "Cycling Helmet",
    price: 60,
    seller: "Taylor B.",
    sport: "cycling",
  },
];

const PRO_SHOPS = [
  {
    id: "1",
    name: "City Sports Hub",
    sports: ["soccer", "basketball"],
    distance: "0.4 mi",
  },
  { id: "2", name: "Tennis World", sports: ["tennis"], distance: "0.9 mi" },
  { id: "3", name: "Zen Yoga Studio", sports: ["yoga"], distance: "1.2 mi" },
];

type Tab = "marketplace" | "pro-shops";

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<Tab>("marketplace");

  const handleViewItem = (item: (typeof MARKETPLACE_ITEMS)[0]) => {
    toast.info(`Viewing: ${item.title} — $${item.price} from ${item.seller}`);
  };

  const handleContactSeller = (item: (typeof MARKETPLACE_ITEMS)[0]) => {
    toast.success(`Message sent to ${item.seller}! They'll be notified.`);
  };

  const handleViewShop = (shop: (typeof PRO_SHOPS)[0]) => {
    toast.info(`${shop.name} — ${shop.distance} away. Directions coming soon.`);
  };

  const handlePostItem = () => {
    toast.info(
      "Post an item: Feature coming soon. You'll be able to list gear for sale.",
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 space-y-4">
        <h1 className="text-xl font-bold text-foreground">Marketplace</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab("marketplace")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "marketplace"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Gear Market
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pro-shops")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "pro-shops"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Pro Shops
          </button>
        </div>

        {activeTab === "marketplace" && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handlePostItem}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold active:scale-95 transition-transform"
            >
              <Tag className="w-4 h-4" />
              Post an Item
            </button>

            {MARKETPLACE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.sport} · {item.seller}
                    </p>
                  </div>
                  <span className="text-primary font-bold text-sm">
                    ${item.price}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleViewItem(item)}
                    className="flex-1 bg-muted text-muted-foreground rounded-lg py-2 text-xs font-medium active:scale-95 transition-transform"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleContactSeller(item)}
                    className="flex-1 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold active:scale-95 transition-transform"
                  >
                    Contact Seller
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "pro-shops" && (
          <div className="space-y-3">
            {PRO_SHOPS.map((shop) => (
              <div
                key={shop.id}
                className="bg-card border border-border rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {shop.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {shop.sports.join(", ")} · {shop.distance}
                    </p>
                  </div>
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <button
                  type="button"
                  onClick={() => handleViewShop(shop)}
                  className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold active:scale-95 transition-transform"
                >
                  View Shop
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
