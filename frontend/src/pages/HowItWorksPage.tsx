import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Coins, QrCode, ShoppingBag, Users } from "lucide-react";

const STEPS = [
  {
    icon: <Users className="w-5 h-5" />,
    title: "Activate Your Sport",
    description: "Select your sport and go live. Nearby buddies can see you're ready to play.",
  },
  {
    icon: <QrCode className="w-5 h-5" />,
    title: "Scan Codes to Earn Coins",
    description: "Scan QR codes at events, venues, and partner locations to earn Sport Buddy Coins.",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Attend Events",
    description: "Join events and mark your attendance to earn +5 coins per event.",
  },
  {
    icon: <ShoppingBag className="w-5 h-5" />,
    title: "Redeem in the Store",
    description: "Use your coins to redeem gear, experiences, and exclusive rewards in the store.",
  },
];

export default function HowItWorksPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">How Coins Work</h1>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {i + 1}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-foreground text-sm">Coin Values</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Scan HELI-50 code</span>
              <span className="text-primary font-semibold">+50 coins</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Scan FERRARI-50 code</span>
              <span className="text-primary font-semibold">+50 coins</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Scan SWAG-20 code</span>
              <span className="text-primary font-semibold">+20 coins</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Attend an event</span>
              <span className="text-primary font-semibold">+5 coins</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate({ to: "/" })}
          className="w-full bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold active:scale-95 transition-transform"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
