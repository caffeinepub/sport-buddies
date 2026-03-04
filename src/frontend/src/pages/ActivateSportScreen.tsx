import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MapPin, Zap } from "lucide-react";
import { useState } from "react";
import { LocationPermissionModal } from "../components/LocationPermissionModal";
import ScreenBanner from "../components/ScreenBanner";
import { useSport } from "../context/SportContext";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { usePresenceState } from "../hooks/usePresenceState";

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
  const { activatePresence, clearPresence } = usePresenceState();
  const { permissionState, requestPermission, isChecking } =
    useLocationPermission();
  const {
    sportStatus,
    currentSport,
    activateSport,
    deactivateSport,
    locationEnabled,
    emergencyState,
    emergencyLevel,
    profileCompleted,
  } = useSport();
  const [selectedSport, setSelectedSport] = useState("soccer");
  const [showLocationModal, setShowLocationModal] = useState(false);

  const isActive = sportStatus === "active";

  const onPickSport = (sportName: string) => {
    activateSport(sportName);
    localStorage.setItem("sb_activeSport", sportName);
    localStorage.setItem("sb_status", "out_now");
    activatePresence(sportName);
    navigate({ to: "/map" });
  };

  const handleActivate = () => {
    // Block 57: profile must be complete before activating
    if (!profileCompleted) {
      alert(
        "Complete Profile\n\nYou must complete your profile before going live.",
      );
      return;
    }
    if (!locationEnabled) {
      // Location is disabled in settings — don't proceed
      return;
    }
    if (permissionState !== "granted") {
      setShowLocationModal(true);
      return;
    }
    onPickSport(selectedSport);
  };

  const handleEnableLocation = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowLocationModal(false);
      onPickSport(selectedSport);
    }
  };

  const handleButtonPress = () => {
    // Block all activation changes during active emergency
    if (
      emergencyState === "triggered" ||
      emergencyState === "escalated" ||
      emergencyState === "rescue"
    )
      return;
    if (isActive) {
      deactivateSport();
      clearPresence();
      localStorage.removeItem("sb_activeSport");
      localStorage.setItem("sb_status", "offline");
    } else {
      handleActivate();
    }
  };

  const buttonLabel = isActive
    ? `Deactivate ${currentSport}`
    : "Activate My Sport";

  const isEmergencyTriggered =
    emergencyState === "triggered" ||
    emergencyState === "escalated" ||
    emergencyState === "rescue";
  const buttonDisabled =
    (!isActive && (!profileCompleted || !locationEnabled)) ||
    isEmergencyTriggered ||
    emergencyLevel > 0;

  const buttonStyle = isActive
    ? {
        backgroundColor: "#1A1A1A",
        color: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(255,255,255,0.2)",
      }
    : locationEnabled
      ? { backgroundColor: "#D4AF37", color: "#0A0A0A" }
      : {
          backgroundColor: "#1A1A1A",
          color: "rgba(255,255,255,0.3)",
          border: "1px solid rgba(255,255,255,0.1)",
          cursor: "not-allowed",
        };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      <ScreenBanner
        screenName="ActivateSportScreen"
        routeName="ActivateSport"
      />

      {/* Back button */}
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "#D4AF37" }}
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
            style={{ backgroundColor: "#1A0A0D", border: "2px solid #D4AF37" }}
          >
            <Zap className="w-10 h-10" style={{ color: "#D4AF37" }} />
          </div>
          <h1
            className="text-2xl font-bold tracking-widest uppercase"
            style={{ color: "#D4AF37" }}
          >
            One-Touch Activation
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
            Select your sport and go live instantly.
          </p>
        </div>

        {/* Profile incomplete warning */}
        {!profileCompleted && !isActive && (
          <div
            className="w-full max-w-xs flex items-start gap-3 py-3 px-4 rounded-2xl"
            style={{
              backgroundColor: "#1A0D00",
              border: "1px solid rgba(212,175,55,0.4)",
            }}
          >
            <span className="text-sm mt-0.5 flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#D4AF37" }}>
                Profile incomplete
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Complete your profile on the Profile tab before going live.
              </p>
            </div>
          </div>
        )}

        {/* Location disabled warning */}
        {!locationEnabled && !isActive && (
          <div
            className="w-full max-w-xs flex items-start gap-3 py-3 px-4 rounded-2xl"
            style={{
              backgroundColor: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <MapPin
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: "rgba(255,255,255,0.5)" }}
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Location is disabled
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                Enable location in your Profile settings to activate your sport
                presence.
              </p>
            </div>
          </div>
        )}

        {/* Active status indicator */}
        {isActive && (
          <div
            className="w-full max-w-xs py-3 rounded-2xl text-sm font-semibold text-center"
            style={{
              backgroundColor: "#0D2B0D",
              color: "#4ADE80",
              border: "1px solid #4ADE80",
            }}
          >
            ✓ ACTIVE —{" "}
            {SPORTS.find((s) => s.id === currentSport?.toLowerCase())?.label ??
              currentSport}
          </div>
        )}

        {/* Sport Selector */}
        <div className="w-full space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-widest text-center"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {isActive ? "Currently active sport" : "Tap a sport to activate"}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {SPORTS.map((sport) => (
              <button
                type="button"
                key={sport.id}
                onClick={() => {
                  if (isEmergencyTriggered || emergencyLevel > 0) return;
                  if (isActive) return;
                  if (!profileCompleted) return;
                  if (!locationEnabled) return;
                  setSelectedSport(sport.id);
                  if (permissionState !== "granted") {
                    setShowLocationModal(true);
                  } else {
                    onPickSport(sport.id);
                  }
                }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95"
                style={
                  (
                    isActive
                      ? currentSport?.toLowerCase() === sport.id
                      : selectedSport === sport.id
                  )
                    ? {
                        backgroundColor: "#D4AF37",
                        color: "#0A0A0A",
                        fontWeight: 700,
                      }
                    : {
                        backgroundColor: "#1A1A1A",
                        color:
                          isActive || !locationEnabled
                            ? "rgba(255,255,255,0.3)"
                            : "rgba(255,255,255,0.6)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        cursor:
                          isActive || !locationEnabled ? "default" : "pointer",
                      }
                }
              >
                {sport.label}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Activate / Deactivate Button */}
        <button
          type="button"
          onClick={handleButtonPress}
          disabled={buttonDisabled}
          className="w-full max-w-xs py-4 rounded-2xl text-base font-bold uppercase tracking-widest transition-all active:scale-95 disabled:active:scale-100"
          style={buttonStyle}
        >
          {buttonLabel}
        </button>

        {/* Enter Map shortcut */}
        <button
          type="button"
          onClick={() => navigate({ to: "/map" })}
          className="text-sm underline underline-offset-4 transition-opacity hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.4)" }}
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
