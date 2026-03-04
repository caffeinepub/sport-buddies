import { toast } from "sonner";

// Whitelist of known valid route prefixes
const VALID_ROUTE_PREFIXES = [
  "/",
  "/map",
  "/events",
  "/coins",
  "/profile",
  "/activate",
  "/helicopter",
  "/coin-grab",
  "/scan",
  "/scanner",
  "/scanner-stub",
  "/emergency",
  "/emergency-shield",
  "/sos",
  "/sos-log",
  "/invite",
  "/store",
  "/how-it-works",
  "/marketplace",
  "/safety",
  "/auth",
  "/profile-setup",
  "/create-event",
  "/session",
  "/presence-detail",
  "/redemption",
];

export function safeNavigate(
  targetPath: string,
  navigate: (opts: { to: string }) => void,
): void {
  const isValid = VALID_ROUTE_PREFIXES.some((prefix) => {
    if (prefix === "/") return targetPath === "/";
    return (
      targetPath === prefix ||
      targetPath.startsWith(`${prefix}/`) ||
      targetPath.startsWith(`${prefix}?`)
    );
  });

  if (isValid) {
    navigate({ to: targetPath });
  } else {
    toast.info("Coming soon (MVP).");
  }
}
