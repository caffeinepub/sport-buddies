import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Copy, Check, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";

const INVITE_LINK = "https://sportbuddies.app/join?ref=SB-DEMO-2026";

export default function InvitePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INVITE_LINK);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy — please copy the link manually.");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Sport Buddies",
          text: "Find your crew and play your sport with Sport Buddies!",
          url: INVITE_LINK,
        });
      } catch {
        // User cancelled share — no error needed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Invite Friends</h1>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl">🤝</div>
            <h2 className="font-semibold text-foreground">Bring Your Crew</h2>
            <p className="text-sm text-muted-foreground">
              Share your invite link and earn coins when friends join and play their first sport session.
            </p>
          </div>

          <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
            <span className="flex-1 text-xs text-muted-foreground font-mono truncate">
              {INVITE_LINK}
            </span>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 rounded-md bg-primary text-primary-foreground active:scale-95 transition-transform"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold active:scale-95 transition-transform"
          >
            <Share2 className="w-4 h-4" />
            Share Invite Link
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-foreground text-sm">How it works</h3>
          <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside">
            <li>Share your unique invite link with friends</li>
            <li>They sign up and complete their sport profile</li>
            <li>You both earn bonus coins when they check in for the first time</li>
          </ol>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Invite sharing is in preview — links are illustrative.
        </p>
      </div>
    </div>
  );
}
