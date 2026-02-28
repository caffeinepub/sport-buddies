import React, { createContext, useContext, useState } from "react";

export type SportStatus = "inactive" | "active";
export type UserMode = "Out Now" | "On My Way" | "Planned";

export type SportContextType = {
  sportStatus: SportStatus;
  currentSport: string | null;
  userMode: UserMode;
  locationEnabled: boolean;
  activateSport: (sport: string) => void;
  deactivateSport: () => void;
  setUserMode: (mode: UserMode) => void;
  toggleLocation: () => void;
};

const SportContext = createContext<SportContextType | undefined>(undefined);

export const SportProvider = ({ children }: { children: React.ReactNode }) => {
  const [sportStatus, setSportStatus] = useState<SportStatus>("inactive");
  const [currentSport, setCurrentSport] = useState<string | null>(null);
  const [userMode, setUserModeState] = useState<UserMode>("Planned");
  const [locationEnabled, setLocationEnabled] = useState<boolean>(false);

  const activateSport = (sport: string) => {
    setCurrentSport(sport);
    setSportStatus("active");
    setUserModeState("Out Now");
  };

  const deactivateSport = () => {
    setCurrentSport(null);
    setSportStatus("inactive");
    setUserModeState("Planned");
  };

  const setUserMode = (mode: UserMode) => {
    setUserModeState(mode);
  };

  const toggleLocation = () => {
    setLocationEnabled((prev) => !prev);
  };

  return (
    <SportContext.Provider
      value={{
        sportStatus,
        currentSport,
        userMode,
        locationEnabled,
        activateSport,
        deactivateSport,
        setUserMode,
        toggleLocation,
      }}
    >
      {children}
    </SportContext.Provider>
  );
};

export const useSport = (): SportContextType => {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error("useSport must be used inside SportProvider");
  }
  return context;
};
