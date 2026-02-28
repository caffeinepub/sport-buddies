import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, QrCode, Barcode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function isCameraAvailable(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}

const FALLBACK_MESSAGE =
  "Scanning is unavailable in preview. Use a real build to scan.";

export default function ScanPage() {
  const navigate = useNavigate();

  const handleScanUPC = () => {
    if (!isCameraAvailable()) {
      toast.info(FALLBACK_MESSAGE);
      return;
    }
    // Camera is available — navigate to the CoinGrab scanner
    try {
      navigate({ to: "/coin-grab" });
    } catch {
      toast.info(FALLBACK_MESSAGE);
    }
  };

  const handleScanQR = () => {
    if (!isCameraAvailable()) {
      toast.info(FALLBACK_MESSAGE);
      return;
    }
    // Camera is available — navigate to the CoinGrab scanner (QR mode)
    try {
      navigate({ to: "/coin-grab" });
    } catch {
      toast.info(FALLBACK_MESSAGE);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: "/" })}
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <QrCode className="w-6 h-6 text-gold" />
        <h1 className="text-2xl font-bold text-foreground">Scan</h1>
      </div>
      <p className="text-muted-foreground mb-8 text-sm">
        Scan Sport Buddies UPC stickers, event codes, or buddy QR badges.
      </p>

      {/* Action Cards */}
      <div className="space-y-4">
        {/* Scan UPC / CoinGrab */}
        <button
          onClick={handleScanUPC}
          className="w-full text-left bg-charcoal rounded-xl p-5 border border-border hover:border-gold/50 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold/40"
          style={{ backgroundColor: "#2A070B" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: "rgba(212,175,55,0.15)",
                border: "1.5px solid rgba(212,175,55,0.4)",
              }}
            >
              <Barcode className="w-6 h-6" style={{ color: "#D4AF37" }} />
            </div>
            <div>
              <p className="font-bold text-foreground text-base">
                Scan UPC / CoinGrab
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Scan official Sport Buddies UPC stickers to earn coins
              </p>
            </div>
          </div>
        </button>

        {/* Scan QR Badge */}
        <button
          onClick={handleScanQR}
          className="w-full text-left bg-charcoal rounded-xl p-5 border border-border hover:border-gold/50 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold/40"
          style={{ backgroundColor: "#2A070B" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="p-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: "rgba(212,175,55,0.15)",
                border: "1.5px solid rgba(212,175,55,0.4)",
              }}
            >
              <QrCode className="w-6 h-6" style={{ color: "#D4AF37" }} />
            </div>
            <div>
              <p className="font-bold text-foreground text-base">
                Scan QR Badge
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Scan a buddy's QR badge to connect or verify attendance
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Preview notice */}
      <div
        className="mt-8 rounded-lg p-4"
        style={{
          backgroundColor: "rgba(212,175,55,0.07)",
          border: "1px solid rgba(212,175,55,0.25)",
        }}
      >
        <p className="text-xs font-semibold mb-1" style={{ color: "#D4AF37" }}>
          Preview Mode
        </p>
        <p className="text-xs text-muted-foreground">
          Camera scanning requires a real device build. Tap either button above
          to see the fallback message.
        </p>
      </div>
    </div>
  );
}
