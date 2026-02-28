import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { User, Shield, MapPin, Activity, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetUserProfile } from "../hooks/useQueries";
import { usePresenceState } from "../hooks/usePresenceState";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { LocationPermissionModal } from "../components/LocationPermissionModal";
import { safeNavigate } from "../utils/safeNavigate";
import ScreenBanner from "../components/ScreenBanner";

type StatusOption = "out_now" | "on_my_way" | "planned";

const STATUS_OPTIONS: { id: StatusOption; label: string; color: string; bg: string; border: string }[] = [
  { id: "out_now", label: "Out Now", color: "text-green-400", bg: "bg-green-900/40", border: "border-green-500/50" },
  { id: "on_my_way", label: "On My Way", color: "text-purple-400", bg: "bg-purple-900/40", border: "border-purple-500/50" },
  { id: "planned", label: "Planned", color: "text-blue-400", bg: "bg-blue-900/40", border: "border-blue-500/50" },
];

const SPORT_LABELS: Record<string, string> = {
  soccer: "⚽ Soccer",
  basketball: "🏀 Basketball",
  tennis: "🎾 Tennis",
  running: "🏃 Running",
  swimming: "🏊 Swimming",
  cycling: "🚴 Cycling",
  yoga: "🧘 Yoga",
};

const STATUS_STORAGE_KEY = "profile-status-selector";

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetUserProfile();
  const { isActive: isPresenceActive, presenceSport } = usePresenceState();
  const { permissionState, requestPermission, isChecking } = useLocationPermission();

  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(() => {
    try {
      const stored = localStorage.getItem(STATUS_STORAGE_KEY);
      if (stored === "out_now" || stored === "on_my_way" || stored === "planned") {
        return stored;
      }
    } catch {
      // ignore
    }
    return "planned";
  });

  const [showLocationModal, setShowLocationModal] = useState(false);

  // Persist status selection
  useEffect(() => {
    try {
      localStorage.setItem(STATUS_STORAGE_KEY, selectedStatus);
    } catch {
      // ignore
    }
  }, [selectedStatus]);

  const handleStatusSelect = (status: StatusOption) => {
    setSelectedStatus(status);
    const option = STATUS_OPTIONS.find((o) => o.id === status);
    if (option) {
      toast.success(`Status set to "${option.label}"`);
    }
  };

  const locationEnabled = permissionState === "granted";

  const handleLocationToggle = async (checked: boolean) => {
    if (checked) {
      if (permissionState === "denied") {
        toast.error("Location permission was denied. Please enable it in your browser settings.");
        return;
      }
      setShowLocationModal(true);
    }
    // If toggling off, we can't revoke browser permission programmatically — just inform
    if (!checked && locationEnabled) {
      toast.info("To disable location, update your browser settings.");
    }
  };

  const handleEnableLocation = async () => {
    const granted = await requestPermission();
    setShowLocationModal(false);
    if (granted) {
      toast.success("Location enabled!");
    } else {
      toast.error("Location permission denied. Check your browser settings.");
    }
  };

  const handleEmergencyShield = () => {
    safeNavigate("/sos", navigate);
  };

  const handleLogout = () => {
    clear();
    navigate({ to: "/auth" });
  };

  const displayName = profile?.name || "Your Profile";
  const primarySport = profile?.primarySport
    ? SPORT_LABELS[profile.primarySport] || profile.primarySport
    : presenceSport
    ? SPORT_LABELS[presenceSport] || presenceSport
    : "Not set";

  const sportIsActive = isPresenceActive;

  return (
    <div className="pb-8">
      <ScreenBanner screenName="ProfileScreen" routeName="Profile" />

      <div className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-5 pt-2">Profile</h1>

        {/* Profile Header */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-lg truncate">{displayName}</p>
            {identity && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {identity.getPrincipal().toString().slice(0, 20)}…
              </p>
            )}
          </div>
        </div>

        {/* Sport Status */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-semibold text-foreground">Sport Status</h2>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Current Sport</p>
              <p className="text-sm font-medium text-foreground mt-0.5">{primarySport}</p>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                sportIsActive
                  ? "bg-green-900/40 text-green-400 border border-green-500/40"
                  : "bg-white/5 text-muted-foreground border border-white/10"
              }`}
            >
              {sportIsActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Status Selector */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">My Status</h2>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleStatusSelect(option.id)}
                className={`flex-1 py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
                  selectedStatus === option.id
                    ? `${option.bg} ${option.color} ${option.border} shadow-sm`
                    : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location Toggle */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              <div>
                <p className="text-sm font-semibold text-foreground">Location Enabled</p>
                <p className={`text-xs font-medium mt-0.5 ${locationEnabled ? "text-green-400" : "text-muted-foreground"}`}>
                  {locationEnabled ? "ON — Location active" : "OFF — Location disabled"}
                </p>
              </div>
            </div>
            <Switch
              checked={locationEnabled}
              onCheckedChange={handleLocationToggle}
              disabled={isChecking}
            />
          </div>
        </div>

        {/* Emergency Shield */}
        <button
          onClick={handleEmergencyShield}
          className="w-full bg-charcoal border border-red-900/40 rounded-xl p-4 mb-4 flex items-center justify-between hover:opacity-90 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Emergency Shield</p>
              <p className="text-xs text-muted-foreground mt-0.5">Activate SOS alert</p>
            </div>
          </div>
          <span className="text-muted-foreground text-xs">›</span>
        </button>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="w-full bg-charcoal border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:opacity-90 active:scale-[0.99] transition-all"
        >
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Sign Out</p>
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
