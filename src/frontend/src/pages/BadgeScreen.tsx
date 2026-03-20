import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function BadgeScreen() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "#1a0a0a" }}
      data-ocid="badge_screen.root"
    >
      {/* Back button */}
      <button
        type="button"
        data-ocid="badge_screen.back_button"
        onClick={() => navigate({ to: "/" })}
        className="absolute top-16 left-4 flex items-center gap-2 text-gold/80 hover:text-gold transition-colors focus:outline-none"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-semibold uppercase tracking-wider">
          Back
        </span>
      </button>

      {/* Badge icon */}
      <div
        data-ocid="badge_screen.badge_icon"
        className="flex items-center justify-center w-36 h-36 rounded-full mb-8"
        style={{
          background:
            "radial-gradient(circle, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.04) 100%)",
          border: "2px solid rgba(212,175,55,0.55)",
          boxShadow: "0 0 32px 8px rgba(212,175,55,0.18)",
        }}
      >
        <img
          src="/assets/generated/sb-badge.dim_48x48.png"
          alt="Sport Buddies Badge"
          className="w-20 h-20 object-contain"
          onError={(e) => {
            const t = e.target as HTMLImageElement;
            t.style.display = "none";
            t.nextElementSibling?.classList.remove("hidden");
          }}
        />
        {/* Fallback */}
        <span className="hidden text-gold font-black text-5xl">SB</span>
      </div>

      {/* Title */}
      <h1
        data-ocid="badge_screen.title"
        className="text-2xl font-extrabold tracking-widest text-gold uppercase mb-2"
      >
        Security Badge
      </h1>

      {/* Status */}
      <div
        data-ocid="badge_screen.status"
        className="flex items-center gap-2 mt-1 mb-3"
      >
        <CheckCircle2 className="w-5 h-5 text-green-400" />
        <span className="text-green-400 font-bold text-base uppercase tracking-widest">
          Active · Verified
        </span>
      </div>

      {/* Subtext */}
      <p
        data-ocid="badge_screen.subtext"
        className="text-sm text-muted-foreground text-center max-w-xs mt-1"
      >
        This badge confirms your verified presence as a Sport Buddies member.
      </p>

      {/* User label */}
      <div
        data-ocid="badge_screen.user_label"
        className="mt-8 px-6 py-3 rounded-xl"
        style={{
          background: "rgba(212,175,55,0.08)",
          border: "1px solid rgba(212,175,55,0.25)",
        }}
      >
        <span className="text-gold font-semibold text-sm tracking-wider">
          Verified User
        </span>
      </div>

      {/* Done button */}
      <button
        type="button"
        data-ocid="badge_screen.done_button"
        onClick={() => navigate({ to: "/" })}
        className="mt-10 px-10 py-3 rounded-2xl font-bold uppercase tracking-widest text-black text-sm transition-transform active:scale-95"
        style={{ background: "#D4AF37" }}
      >
        Done
      </button>
    </div>
  );
}
