import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export default function SafetyPage() {
  const navigate = useNavigate();

  const handleSetupEmergency = () => {
    navigate({ to: "/emergency" });
  };

  const handleLearnEmergency = () => {
    toast.info(
      "Emergency Shield: Press and hold the shield button for 2 seconds to activate. Buddies and emergency contacts will be notified.",
    );
  };

  const handleSetupNotifications = () => {
    toast.info(
      "Notification setup coming soon. You'll be able to configure buddy alerts and emergency notifications.",
    );
  };

  const handleLearnNotifications = () => {
    toast.info(
      "Emergency Notifications: When activated, your buddies and emergency contacts receive your location and a distress alert.",
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 space-y-6">
        <h1 className="text-xl font-bold text-foreground">Safety</h1>

        {/* Emergency Service Badge */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex justify-center">
            <img
              src="/assets/generated/emergency-service-badge.dim_400x500.png"
              alt="Emergency Service Badge"
              className="w-32 h-auto"
            />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-semibold text-foreground">Emergency Shield</h2>
            <p className="text-sm text-muted-foreground">
              Activate your personal emergency shield to alert buddies and
              contacts.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSetupEmergency}
              className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold active:scale-95 transition-transform"
            >
              SETUP
            </button>
            <button
              type="button"
              onClick={handleLearnEmergency}
              className="flex-1 bg-muted text-muted-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"
            >
              LEARN
            </button>
          </div>
        </div>

        {/* Emergency Notifications Badge */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <div className="flex justify-center">
            <img
              src="/assets/generated/emergency-notifications-badge.dim_400x500.png"
              alt="Emergency Notifications Badge"
              className="w-32 h-auto"
            />
          </div>
          <div className="text-center space-y-1">
            <h2 className="font-semibold text-foreground">
              Emergency Notifications
            </h2>
            <p className="text-sm text-muted-foreground">
              Configure who gets notified when you activate your emergency
              shield.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSetupNotifications}
              className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold active:scale-95 transition-transform"
            >
              SETUP
            </button>
            <button
              type="button"
              onClick={handleLearnNotifications}
              className="flex-1 bg-muted text-muted-foreground rounded-lg py-2.5 text-sm font-medium active:scale-95 transition-transform"
            >
              LEARN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
