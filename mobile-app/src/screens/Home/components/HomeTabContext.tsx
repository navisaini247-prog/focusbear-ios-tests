import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

type HomeTabContextValue = {
  currentTabIndex: number;
  isHabitsTabFocused: boolean;
  setCurrentTabIndex: (index: number) => void;
};

const HomeTabContext = createContext<HomeTabContextValue | null>(null);

type HomeTabProviderProps = {
  children: ReactNode;
  habitTabIndex: number;
};

export function HomeTabProvider({ children, habitTabIndex }: HomeTabProviderProps) {
  const [currentTabIndex, setCurrentTabIndexState] = useState(0);

  const setCurrentTabIndex = useCallback((index: number) => {
    setCurrentTabIndexState(index);
  }, []);

  const value = useMemo<HomeTabContextValue>(
    () => ({
      currentTabIndex,
      isHabitsTabFocused: currentTabIndex === habitTabIndex,
      setCurrentTabIndex,
    }),
    [currentTabIndex, habitTabIndex, setCurrentTabIndex],
  );

  return <HomeTabContext.Provider value={value}>{children}</HomeTabContext.Provider>;
}

export function useHomeTab(): HomeTabContextValue {
  const ctx = useContext(HomeTabContext);
  if (!ctx) {
    return {
      currentTabIndex: 0,
      isHabitsTabFocused: false,
      setCurrentTabIndex: () => {},
    };
  }
  return ctx;
}

export function useIsHabitsTabFocused(): boolean {
  return useHomeTab().isHabitsTabFocused;
}
