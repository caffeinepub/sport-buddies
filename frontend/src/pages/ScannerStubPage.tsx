import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ScanLine, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScannerStubPage() {
  const navigate = useNavigate();

  // Read the 'type' query param from the URL manually (avoids strict route-id issues)
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");

  const isUPC = type === "upc";
  const isQR = type === "qr";

  const scannerTitle = isUPC
    ? "UPC / CoinGrab Scanner"
    : isQR
    ? "QR Badge Scanner"
    : "Scanner";

  const scannerDescription = isUPC
    ? "Scan product barcodes (UPC) to earn Sport Buddy Coins through the CoinGrab program."
    : isQR
    ? "Scan QR badges at events and partner locations to earn Sport Buddy Coins."
    : "Scan codes to earn Sport Buddy Coins.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Back button */}
        <button
          onClick={() => navigate({ to: "/coins" })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Coins</span>
        </button>

        {/* Main card */}
        <div className="bg-charcoal border border-white/10 rounded-2xl p-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
            {isUPC ? (
              <ScanLine className="w-8 h-8 text-gold" />
            ) : (
              <Camera className="w-8 h-8 text-gold" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground mb-1">
            Scanner Preview Unavailable
          </h1>
          <p className="text-sm font-medium text-gold mb-4">{scannerTitle}</p>

          {/* Divider */}
          <div className="border-t border-white/10 mb-4" />

          {/* Preview message */}
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Camera scanning requires a real device build. Preview mode shows this message only.
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            {scannerDescription}
          </p>

          {/* Camera placeholder */}
          <div className="w-full aspect-square max-w-[200px] mx-auto rounded-xl bg-black/40 border-2 border-dashed border-white/20 flex flex-col items-center justify-center mb-6">
            <Camera className="w-10 h-10 text-white/20 mb-2" />
            <p className="text-xs text-white/30">Camera unavailable</p>
            <p className="text-xs text-white/20">in preview mode</p>
          </div>

          <Button
            onClick={() => navigate({ to: "/coins" })}
            className="w-full bg-gold hover:bg-gold-dark text-black font-semibold"
          >
            Go Back to Coins
          </Button>
        </div>
      </div>
    </div>
  );
}
