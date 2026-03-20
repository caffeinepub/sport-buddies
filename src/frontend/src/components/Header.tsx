import { useCoinBalance } from "@/hooks/useCoinBalance";
import { useNavigate } from "@tanstack/react-router";
import { ScanLine, ShieldAlert } from "lucide-react";
import { useSport } from "../context/SportContext";

export default function Header() {
  const navigate = useNavigate();
  const { balance } = useCoinBalance();
  const { emergencyState } = useSport();

  const isEmergencyActive =
    emergencyState === "triggered" ||
    emergencyState === "escalated" ||
    emergencyState === "rescue";

  const shieldColor = isEmergencyActive
    ? "#EF4444"
    : emergencyState === "armed"
      ? "#F97316"
      : "#ffffff";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-maroon shadow-md"
      style={{
        height: "56px",
        borderBottom: "1px solid rgba(212,175,55,0.25)",
      }}
    >
      {/* LEFT: Sport Buddies wordmark + SB badge */}
      <button
        type="button"
        data-ocid="header.logo.link"
        onClick={() => navigate({ to: "/badge" })}
        className="flex items-center gap-2 focus:outline-none"
        aria-label="View Security Badge"
      >
        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center flex-shrink-0">
          <span className="text-gold font-black text-sm leading-none">SB</span>
        </div>
        <span className="font-bold text-gold text-base tracking-wide leading-tight">
          Sport
          <br />
          <span className="text-white text-xs font-semibold tracking-widest">
            BUDDIES
          </span>
        </span>
      </button>

      {/* RIGHT: Coin balance + UPC scan + Emergency */}
      <div className="flex items-center gap-2">
        {/* Coin balance pill — navigates to /coins */}
        <button
          type="button"
          data-ocid="header.coins.link"
          onClick={() => navigate({ to: "/coins" })}
          className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-1 hover:bg-black/50 transition-colors focus:outline-none"
          aria-label="View Coins"
        >
          <span className="text-gold text-xs font-bold">🪙</span>
          <span className="text-gold text-xs font-bold">{balance}</span>
        </button>

        {/* UPC / QR Scanner badge — navigates to /scan */}
        <button
          type="button"
          data-ocid="header.scan.link"
          onClick={() => navigate({ to: "/scan" })}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-gold/20 border border-gold/40 hover:bg-gold/30 transition-colors focus:outline-none"
          aria-label="Scan UPC / QR Code"
        >
          <ScanLine className="w-5 h-5 text-gold" />
        </button>

        {/* Emergency Services shield badge — navigates to /sos */}
        <button
          type="button"
          data-ocid="header.sos.link"
          onClick={() => navigate({ to: "/sos" })}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors focus:outline-none"
          style={{
            backgroundColor: isEmergencyActive
              ? "rgba(239,68,68,0.3)"
              : emergencyState === "armed"
                ? "rgba(249,115,22,0.2)"
                : "rgba(153,27,27,0.4)",
            border: isEmergencyActive
              ? "1px solid rgba(239,68,68,0.8)"
              : emergencyState === "armed"
                ? "1px solid rgba(249,115,22,0.6)"
                : "1px solid rgba(239,68,68,0.4)",
            opacity: emergencyState === "armed" ? 0.8 : 1,
          }}
          aria-label="Emergency SOS"
        >
          <ShieldAlert
            className="w-5 h-5 transition-colors"
            style={{ color: shieldColor }}
          />
        </button>
      </div>
    </header>
  );
}
