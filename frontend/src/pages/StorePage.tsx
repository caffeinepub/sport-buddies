import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Coins, HelpCircle } from "lucide-react";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useRedemptions } from "../hooks/useRedemptions";

const STORE_ITEMS = [
  { id: "1", name: "Sport Buddies Cap", cost: 150, category: "Apparel" },
  { id: "2", name: "Water Bottle", cost: 100, category: "Gear" },
  { id: "3", name: "Premium Membership (1 month)", cost: 500, category: "Membership" },
  { id: "4", name: "Event Entry Pass", cost: 200, category: "Events" },
  { id: "5", name: "Sport Buddies T-Shirt", cost: 300, category: "Apparel" },
  { id: "6", name: "Gym Bag", cost: 400, category: "Gear" },
];

const CATEGORIES = ["All", "Apparel", "Gear", "Membership", "Events"];

export default function StorePage() {
  const navigate = useNavigate();
  const { balance, updateBalance } = useCoinBalance();
  const { addRedemption } = useRedemptions();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<(typeof STORE_ITEMS)[0] | null>(null);

  const filtered =
    selectedCategory === "All"
      ? STORE_ITEMS
      : STORE_ITEMS.filter((i) => i.category === selectedCategory);

  const handleRedeem = (item: (typeof STORE_ITEMS)[0]) => {
    if (balance < item.cost) return;
    setConfirmItem(item);
  };

  const confirmRedeem = () => {
    if (!confirmItem) return;
    setRedeemingId(confirmItem.id);
    updateBalance(balance - confirmItem.cost);
    // addRedemption takes (item: string, cost: number) and returns a Redemption object
    const redemption = addRedemption(confirmItem.name, confirmItem.cost);
    setConfirmItem(null);
    setRedeemingId(null);
    navigate({ to: "/redemption/$id", params: { id: redemption.id } });
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-foreground">Store</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-charcoal rounded-full px-3 py-1">
            <Coins className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-gold">{balance}</span>
          </div>
          <button
            onClick={() => navigate({ to: "/how-it-works" })}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="How it Works"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-maroon text-white"
                : "bg-charcoal text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="bg-charcoal rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.category}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-gold" />
                <span className="text-sm font-semibold text-gold">{item.cost}</span>
              </div>
              <button
                onClick={() => handleRedeem(item)}
                disabled={balance < item.cost || redeemingId === item.id}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  balance >= item.cost
                    ? "bg-gold text-black hover:opacity-90"
                    : "bg-charcoal text-muted-foreground border border-white/10 cursor-not-allowed"
                }`}
              >
                {redeemingId === item.id ? "..." : "Redeem"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* How it Works link */}
      <button
        onClick={() => navigate({ to: "/how-it-works" })}
        className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
        How Points Work
      </button>

      {/* Confirm modal */}
      {confirmItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-charcoal rounded-xl p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold text-foreground mb-2">Confirm Redemption</h2>
            <p className="text-muted-foreground mb-4">
              Redeem <span className="text-foreground font-semibold">{confirmItem.name}</span> for{" "}
              <span className="text-gold font-semibold">{confirmItem.cost} coins</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmItem(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button onClick={confirmRedeem} className="flex-1 btn-primary">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
