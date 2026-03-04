import { useCallback, useEffect, useState } from "react";

type PermissionState = "granted" | "denied" | "prompt" | "unsupported";

export function useLocationPermission() {
  const [permissionState, setPermissionState] =
    useState<PermissionState>("prompt");
  const [isChecking, setIsChecking] = useState(false);

  // Check current permission state
  const checkPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      return "unsupported";
    }

    try {
      // Try to use the Permissions API if available
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({
          name: "geolocation",
        });
        setPermissionState(result.state as PermissionState);
        return result.state as PermissionState;
      }
    } catch (_error) {
      // Permissions API not supported, we'll check via getCurrentPosition
    }

    // Fallback: assume prompt state
    setPermissionState("prompt");
    return "prompt";
  }, []);

  // Request location permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setPermissionState("unsupported");
      return false;
    }

    setIsChecking(true);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionState("granted");
          setIsChecking(false);
          resolve(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionState("denied");
          } else {
            setPermissionState("prompt");
          }
          setIsChecking(false);
          resolve(false);
        },
        { timeout: 10000 },
      );
    });
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permissionState,
    isChecking,
    requestPermission,
    checkPermission,
  };
}
