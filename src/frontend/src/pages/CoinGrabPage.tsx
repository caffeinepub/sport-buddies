import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoinBalance } from "@/hooks/useCoinBalance";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQRScanner } from "../qr-code/useQRScanner";

const CLAIMED_CODES_KEY = "sb_claimedCodes";

const VALID_CODES: Record<string, number> = {
  "HELI-50": 50,
  "FERRARI-50": 50,
  "SWAG-20": 20,
};

const getClaimedCodes = (): string[] => {
  try {
    const stored = localStorage.getItem(CLAIMED_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const addClaimedCode = (code: string) => {
  try {
    const claimed = getClaimedCodes();
    claimed.push(code);
    localStorage.setItem(CLAIMED_CODES_KEY, JSON.stringify(claimed));
  } catch (error) {
    console.error("Failed to save claimed code:", error);
  }
};

export default function CoinGrabPage() {
  const navigate = useNavigate();
  const { addCoins } = useCoinBalance();
  const [hasScanned, setHasScanned] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const lastProcessedCode = useRef<string>("");

  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 1,
  });

  const processQRCode = useCallback(
    (scannedData: string) => {
      const upperCode = scannedData.trim().toUpperCase();

      // Prevent reprocessing the same code
      if (upperCode === lastProcessedCode.current) {
        return;
      }

      lastProcessedCode.current = upperCode;
      const claimedCodes = getClaimedCodes();

      // Check if code is valid
      if (!(upperCode in VALID_CODES)) {
        toast.error("Invalid QR code");
        stopScanning();
        setHasScanned(true);
        return;
      }

      // Check if already claimed
      if (claimedCodes.includes(upperCode)) {
        toast.error("Code already claimed.");
        stopScanning();
        setHasScanned(true);
        return;
      }

      // Valid and new code - award coins
      const coinAmount = VALID_CODES[upperCode];
      addCoins(coinAmount);
      addClaimedCode(upperCode);

      setSuccessMessage(`+${coinAmount} Coins Earned!`);
      setShowSuccess(true);
      stopScanning();
      setHasScanned(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    },
    [addCoins, stopScanning],
  );

  // Process new QR results
  useEffect(() => {
    if (qrResults.length > 0 && isScanning) {
      const latestResult = qrResults[0];
      processQRCode(latestResult.data);
      clearResults();
    }
  }, [qrResults, isScanning, processQRCode, clearResults]);

  const handleStartScanning = async () => {
    lastProcessedCode.current = "";
    setHasScanned(false);
    setShowSuccess(false);
    const success = await startScanning();
    if (!success) {
      toast.error("Failed to start camera");
    }
  };

  const handleScanAgain = async () => {
    lastProcessedCode.current = "";
    setHasScanned(false);
    setShowSuccess(false);
    const success = await startScanning();
    if (!success) {
      toast.error("Failed to restart camera");
    }
  };

  // Camera not supported
  if (isSupported === false) {
    return (
      <main
        style={{
          marginTop: "56px",
          padding: "16px",
          minHeight: "calc(100vh - 56px)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate({ to: "/coins" })}
            className="p-2 hover:opacity-70 transition-opacity"
            aria-label="Back to Coins"
          >
            <ArrowLeft className="w-6 h-6" style={{ color: "#D4AF37" }} />
          </button>
          <h2 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
            CoinGrab Scanner
          </h2>
        </div>
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              backgroundColor: "#141418",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <AlertCircle
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "#D4AF37" }}
              />
              <p style={{ color: "rgba(255,255,255,0.7)" }}>
                Camera not supported on this device.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        marginTop: "56px",
        padding: "16px",
        minHeight: "calc(100vh - 56px)",
        paddingBottom: "80px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/coins" })}
          className="p-2 hover:opacity-70 transition-opacity"
          aria-label="Back to Coins"
        >
          <ArrowLeft className="w-6 h-6" style={{ color: "#D4AF37" }} />
        </button>
        <h2 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
          CoinGrab Scanner
        </h2>
      </div>

      {/* Permission Explanation Card - Show when camera is not active */}
      {!isActive && !error && (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              backgroundColor: "#2A070B",
              borderColor: "rgba(212,175,55,0.3)",
            }}
          >
            <CardContent className="pt-8 pb-8 px-6">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div
                  className="p-6 rounded-full"
                  style={{
                    backgroundColor: "rgba(212,175,55,0.15)",
                    border: "2px solid rgba(212,175,55,0.4)",
                  }}
                >
                  <Camera className="w-12 h-12" style={{ color: "#D4AF37" }} />
                </div>
              </div>

              {/* Title */}
              <h3
                className="text-xl font-bold text-center mb-3"
                style={{ color: "#FFFFFF" }}
              >
                Camera Access Required
              </h3>

              {/* Description */}
              <p
                className="text-center mb-6"
                style={{ color: "rgba(255,255,255,0.8)", lineHeight: "1.6" }}
              >
                Sport Buddies uses your camera only to scan official QR codes
                for coin rewards.
              </p>

              {/* Enable Camera Button */}
              <Button
                onClick={handleStartScanning}
                disabled={!canStartScanning || isLoading}
                className="w-full"
                style={{
                  backgroundColor:
                    !canStartScanning || isLoading
                      ? "rgba(212,175,55,0.3)"
                      : "#D4AF37",
                  color: "#0B0B0D",
                  fontWeight: "bold",
                  padding: "12px",
                }}
              >
                {isLoading ? "Starting Camera..." : "Enable Camera"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Permission Denied Message */}
      {error && error.type === "permission" && (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              backgroundColor: "#2A070B",
              borderColor: "rgba(212,175,55,0.3)",
            }}
          >
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <AlertCircle
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "#D4AF37" }}
              />
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: "#FFFFFF" }}
              >
                Camera Permission Denied
              </h3>
              <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: "1.6" }}>
                Camera permission denied. Enable it in settings to use CoinGrab.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Other Camera Errors */}
      {error && error.type !== "permission" && (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: "calc(100vh - 200px)" }}
        >
          <Card
            className="w-full max-w-md"
            style={{
              backgroundColor: "#2A070B",
              borderColor: "rgba(212,175,55,0.3)",
            }}
          >
            <CardContent className="pt-8 pb-8 px-6 text-center">
              <AlertCircle
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "#D4AF37" }}
              />
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: "#FFFFFF" }}
              >
                Camera Error
              </h3>
              <p className="mb-4" style={{ color: "rgba(255,255,255,0.7)" }}>
                {error.message}
              </p>
              <Button
                onClick={handleStartScanning}
                disabled={isLoading}
                className="w-full"
                style={{
                  backgroundColor: isLoading
                    ? "rgba(212,175,55,0.3)"
                    : "#D4AF37",
                  color: "#0B0B0D",
                  fontWeight: "bold",
                }}
              >
                {isLoading ? "Retrying..." : "Try Again"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QR Scanner - Show when camera is active */}
      {isActive && (
        <div className="space-y-4">
          {/* Scanner Panel */}
          <Card
            className="w-full max-w-2xl mx-auto overflow-hidden"
            style={{
              backgroundColor: "#2A070B",
              borderColor: "#D4AF37",
              borderWidth: "2px",
            }}
          >
            <CardContent className="p-0">
              <div
                className="relative w-full"
                style={{
                  aspectRatio: "4/3",
                  backgroundColor: "#000000",
                }}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{ display: "block" }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Scanning Indicator */}
                {isScanning && !hasScanned && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
                  >
                    <div
                      className="text-center px-6 py-3 rounded-lg"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.9)",
                        color: "#0B0B0D",
                      }}
                    >
                      <p className="font-bold">Scanning for QR codes...</p>
                    </div>
                  </div>
                )}

                {/* Success Animation */}
                {showSuccess && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                  >
                    <div
                      className="text-center px-8 py-6 rounded-lg animate-pulse"
                      style={{
                        backgroundColor: "rgba(212,175,55,0.95)",
                        color: "#0B0B0D",
                      }}
                    >
                      <p className="text-2xl font-bold">{successMessage}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scan Again Button */}
          {hasScanned && (
            <div className="flex justify-center">
              <Button
                onClick={handleScanAgain}
                disabled={isLoading}
                className="px-8"
                style={{
                  backgroundColor: isLoading
                    ? "rgba(212,175,55,0.3)"
                    : "#D4AF37",
                  color: "#0B0B0D",
                  fontWeight: "bold",
                }}
              >
                {isLoading ? "Starting..." : "Scan Again"}
              </Button>
            </div>
          )}

          {/* Instructions */}
          <Card
            className="w-full max-w-2xl mx-auto"
            style={{
              backgroundColor: "#141418",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <CardContent className="pt-4 pb-4 px-6">
              <p
                className="text-sm text-center"
                style={{ color: "rgba(255,255,255,0.7)" }}
              >
                Point your camera at a Sport Buddies QR code to scan and earn
                coins.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
