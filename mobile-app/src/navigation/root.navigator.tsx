import { NAVIGATION } from "@/constants";
import { CommonActions, StackActions } from "@react-navigation/native";
import * as React from "react";

export const isMountedRef: any = React.createRef();
export const navigationRef: any = React.createRef();
const routeChangeListeners = new Set<(routeName: string) => void>();

export function navigate(name: string, params: any) {
  if (isMountedRef.current != null && navigationRef.current != null) {
    navigationRef.current.navigate(name, params);
  }
}

export function navigateBack() {
  if (isMountedRef.current != null && navigationRef.current != null) {
    navigationRef.current.goBack();
  }
}

export async function getCurrentRoute(): Promise<NAVIGATION> {
  if (isMountedRef.current && navigationRef.current) {
    return (await navigationRef.current?.getCurrentRoute()?.name) as NAVIGATION;
  } else {
    return NAVIGATION.TabNavigator;
  }
}

export function getCurrentScreenName(): string {
  if (isMountedRef.current && navigationRef.current) {
    const currentRoute = navigationRef.current.getCurrentRoute();
    return currentRoute?.name || "";
  }
  return "";
}

export function subscribeToRouteChanges(listener: (routeName: string) => void) {
  routeChangeListeners.add(listener);
  return () => {
    routeChangeListeners.delete(listener);
  };
}

export function notifyRouteChanged(routeName: string) {
  routeChangeListeners.forEach((listener) => {
    try {
      listener(routeName);
    } catch {
      // Keep route-change fanout resilient to one bad listener.
    }
  });
}

export function resetBackToMain() {
  if (isMountedRef.current && navigationRef.current) {
    navigationRef.current.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: NAVIGATION.TabNavigator }],
      }),
    );
  }
}

export const navigationReplace = (route: string, params?: object) => {
  if (isMountedRef.current && navigationRef.current) {
    navigationRef.current.dispatch(StackActions.replace(route, params));
  }
};
