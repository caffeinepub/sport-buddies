import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ChevronLeft, MapPin, Phone, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EmergencyShieldPage() {
  const navigate = useNavigate();
  const [alertSent, setAlertSent] = useState(false);

  function handleSendAlert() {
    setAlertSent(true);
    toast.success("Alert sent — notifying nearby users");
    setTimeout(() => setAlertSent(false), 3000);
  }

  function handleShareLocation() {
    toast("Location sharing ready");
  }

  function handleCallForHelp() {
    toast("Calling emergency contact");
  }

  function handleAlertBuddies() {
    toast("Alert sent to your buddies");
  }

  function handleBack() {
    navigate({ to: "/more" });
  }

  return (
    <div
      data-ocid="emergency_shield.page"
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#120305", color: "#fff" }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: "rgba(239,68,68,0.2)" }}
      >
        <button
          type="button"
          data-ocid="emergency_shield.back_button"
          onClick={handleBack}
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors active:opacity-70"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ChevronLeft size={20} style={{ color: "#F87171" }} />
        </button>
        <h1
          className="text-xl font-bold"
          style={{ color: "#F87171" }}
          data-ocid="emergency_shield.header"
        >
          Emergency Shield
        </h1>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center px-5 pt-10 pb-10 gap-8">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-20 h-20 rounded-full"
          style={{
            backgroundColor: "rgba(239,68,68,0.12)",
            border: "2px solid rgba(239,68,68,0.4)",
          }}
        >
          <AlertTriangle size={38} style={{ color: "#F87171" }} />
        </div>

        {/* Primary Action */}
        <div className="w-full flex flex-col items-center gap-3">
          <button
            type="button"
            data-ocid="emergency_shield.send_alert_button"
            onClick={handleSendAlert}
            className="w-full py-5 rounded-2xl font-bold text-xl tracking-wide transition-all active:scale-95"
            style={{
              backgroundColor: alertSent ? "#7F1D1D" : "#DC2626",
              color: "#fff",
              boxShadow: "0 0 24px rgba(220,38,38,0.4)",
            }}
          >
            {alertSent ? "✅ Alert Sent" : "🚨 Send Alert"}
          </button>
          <p
            className="text-sm text-center"
            style={{ color: "rgba(255,255,255,0.5)" }}
            data-ocid="emergency_shield.status_text"
          >
            Use this to quickly alert others in your area
          </p>
        </div>

        {/* Secondary Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            type="button"
            data-ocid="emergency_shield.share_location_button"
            onClick={handleShareLocation}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-xl font-semibold text-base text-left transition-all active:opacity-70"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#F5F5F5",
            }}
          >
            <MapPin size={20} style={{ color: "#F87171" }} />📍 Share Location
          </button>

          <button
            type="button"
            data-ocid="emergency_shield.call_help_button"
            onClick={handleCallForHelp}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-xl font-semibold text-base text-left transition-all active:opacity-70"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#F5F5F5",
            }}
          >
            <Phone size={20} style={{ color: "#F87171" }} />📞 Call for Help
          </button>

          <button
            type="button"
            data-ocid="emergency_shield.alert_buddies_button"
            onClick={handleAlertBuddies}
            className="flex items-center gap-4 w-full px-5 py-4 rounded-xl font-semibold text-base text-left transition-all active:opacity-70"
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#F5F5F5",
            }}
          >
            <Users size={20} style={{ color: "#F87171" }} />👥 Alert Buddies
          </button>
        </div>

        {/* Done / Back button */}
        <button
          type="button"
          data-ocid="emergency_shield.done_button"
          onClick={handleBack}
          className="w-full py-4 rounded-xl font-semibold text-base transition-all active:opacity-70 mt-auto"
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
