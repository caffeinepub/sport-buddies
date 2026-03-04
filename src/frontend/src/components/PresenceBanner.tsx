import { useEffect, useState } from "react";

interface PresenceBannerProps {
  sport: string;
  pocketFlashUntil: number;
}

export function PresenceBanner({
  sport,
  pocketFlashUntil,
}: PresenceBannerProps) {
  const [isFlashing, setIsFlashing] = useState(true);

  useEffect(() => {
    const checkFlash = () => {
      const now = Date.now();
      if (now >= pocketFlashUntil) {
        setIsFlashing(false);
      }
    };

    // Check immediately
    checkFlash();

    // Check every second
    const interval = setInterval(checkFlash, 1000);

    return () => clearInterval(interval);
  }, [pocketFlashUntil]);

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-primary text-primary-foreground px-4 py-3 shadow-lg">
      <div className="flex items-center justify-center gap-3 max-w-2xl mx-auto">
        {isFlashing && (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
          </span>
        )}
        <span className="font-bold text-sm sm:text-base">
          LIVE: {sport} — Out Now
        </span>
      </div>
    </div>
  );
}
