/* eslint-disable react-hooks/rules-of-hooks */
import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@react-navigation/native";
import { styles as customStyles } from "./AppMenuOverlay.styles";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useAppActiveState } from "@/hooks/use-app-active-state";
import DeviceInfo from "react-native-device-info";
import { logSentryError, postHogCapture } from "@/utils/Posthog";
import { addInfoLog } from "@/utils/FileLogger";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

import { LauncherKit } from "@/nativeModule";

const Context = createContext({});

const LauncherContextProvider = ({ children }) => {
  if (checkIsIOS()) {
    return children;
  }

  const [allInstalledApps, setAllInstalledApps] = useState([]);
  const [searchApp, setSearchApp] = useState("");
  const [openAppMenu, setOpenAppMenu] = useState(false);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [deviceApplicationInfo, setDeviceApplicationInfo] = useState();
  const [defaultLauncherName, setDefaultLauncherName] = useState("");
  const [openSetAppLabel, setOpenSetAppLabel] = useState(false);
  const [selectedLabellingApp, setSelectedLabellingApp] = useState({
    packageName: "",
    appName: "",
  });

  const { colors } = useTheme();

  const styles = useMemo(() => customStyles(colors), [colors]);

  const getDefaultLauncherPackageName = async () => {
    try {
      const name = await LauncherKit.getDefaultLauncherPackageName();

      addInfoLog(`getDefaultLauncherPackageName: ${name}`);

      setDefaultLauncherName(name);
    } catch (error) {
      logSentryError("Error in fetching default launcher package name", error);
    }
  };

  useEffect(() => {
    getDefaultLauncherPackageName();
  }, []);

  useAppActiveState(() => {
    getDefaultLauncherPackageName();
  }, true);

  const fetchApps = useCallback(async () => {
    let unparsedApps = "";
    setIsLoadingApps(true);

    try {
      addInfoLog("Starting to fetch installed apps using enhanced method");

      // Use enhanced method with version info and accent colors
      const enhancedAppsString = await LauncherKit.getAppsEnhanced(true, true);

      unparsedApps = enhancedAppsString;

      if (!enhancedAppsString) {
        addInfoLog("LauncherKit.getAppsEnhanced() returned null/undefined");
        logSentryError("LauncherKit.getAppsEnhanced() returned null/undefined");
        return;
      }

      const parsedApps = JSON.parse(enhancedAppsString);
      addInfoLog(`Successfully parsed ${parsedApps.length} enhanced apps with file-based icons`);
      setAllInstalledApps(parsedApps);

      // Still get device info from constants for backward compatibility
      try {
        const launcherConstants = await LauncherKit.getConstants();
        if (launcherConstants) {
          setDeviceApplicationInfo(launcherConstants);
        }
      } catch (constantsError) {
        addInfoLog(`Error getting device constants: ${constantsError.message}`);
        // Continue anyway as we have the apps data
      }
    } catch (error) {
      addInfoLog(`Error in fetching enhanced apps: ${error.message}`, unparsedApps);
      logSentryError("Error in fetching enhanced apps", error);

      // Fallback to old method if enhanced fails
      try {
        addInfoLog("Falling back to legacy app fetching method");
        const launcherConstants = await LauncherKit.getConstants();
        if (launcherConstants && launcherConstants.allApps) {
          const parsedApps = JSON.parse(launcherConstants.allApps);
          addInfoLog(`Fallback: Successfully parsed ${parsedApps.length} apps`);
          setAllInstalledApps(parsedApps);
          setDeviceApplicationInfo(launcherConstants);
        }
      } catch (fallbackError) {
        addInfoLog(`Fallback method also failed: ${fallbackError.message}`);
        logSentryError("Both enhanced and fallback app fetching failed", fallbackError);
      }
    } finally {
      setIsLoadingApps(false);
    }
  }, []);

  const isFocusBearDefaultLauncher = useMemo(() => {
    const isDefaultLauncher = defaultLauncherName === DeviceInfo.getBundleId();

    addInfoLog(`isDefaultLauncher: ${DeviceInfo.getBundleId()} ${defaultLauncherName}`);

    if (isDefaultLauncher) {
      addInfoLog(`FocusBear is default Launcher :-${isDefaultLauncher}`);
      postHogCapture(POSTHOG_EVENT_NAMES.LAUNCHER_PERMISSION_GRANTED);
    }
    return isDefaultLauncher;
  }, [defaultLauncherName]);

  useEffect(() => {
    if (isFocusBearDefaultLauncher) {
      addInfoLog("FocusBear is default launcher, fetching installed apps");
      fetchApps();

      // Start listening for app installations and removals
      LauncherKit.startListeningForAppInstallations();
      LauncherKit.startListeningForAppRemovals();

      addInfoLog("Started listening for app installations and removals");
    } else {
      addInfoLog("FocusBear is not default launcher, skipping app fetch");

      // Stop listening if not default launcher
      try {
        LauncherKit.stopListeningForAppInstallations();
        LauncherKit.stopListeningForAppRemovals();
        addInfoLog("Stopped listening for app installations and removals");
      } catch (error) {
        // Ignore errors when stopping listeners
      }
    }

    // Cleanup function
    return () => {
      if (isFocusBearDefaultLauncher) {
        try {
          LauncherKit.stopListeningForAppInstallations();
          LauncherKit.stopListeningForAppRemovals();
          addInfoLog("Cleanup: Stopped listening for app changes");
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [fetchApps, isFocusBearDefaultLauncher]);

  const installedApps = useMemo(() => {
    return allInstalledApps.filter((app) => {
      // Handle both enhanced format (label) and legacy format (appName)
      const appName = app?.label || app?.appName || "";
      return appName.toLowerCase().includes(searchApp?.toLowerCase() || "");
    });
  }, [allInstalledApps, searchApp]);

  const launchApplication = useCallback((packageName) => {
    LauncherKit.launchApplication(packageName);
  }, []);

  const setAsDefaultLauncher = useCallback(() => {
    LauncherKit.setAsDefaultLauncher();
  }, []);

  // Handle newly installed app
  const handleAppInstalled = useCallback((appDataString) => {
    try {
      const newApp = JSON.parse(appDataString);
      // Handle both enhanced format (label) and legacy format (appName)
      const appName = newApp.label || newApp.appName;
      const packageName = newApp.packageName;

      addInfoLog(`New app installed: ${appName} (${packageName})`);

      setAllInstalledApps((prevApps) => {
        // Check if app already exists to avoid duplicates
        const exists = prevApps.some((app) => app.packageName === newApp.packageName);
        if (!exists) {
          const updatedApps = [...prevApps, newApp];
          addInfoLog(`Added new app to list. Total apps: ${updatedApps.length}`);
          return updatedApps;
        }
        return prevApps;
      });
    } catch (error) {
      addInfoLog(`Error parsing installed app data: ${error.message}`);
      logSentryError("Error handling installed app", error);
    }
  }, []);

  // Handle app removal
  const handleAppRemoved = useCallback((packageName) => {
    addInfoLog(`App removed: ${packageName}`);

    setAllInstalledApps((prevApps) => {
      const updatedApps = prevApps.filter((app) => app.packageName !== packageName);
      addInfoLog(`Removed app from list. Total apps: ${updatedApps.length}`);
      return updatedApps;
    });
  }, []);

  const context = useMemo(
    () => ({
      installedApps,
      setSearchApp,
      searchApp,
      openAppMenu,
      setOpenAppMenu,
      launchApplication,
      styles,
      setAsDefaultLauncher,
      deviceApplicationInfo,
      isFocusBearDefaultLauncher,
      openSetAppLabel,
      setOpenSetAppLabel,
      selectedLabellingApp,
      setSelectedLabellingApp,
      fetchApps,
      handleAppInstalled,
      handleAppRemoved,
      isLoadingApps,
    }),
    [
      installedApps,
      setSearchApp,
      searchApp,
      openAppMenu,
      setOpenAppMenu,
      launchApplication,
      styles,
      setAsDefaultLauncher,
      deviceApplicationInfo,
      isFocusBearDefaultLauncher,
      openSetAppLabel,
      setOpenSetAppLabel,
      selectedLabellingApp,
      setSelectedLabellingApp,
      fetchApps,
      handleAppInstalled,
      handleAppRemoved,
      isLoadingApps,
    ],
  );

  return <Context.Provider value={context}>{children}</Context.Provider>;
};

const useLauncherContext = () => React.useContext(Context);

// PropTypes
LauncherContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { LauncherContextProvider, useLauncherContext };
