import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import { useImperativeHandle, useRef, useEffect } from "react";
import { View } from "react-native";

interface NavState {
  stack: string[];
  params: Record<string, any>;
}

interface NavExtraProps {
  currentScreen: string | null;
  isFirstRender: boolean;
  canGoBack: boolean;
}

interface NavMethods {
  navigate: (screenName: string, params?: Record<string, any>) => void;
  goBack: (params?: Record<string, any>) => void;
  reset: () => void;
}

interface MiniNavProps {
  onNavigate?: (screenName: string) => void;
  initialScreen?: string;
  children: Iterable<ReactNode>;
  ref?: React.Ref<NavMethods>;
}

const MiniNavContext = createContext<{ miniNav: NavState & NavExtraProps & NavMethods } | null>(null);

const MiniNavComponent = ({ children, onNavigate, initialScreen, ref }: MiniNavProps) => {
  const isFirstRender = useRef<boolean>(true);
  const [state, setState] = useState<NavState>({ stack: initialScreen ? [initialScreen] : [], params: {} });

  const extraProps: NavExtraProps = useMemo(() => {
    return {
      currentScreen: state.stack[state.stack.length - 1] || initialScreen,
      isFirstRender: isFirstRender.current,
      canGoBack: state.stack.length > 1,
    };
  }, [state, initialScreen]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const navigate = useCallback(
    (screenName: string, params: Record<string, any> = {}) => {
      setState((prevState) => {
        const stack = [...prevState.stack, screenName];
        const newState = { ...prevState, stack, params };
        onNavigate?.(screenName);
        return newState;
      });
    },
    [onNavigate],
  );

  const goBack = useCallback(
    (params: Record<string, any> = {}) => {
      setState((prevState) => {
        const stack = [...prevState.stack];
        stack.length > 1 && stack.pop();
        const newState = { ...prevState, isGoingBack: true, stack, params };
        onNavigate?.(stack[stack.length - 1]);
        return newState;
      });
    },
    [onNavigate],
  );

  const reset = useCallback(() => {
    setState({ stack: initialScreen ? [initialScreen] : [], params: {} });
  }, [initialScreen]);

  useImperativeHandle(ref, () => ({ navigate, goBack, reset }));

  const value = useMemo(
    () => ({ miniNav: { navigate, goBack, reset, ...state, ...extraProps } }),
    [navigate, goBack, reset, state, extraProps],
  );

  return (
    <MiniNavContext.Provider value={value}>
      <View>{children}</View>
    </MiniNavContext.Provider>
  );
};

export const MiniNav = MiniNavComponent as typeof MiniNavComponent & { Screen: typeof Screen };

export const useMiniNav = () => {
  const context = useContext(MiniNavContext);
  if (!context) {
    throw new Error("useMiniNav must be used within a MiniNav provider");
  }
  return context;
};

interface ScreenProps {
  name: string;
  component: () => ReactNode;
  prevScreen?: string;
}

const Screen = ({ name: screenName, component: Component }: ScreenProps) => {
  const { miniNav } = useMiniNav();
  const isCurrent = miniNav.currentScreen === screenName;

  return isCurrent && <Component />;
};

MiniNav.Screen = Screen;
