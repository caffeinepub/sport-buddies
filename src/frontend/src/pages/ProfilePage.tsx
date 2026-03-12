import { Switch } from "@/components/ui/switch";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  LogOut,
  Mail,
  MapPin,
  Radar,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LocationPermissionModal } from "../components/LocationPermissionModal";
import ScreenBanner from "../components/ScreenBanner";
import { useSport } from "../context/SportContext";
import type { UserMode } from "../context/SportContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useInviteRecords } from "../hooks/useInviteRecords";
import { useLocationPermission } from "../hooks/useLocationPermission";
import { usePresenceState } from "../hooks/usePresenceState";
import { useGetUserProfile } from "../hooks/useQueries";
import { safeNavigate } from "../utils/safeNavigate";

/**
 * Returns a human-readable relative timestamp for a unix-ms timestamp.
 * e.g. "just now", "2 minutes ago", "1 hour ago", "3 days ago"
 */
function formatTimeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}

type StatusOption = "out_now" | "on_my_way" | "planned";

const STATUS_OPTIONS: {
  id: StatusOption;
  label: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    id: "out_now",
    label: "Out Now",
    color: "text-green-400",
    bg: "bg-green-900/40",
    border: "border-green-500/50",
  },
  {
    id: "on_my_way",
    label: "On My Way",
    color: "text-purple-400",
    bg: "bg-purple-900/40",
    border: "border-purple-500/50",
  },
  {
    id: "planned",
    label: "Planned",
    color: "text-blue-400",
    bg: "bg-blue-900/40",
    border: "border-blue-500/50",
  },
];

