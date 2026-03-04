import { useLocation, useNavigate } from "@tanstack/react-router";
import { MapPin, ShieldAlert, ShoppingBag, Wind, Zap } from "lucide-react";
import { toast } from "sonner";
import { PresenceBanner } from "../components/PresenceBanner";
import ScreenBanner from "../components/ScreenBanner";
import { useSport } from "../context/SportContext";
import { usePresenceState } from "../hooks/usePresenceState";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeName =
    location.pathname === "/" ? "Home" : location.pathname.replace(/^\//, "");

  const { presenceStatus, presenceSport, pocketFlashUntil } =
    usePresenceState();
  const isPresenceActive = presenceStatus === "OUT_NOW";

  const {
    sportStatus,
    currentSport,
    deactivateSport,
    locationEnabled,
    emergencyState,
  } = useSport();
  const isActive = sportStatus === "active";

  const handleActivateButton = () => {
    // Block activation/deactivation during emergency
    if (emergencyState === "triggered") {
      toast.error("Sport activation is locked during an active emergency.");
      return;
    }
    if (isActive) {
      deactivateSport();
    } else {
      if (!locationEnabled) {
        toast.error(
          "Location is disabled. Enable it in your Profile settings before activating your sport.",
        );
        return;
      }
      navigate({ to: "/activate" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <ScreenBanner screenName="HomeScreen" routeName={routeName} />

      {isPresenceActive && presenceSport && pocketFlashUntil !== null && (
        <PresenceBanner
          sport={presenceSport}
          pocketFlashUntil={pocketFlashUntil}
        />
      )}

      <div className="px-5 pt-8 space-y-6 flex flex-col items-center">
        {/* App wordmark */}
        <div className="text-center space-y-1 pt-2">
          <h1 className="text-3xl font-extrabold tracking-widest text-gold uppercase">
            Sport Buddies
          </h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase">
            Find your crew. Play your sport.
          </p>
        </div>

        {/* PRIMARY CTA — ACTIVATE / DEACTIVATE */}
        <div className="w-full max-w-sm flex flex-col items-center gap-2">
          <button
            type="button"
            data-ocid="home.activate.button"
            onClick={handleActivateButton}
            className={`w-full flex items-center justify-center gap-3 rounded-2xl py-5 text-lg font-extrabold uppercase tracking-widest transition-transform active:scale-95 ${
              isActive
                ? "bg-charcoal border border-white/20 text-foreground/70"
                : locationEnabled
                  ? "bg-gold text-black shadow-gold-glow"
                  : "bg-charcoal border border-white/10 text-muted-foreground"
            }`}
          >
            <Zap className="w-6 h-6" />
            {isActive ? `Deactivate ${currentSport}` : "Activate My Sport"}
          </button>

          {!locationEnabled && !isActive && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3" />
              Enable location in Profile to activate
            </p>
          )}

          {isActive && (
            <p
              className="text-sm font-semibold tracking-wide"
              style={{ color: "gold", marginTop: 8 }}
            >
              🔥 Out Now • {currentSport}
            </p>
          )}
        </div>

        {/* SECONDARY BUTTONS */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-3">
          <button
            type="button"
            data-ocid="home.map.button"
            onClick={() => navigate({ to: "/map" })}
            className="flex flex-col items-center justify-center gap-2 bg-maroon border border-gold/30 text-white rounded-xl py-5 font-bold text-sm uppercase tracking-wider active:scale-95 transition-transform hover:bg-maroon-dark"
          >
            <MapPin className="w-6 h-6 text-gold" />
            Enter Map
          </button>

          <button
            type="button"
            data-ocid="home.helicopter.button"
            onClick={() => navigate({ to: "/helicopter" })}
            className="flex flex-col items-center justify-center gap-2 bg-maroon border border-gold/30 text-white rounded-xl py-5 font-bold text-sm uppercase tracking-wider active:scale-95 transition-transform hover:bg-maroon-dark"
          >
            <Wind className="w-6 h-6 text-gold" />
            Helicopter
          </button>

          <button
            type="button"
            data-ocid="home.marketplace.button"
            onClick={() => navigate({ to: "/marketplace" })}
            className="col-span-2 flex items-center justify-center gap-3 bg-maroon border border-gold/30 text-white rounded-xl py-4 font-bold text-sm uppercase tracking-wider active:scale-95 transition-transform hover:bg-maroon-dark"
          >
            <ShoppingBag className="w-5 h-5 text-gold" />
            Marketplace
          </button>
        </div>

        {/* EMERGENCY SHIELD QUICK ACCESS */}
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => navigate({ to: "/sos" })}
            className="w-full flex items-center justify-between gap-3 bg-red-950/60 border border-red-700/50 text-white rounded-xl px-5 py-4 active:scale-95 transition-transform hover:bg-red-950/80"
          >
            <div className="flex items-center gap-3">
              <img
                src="/assets/generated/emergency-shield.dim_48x48.png"
                alt="Emergency Shield"
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <div className="text-left">
                <p className="font-bold text-sm uppercase tracking-wider text-red-300">
                  Emergency Shield
                </p>
                <p className="text-xs text-red-400/70">
                  Quick access — press &amp; hold to activate
                </p>
              </div>
            </div>
            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
