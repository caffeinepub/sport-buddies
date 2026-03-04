import { useEffect, useState } from "react";
import { useQRScanner } from "../qr-code/useQRScanner";
import { useCoinBalance } from "./useCoinBalance";

const CLAIMED_CODES_KEY = "claimedCodes";

const VALID_CODES: Record<string, number> = {
  "HELI-50": 50,
  "FERRARI-50": 50,
  "SWAG-20": 20,
};

type ValidationResult = "valid" | "invalid" | "already claimed";

interface ScanResult {
  code: string;
  result: ValidationResult;
  coinsEarned: number;
}

export function useCoinScanner() {
  const qrScanner = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 5,
  });

  const { addCoins } = useCoinBalance();
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [claimedCodes, setClaimedCodes] = useState<string[]>(() => {
    const stored = localStorage.getItem(CLAIMED_CODES_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  // Process new QR results
  useEffect(() => {
    if (qrScanner.qrResults.length > 0) {
      const latestResult = qrScanner.qrResults[0];
      const code = latestResult.data;

      // Check if this is a new scan (different from last processed)
      if (!lastScan || lastScan.code !== code) {
        processCode(code);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrScanner.qrResults, lastScan, lastScan?.code]);

  const processCode = (code: string) => {
    // Check if code is valid
    const coinValue = VALID_CODES[code];

    if (coinValue === undefined) {
      // Invalid code
      setLastScan({
        code,
        result: "invalid",
        coinsEarned: 0,
      });
      return;
    }

    // Check if already claimed
    if (claimedCodes.includes(code)) {
      setLastScan({
        code,
        result: "already claimed",
        coinsEarned: 0,
      });
      return;
    }

    // Valid and unclaimed - award coins
    const newClaimedCodes = [...claimedCodes, code];
    setClaimedCodes(newClaimedCodes);
    localStorage.setItem(CLAIMED_CODES_KEY, JSON.stringify(newClaimedCodes));

    addCoins(coinValue);

    setLastScan({
      code,
      result: "valid",
      coinsEarned: coinValue,
    });
  };

  const getCameraPermissionStatus = (): "unknown" | "granted" | "denied" => {
    if (qrScanner.error?.type === "permission") {
      return "denied";
    }
    if (qrScanner.isActive) {
      return "granted";
    }
    return "unknown";
  };

  return {
    ...qrScanner,
    lastScan,
    cameraPermissionStatus: getCameraPermissionStatus(),
  };
}
