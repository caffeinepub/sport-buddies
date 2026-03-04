import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "sport_activation";
const ACTIVATION_DURATION = 10000; // 10 seconds in milliseconds

interface ActivationData {
  status: "OUT_NOW";
  expiry: number;
}

export function useActivationStatus() {
  const [status, setStatus] = useState<"INACTIVE" | "OUT_NOW">("INACTIVE");
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Initialize from localStorage and check expiry
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data: ActivationData = JSON.parse(stored);
        const now = Date.now();

        if (data.expiry > now) {
          // Resume countdown
          setStatus("OUT_NOW");
          setRemainingSeconds(Math.ceil((data.expiry - now) / 1000));
        } else {
          // Expired, clear it
          localStorage.removeItem(STORAGE_KEY);
          setStatus("INACTIVE");
        }
      } catch (_e) {
        // Invalid data, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Monitor expiry and update countdown
  useEffect(() => {
    if (status !== "OUT_NOW") return;

    const interval = setInterval(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setStatus("INACTIVE");
        setRemainingSeconds(0);
        return;
      }

      try {
        const data: ActivationData = JSON.parse(stored);
        const now = Date.now();
        const remaining = Math.ceil((data.expiry - now) / 1000);

        if (remaining <= 0) {
          // Countdown complete
          localStorage.removeItem(STORAGE_KEY);
          setStatus("INACTIVE");
          setRemainingSeconds(0);
          clearInterval(interval);
        } else {
          setRemainingSeconds(remaining);
        }
      } catch (_e) {
        localStorage.removeItem(STORAGE_KEY);
        setStatus("INACTIVE");
        setRemainingSeconds(0);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const activate = useCallback(() => {
    if (status === "OUT_NOW") return; // Already active

    const expiry = Date.now() + ACTIVATION_DURATION;
    const data: ActivationData = {
      status: "OUT_NOW",
      expiry,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setStatus("OUT_NOW");
    setRemainingSeconds(10);
  }, [status]);

  return {
    status,
    remainingSeconds,
    activate,
    isActive: status === "OUT_NOW",
  };
}
