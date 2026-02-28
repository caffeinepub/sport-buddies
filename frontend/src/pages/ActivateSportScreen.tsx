import { useNavigate, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { useState } from "react";
import { usePresenceState } from "../hooks/usePresenceState";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { LocationPermissionModal } from "../components/LocationPermissionModal";
import ScreenBanner from "../components/ScreenBanner";
import { useSport } from "../context/SportContext";

const SPORTS = [
  { id: "soccer", label: "⚽ Soccer" },
  { id: "basketball", label: "🏀 Basketball" },
  { id: "tennis", label: "🎾 Tennis" },
  { id: "running", label: "🏃 Running" },
  { id: "swimming", label: "🏊 Swimming" },
  { id: "cycling", label: "🚴 Cycling" },
  { id: "yoga", label: "🧘 Yoga" },
];

export default function ActivateSportScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { presenceStatus, activatePresence, clearPresence } = usePresenceState();
  const { permissionState, requestPermission, isChecking } = useLocationPermission();
  const { activateSport, deactivateSport } = useSport();
  const [selectedSport, setSelectedSport] = useState("soccer");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activated, setActivated] = useState(false);

  const isActive = presenceStatus === "OUT_NOW";

  const onPickSport = (sportName: string) => {
    activateSport(sportName);
    localStorage.setItem("sb_activeSport", sportName);
    localStorage.setItem("sb_status", "out_now");
    activatePresence(sportName);
    navigate({ to: "/map" });
  };

  const handleActivate = () => {
    if (permissionState !== "granted") {
      setShowLocationModal(true);
      return;
    }
    onPickSport(selectedSport);
    setActivated(true);
  };

  const handleEnableLocation = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowLocationModal(false);
      onPickSport(selectedSport);
      setActivated(true);
    }
  };

  const handleDeactivate = () => {
    deactivateSport();
    clearPresence();
    localStorage.removeItem("sb_activeSport");
    localStorage.setItem("sb_status", "offline");
    setActivated(false);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0A0A0A' }}>
      <ScreenBanner screenName="ActivateSportScreen" routeName="ActivateSport" />

      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: '#D4AF37' }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 space-y-8">
        {/* Icon / Glove Mode Header */}
        <div className="text-center space-y-3">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
            style={{ backgroundColor: '#1A0A0D', border: '2px solid #D4AF37' }}
          >
            <Zap className="w-10 h-10" style={{ color: '#D4AF37' }} />
          </div>
          <h1 className="text-2xl font-bold tracking-widest uppercase" style={{ color: '#D4AF37' }}>
            One-Touch Activation
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Select your sport and go live instantly.
          </p>
        </div>

        {/* Sport Selector — tap any chip to pick sport and navigate to Map */}
        <div className="w-full space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Tap a sport to activate
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SPORTS.map((sport) => (
              <button
                key={sport.id}
                onClick={() => {
                  setSelectedSport(sport.id);
                  if (permissionState !== "granted") {
                    setShowLocationModal(true);
                  } else {
                    onPickSport(sport.id);
                  }
                }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
                style={
                  selectedSport === sport.id
                    ? { backgroundColor: '#D4AF37', color: '#0A0A0A', fontWeight: 700 }
                    : { backgroundColor: '#1A1A1A', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }
                }
              >
                {sport.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activate / Deactivate Button */}
        {!isActive && !activated ? (
          <button
            onClick={handleActivate}
            className="w-full max-w-xs py-4 rounded-2xl text-base font-bold uppercase tracking-widest transition-all active:scale-95"
            style={{ backgroundColor: '#D4AF37', color: '#0A0A0A' }}
          >
            Activate My Sport
          </button>
        ) : (
          <div className="w-full max-w-xs space-y-3 text-center">
            <div
              className="py-3 rounded-2xl text-sm font-semibold"
              style={{ backgroundColor: '#0D2B0D', color: '#4ADE80', border: '1px solid #4ADE80' }}
            >
              ✓ ACTIVE — {SPORTS.find(s => s.id === selectedSport)?.label ?? selectedSport}
            </div>
            <button
              onClick={handleDeactivate}
              className="w-full py-3 rounded-2xl text-sm font-medium transition-all active:scale-95"
              style={{ backgroundColor: '#1A1A1A', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Deactivate
            </button>
          </div>
        )}

        {/* Enter Map shortcut */}
        <button
          onClick={() => navigate({ to: "/map" })}
          className="text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Enter Map →
        </button>
      </div>

      <LocationPermissionModal
        open={showLocationModal}
        onEnableLocation={handleEnableLocation}
        onCancel={() => setShowLocationModal(false)}
        isRequesting={isChecking}
      />
    </div>
  );
}
