import { useNavigate } from "@tanstack/react-router";
import {
  Coins,
  History,
  Plane,
  QrCode,
  ScanLine,
  ShoppingCart,
  Trophy,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import ScreenBanner from "../components/ScreenBanner";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { safeNavigate } from "../utils/safeNavigate";

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  highlight?: boolean;
}

function ActionCard({
  icon,
  title,
  description,
  onClick,
  highlight,
}: ActionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full bg-charcoal rounded-xl p-4 flex items-center gap-4 text-left hover:opacity-90 active:scale-[0.99] transition-all border ${
        highlight ? "border-gold/30" : "border-white/5"
      }`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          highlight ? "bg-gold/20" : "bg-white/5"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function CoinsPage() {
  const navigate = useNavigate();
  const { balance, addCoins } = useCoinBalance();

  const handleHelicopter = () => {
    safeNavigate("/helicopter", navigate);
  };

  const handleScanUPC = () => {
    safeNavigate("/scanner-stub?type=upc", navigate);
  };

  const handleScanQR = () => {
    safeNavigate("/scanner-stub?type=qr", navigate);
  };

  const handleInviteFriends = () => {
    addCoins(1);
    toast.success("You earned 1 coin for inviting a friend! 🎉");
  };

  const handleBuyCoins = () => {
    toast.info("Coin purchase coming soon");
  };

  const handleEarnCoins = () => {
    toast.info("Earn coins by joining games and activities");
  };

  const handleHistory = () => {
    toast.info("No transactions yet");
  };

  return (
    <div className="pb-8">
      <ScreenBanner screenName="CoinsScreen" routeName="Coins" />

      <div className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-5 pt-2">Coins</h1>

        {/* Balance Card */}
        <div className="bg-charcoal rounded-xl p-5 mb-5 border border-gold/20 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
            <Coins className="w-7 h-7 text-gold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Your Balance
            </p>
            <p className="text-4xl font-bold text-gold leading-none mt-1">
              {balance}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Sport Buddy Coins
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <button
            type="button"
            data-ocid="coins.buy_button"
            onClick={handleBuyCoins}
            className="bg-charcoal border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 text-xs font-medium text-muted-foreground hover:opacity-90 active:scale-95 transition-all"
          >
            <ShoppingCart className="w-5 h-5 text-gold" />
            <span>Buy Coins</span>
          </button>
          <button
            type="button"
            data-ocid="coins.earn_button"
            onClick={handleEarnCoins}
            className="bg-charcoal border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 text-xs font-medium text-muted-foreground hover:opacity-90 active:scale-95 transition-all"
          >
            <Trophy className="w-5 h-5 text-green-400" />
            <span>Earn Coins</span>
          </button>
          <button
            type="button"
            data-ocid="coins.history_button"
            onClick={handleHistory}
            className="bg-charcoal border border-white/10 rounded-xl p-3 flex flex-col items-center gap-1.5 text-xs font-medium text-muted-foreground hover:opacity-90 active:scale-95 transition-all"
          >
            <History className="w-5 h-5 text-muted-foreground" />
            <span>History</span>
          </button>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          <ActionCard
            icon={<Plane className="w-5 h-5 text-gold" />}
            title="Helicopter Reservation"
            description="Book a helicopter ride with coins or payment"
            onClick={handleHelicopter}
            highlight
          />
          <ActionCard
            icon={<ScanLine className="w-5 h-5 text-gold" />}
            title="Scan UPC / CoinGrab"
            description="Scan product barcodes to earn coins"
            onClick={handleScanUPC}
          />
          <ActionCard
            icon={<QrCode className="w-5 h-5 text-gold" />}
            title="Scan QR Badge"
            description="Scan event QR badges to earn coins"
            onClick={handleScanQR}
          />
          <ActionCard
            icon={<Users className="w-5 h-5 text-gold" />}
            title="Invite Friends"
            description="Earn +1 coin each time you invite a buddy"
            onClick={handleInviteFriends}
          />
        </div>
      </div>
    </div>
  );
}