const USER_MODE_OPTIONS: {
  id: UserMode;
  label: string;
  description: string;
}[] = [
  { id: "normal", label: "Normal", description: "Standard mode" },
  {
    id: "buddy_finder",
    label: "Buddy Finder",
    description: "Find sport partners",
  },
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
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useGetUserProfile();
  const { isActive: isPresenceActive, presenceSport } = usePresenceState();
  const { permissionState, requestPermission, isChecking } =
    useLocationPermission();
  const {
    locationEnabled,
    setLocationEnabled,
    userMode,
    setUserMode,
    emergencyState,
    emergencyLevel,
    armEmergency,
    triggerEmergency,
    resolveEmergency,
    trustScore,
    eventsAttendedCount,
    eventsHostedCount,
    profileCompleted,
    setProfileCompleted,
  } = useSport();

  const { inviteRecords, clearInvites } = useInviteRecords();

  // Tick every 30 s so relative timestamps re-evaluate without a page reload.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(() => {
    try {
      const stored = localStorage.getItem(STATUS_STORAGE_KEY);
      if (
        stored === "out_now" ||
        stored === "on_my_way" ||
        stored === "planned"
      ) {
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

  const handleLocationToggle = async (checked: boolean) => {
    if (checked) {
      if (permissionState === "denied") {
        toast.error(
          "Location permission was denied. Please enable it in your browser settings.",
        );
        return;
      }
      setShowLocationModal(true);
    } else {
      setLocationEnabled(false);
      toast.info(
        "Location disabled. Enable it again from your profile settings.",
      );
    }
  };

  const handleEnableLocation = async () => {
    const granted = await requestPermission();
    setShowLocationModal(false);
    if (granted) {
      setLocationEnabled(true);
      toast.success("Location enabled!");
    } else {
      setLocationEnabled(false);
      toast.error("Location permission denied. Check your browser settings.");
    }
  };

  const handleModeSelect = (mode: UserMode) => {
    setUserMode(mode);
    const option = USER_MODE_OPTIONS.find((o) => o.id === mode);
    if (option) {
      toast.success(`Mode set to "${option.label}"`);
    }
  };

  const handleEmergencyShield = () => {
    safeNavigate("/sos", navigate);
  };

  const handleClearInvites = () => {
    clearInvites();
    toast.success("Invites cleared");
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
        <h1 className="text-2xl font-bold text-foreground mb-5 pt-2">
          Profile
        </h1>

        {/* Profile Header */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-5 mb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground text-lg truncate">
              {displayName}
            </p>
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
            <h2 className="text-sm font-semibold text-foreground">
              Sport Status
            </h2>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div>
              <p className="text-xs text-muted-foreground">Current Sport</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {primarySport}
              </p>
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

        {/* Trust Score (Block 50) */}
        <div className="bg-charcoal border border-gold/30 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🏅</span>
            <h2 className="text-sm font-semibold text-foreground">
              Trust Score
            </h2>
          </div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">Overall Trust</p>
            <span className="text-2xl font-extrabold text-gold">
              {trustScore}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 bg-white/5 rounded-lg p-2.5 text-center border border-white/10">
              <p className="text-lg font-bold text-foreground">
                {eventsAttendedCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Events Attended
              </p>
            </div>
            <div className="flex-1 bg-white/5 rounded-lg p-2.5 text-center border border-white/10">
              <p className="text-lg font-bold text-foreground">
                {eventsHostedCount}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Events Hosted
              </p>
            </div>
          </div>
        </div>

        {/* Invites Sent (Block 76) */}
        <div
          className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4"
          data-ocid="profile.invites_sent.section"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gold" />
              <h2 className="text-sm font-semibold text-foreground">
                Invites Sent
              </h2>
            </div>
            {inviteRecords.length > 0 && (
              <button
                type="button"
                data-ocid="profile.invites_sent.clear_button"
                onClick={handleClearInvites}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors active:scale-95"
              >
                Clear
              </button>
            )}
          </div>
          {inviteRecords.length === 0 ? (
            <p
              className="text-xs text-muted-foreground mt-2"
              data-ocid="profile.invites_sent.empty_state"
            >
              No invites sent yet
            </p>
          ) : (
            // tick dependency ensures relative timestamps refresh every 30 s
            <div className="mt-2" aria-label={`invites-${tick}`}>
              {inviteRecords
                .slice()
                .sort((a, b) => b.sentAt - a.sentAt)
                .slice(0, 20)
                .map((record, index) => (
                  <div
                    key={record.id}
                    data-ocid={`profile.invites_sent.item.${index + 1}`}
                    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gold leading-tight">
                        {record.toName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {record.sport}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0 ml-3">
                      {formatTimeAgo(record.sentAt)}
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Profile Completion Gate (Block 57) */}
        <div
          className={`rounded-xl p-4 mb-4 border ${
            profileCompleted
              ? "bg-charcoal border-green-500/40"
              : "bg-charcoal border-yellow-500/40"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{profileCompleted ? "✅" : "⚠️"}</span>
            <h2 className="text-sm font-semibold text-foreground">
              Profile Status
            </h2>
          </div>
          <p
            className={`text-sm font-bold mb-3 ${
              profileCompleted ? "text-green-400" : "text-yellow-400"
            }`}
          >
            {profileCompleted ? "Complete" : "Incomplete"}
          </p>
          {!profileCompleted && (
            <p className="text-xs text-muted-foreground mb-3">
              Complete your profile to unlock sport activation and event
              joining.
            </p>
          )}
          {!profileCompleted && (
            <button
              type="button"
              data-ocid="profile.complete_profile.button"
              onClick={() => setProfileCompleted(true)}
              className="w-full py-2.5 rounded-lg text-xs font-bold bg-yellow-900/40 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-900/60 transition-all active:scale-95"
            >
              Complete Profile (Dev Toggle)
            </button>
          )}
          {profileCompleted && (
            <button
              type="button"
              data-ocid="profile.reset_profile.button"
              onClick={() => setProfileCompleted(false)}
              className="w-full py-2 rounded-lg text-xs font-medium bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-all active:scale-95"
            >
              Reset (Dev Toggle)
            </button>
          )}
        </div>

        {/* Status Selector */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            My Status
          </h2>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                type="button"
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

        {/* User Mode Selector */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Radar className="w-4 h-4 text-gold" />
            <h2 className="text-sm font-semibold text-foreground">User Mode</h2>
          </div>
          <div className="flex gap-2">
            {USER_MODE_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.id}
                onClick={() => handleModeSelect(option.id)}
                className={`flex-1 py-2.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                  userMode === option.id
                    ? "bg-gold/20 text-gold border-gold/50 shadow-sm"
                    : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10"
                }`}
              >
                <span className="block">{option.label}</span>
                <span
                  className={`block text-[10px] font-normal mt-0.5 ${userMode === option.id ? "text-gold/70" : "text-muted-foreground/60"}`}
                >
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          {userMode === "buddy_finder" && (
            <p className="text-xs text-gold/80 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse inline-block" />
              Buddy Finder mode is active — enhanced matching on Map
            </p>
          )}
        </div>

        {/* Location Toggle */}
        <div className="bg-charcoal border border-white/10 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Location
                </p>
                <p
                  className={`text-xs font-medium mt-0.5 ${locationEnabled ? "text-green-400" : "text-muted-foreground"}`}
                >
                  {locationEnabled
                    ? "ON — Location active"
                    : "OFF — Location disabled"}
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
          type="button"
          onClick={handleEmergencyShield}
          className="w-full bg-charcoal border border-red-900/40 rounded-xl p-4 mb-4 flex items-center justify-between hover:opacity-90 active:scale-[0.99] transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">
                Emergency Shield
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Activate SOS alert
              </p>
            </div>
          </div>
          <span className="text-muted-foreground text-xs">›</span>
        </button>

        {/* ── DEBUG SECTION (Block 47 — temporary) ── */}
        <div className="bg-charcoal border border-yellow-500/40 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-yellow-400 mb-2 uppercase tracking-widest">
            🐛 Emergency Debug (Block 51)
          </p>
          <p className="text-sm font-mono mb-1 text-white">
            State:{" "}
            <span className="text-yellow-300 font-bold">{emergencyState}</span>
          </p>
          <p className="text-sm font-mono mb-3 text-white">
            Level:{" "}
            <span className="text-yellow-300 font-bold">{emergencyLevel}</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-ocid="profile.arm.button"
              onClick={armEmergency}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-yellow-900/40 text-yellow-300 border border-yellow-500/40 hover:bg-yellow-900/60 transition-all active:scale-95"
            >
              ARM
            </button>
            <button
              type="button"
              data-ocid="profile.trigger.button"
              onClick={triggerEmergency}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-900/40 text-red-300 border border-red-500/40 hover:bg-red-900/60 transition-all active:scale-95"
            >
              TRIGGER
              {!locationEnabled && (
                <span className="block text-[9px] text-red-400/60 font-normal mt-0.5">
                  (blocked — location off)
                </span>
              )}
            </button>
            <button
              type="button"
              data-ocid="profile.resolve.button"
              onClick={resolveEmergency}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-green-900/40 text-green-300 border border-green-500/40 hover:bg-green-900/60 transition-all active:scale-95"
            >
              RESOLVE
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <button
          type="button"
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
