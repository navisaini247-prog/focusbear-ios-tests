// Mock Platform and Dimensions at the very top - before any imports
jest.mock("react-native/Libraries/Utilities/Platform", () => ({
  OS: "android",
  select: jest.fn((obj) => obj.android || obj.default),
}));

// Mock Platform for direct react-native import
jest.mock("react-native", () => {
  return {
    Platform: {
      OS: "android",
      select: jest.fn((obj) => obj.android || obj.default),
    },
    Dimensions: {
      get: jest.fn(() => ({
        width: 375,
        height: 812,
      })),
    },
    NativeModules: {
      Window: {
        getConstants: jest.fn(() => ({})),
      },
      OverlayPermissionModule: {
        requestOverlayPermission: jest.fn(),
        canDrawOverlays: jest.fn(),
      },
    },
    TurboModuleRegistry: {
      getEnforcing: jest.fn((moduleName) => {
        if (moduleName === "OverlayModule") {
          return {
            getPhoneID: jest.fn().mockResolvedValue("test-phone-id"),
            showDistractionWindow: jest.fn(),
            saveActivitySpecificAllowedApps: jest.fn(),
            startService: jest.fn(),
            stopOverlayService: jest.fn().mockResolvedValue(),
            storeUpcomingRoutineMessage: jest.fn().mockResolvedValue(),
            saveAllowedAppsPreference: jest.fn().mockResolvedValue(),
            saveBlockedAppsPreference: jest.fn().mockResolvedValue(),
            getApps: jest.fn().mockResolvedValue([]),
            saveInstalledApps: jest.fn(),
            openOverlayPermission: jest.fn(),
            saveRestrictedAppsListType: jest.fn(),
            requestNotificationPolicyDNDPermission: jest.fn(),
            isNotificationPolicyDNDPermissionEnabled: jest.fn().mockResolvedValue(false),
            shouldEnableDNDMode: jest.fn(),
            goBackToDeviceHome: jest.fn(),

            onOverlayEvent: {
              addListener: jest.fn(),
              removeListener: jest.fn(),
            },
          };
        }
        return {};
      }),
      get: jest.fn((moduleName) => {
        if (moduleName === "OverlayModule") {
          return {
            getPhoneID: jest.fn().mockResolvedValue("test-phone-id"),
            showDistractionWindow: jest.fn(),
            saveActivitySpecificAllowedApps: jest.fn(),
            startService: jest.fn(),
            stopOverlayService: jest.fn().mockResolvedValue(),
            storeUpcomingRoutineMessage: jest.fn().mockResolvedValue(),
            saveAllowedAppsPreference: jest.fn().mockResolvedValue(),
            saveBlockedAppsPreference: jest.fn().mockResolvedValue(),
            getApps: jest.fn().mockResolvedValue([]),
            saveInstalledApps: jest.fn(),
            openOverlayPermission: jest.fn(),
            saveRestrictedAppsListType: jest.fn(),
            requestNotificationPolicyDNDPermission: jest.fn(),
            isNotificationPolicyDNDPermissionEnabled: jest.fn().mockResolvedValue(false),
            shouldEnableDNDMode: jest.fn(),
            goBackToDeviceHome: jest.fn(),

            onOverlayEvent: {
              addListener: jest.fn(),
              removeListener: jest.fn(),
            },
          };
        }
        return {};
      }),
    },
  };
});

// Now do imports after mocks are set up
import mockRNDeviceInfo from "react-native-device-info/jest/react-native-device-info-mock";

// Mock TurboModuleRegistry
jest.mock("react-native/Libraries/TurboModule/TurboModuleRegistry", () => ({
  getEnforcing: jest.fn((moduleName) => {
    if (moduleName === "OverlayModule") {
      return {
        getPhoneID: jest.fn().mockResolvedValue("test-phone-id"),
        showDistractionWindow: jest.fn(),
        saveActivitySpecificAllowedApps: jest.fn(),
        startService: jest.fn(),
        stopOverlayService: jest.fn().mockResolvedValue(),
        storeUpcomingRoutineMessage: jest.fn().mockResolvedValue(),
        saveAllowedAppsPreference: jest.fn().mockResolvedValue(),
        saveBlockedAppsPreference: jest.fn().mockResolvedValue(),
        getApps: jest.fn().mockResolvedValue([]),
        saveInstalledApps: jest.fn(),
        openOverlayPermission: jest.fn(),
        saveRestrictedAppsListType: jest.fn(),
        requestNotificationPolicyDNDPermission: jest.fn(),
        isNotificationPolicyDNDPermissionEnabled: jest.fn().mockResolvedValue(false),
        shouldEnableDNDMode: jest.fn(),
        goBackToDeviceHome: jest.fn(),
        getAppsIcon: jest.fn().mockResolvedValue({}),
        onOverlayEvent: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      };
    }
    return {};
  }),
  get: jest.fn((moduleName) => {
    if (moduleName === "OverlayModule") {
      return {
        getPhoneID: jest.fn().mockResolvedValue("test-phone-id"),
        showDistractionWindow: jest.fn(),
        saveActivitySpecificAllowedApps: jest.fn(),
        startService: jest.fn(),
        stopOverlayService: jest.fn().mockResolvedValue(),
        storeUpcomingRoutineMessage: jest.fn().mockResolvedValue(),
        saveAllowedAppsPreference: jest.fn().mockResolvedValue(),
        saveBlockedAppsPreference: jest.fn().mockResolvedValue(),
        getApps: jest.fn().mockResolvedValue([]),
        saveInstalledApps: jest.fn(),
        openOverlayPermission: jest.fn(),
        saveRestrictedAppsListType: jest.fn(),
        requestNotificationPolicyDNDPermission: jest.fn(),
        isNotificationPolicyDNDPermissionEnabled: jest.fn().mockResolvedValue(false),
        shouldEnableDNDMode: jest.fn(),
        goBackToDeviceHome: jest.fn(),
        getAppsIcon: jest.fn().mockResolvedValue({}),
        onOverlayEvent: {
          addListener: jest.fn(),
          removeListener: jest.fn(),
        },
      };
    }
    return {};
  }),
}));

// Mock react-native-zip-archive
jest.mock("react-native-zip-archive", () => ({
  zip: jest.fn(),
  unzip: jest.fn(),
  unzipAssets: jest.fn(),
  subscribe: jest.fn(),
}));

jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock("@react-native-firebase/messaging", () => ({
  AuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
  },
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn().mockResolvedValue("test-fcm-token"),
  hasPermission: jest.fn().mockResolvedValue(2),
  isDeviceRegisteredForRemoteMessages: jest.fn(() => true),
  onTokenRefresh: jest.fn(() => jest.fn()),
  registerDeviceForRemoteMessages: jest.fn().mockResolvedValue(),
  setBackgroundMessageHandler: jest.fn(),
  onMessage: jest.fn(() => jest.fn()),
}));

jest.mock("@/store", () => {
  const actualStore = require("@/__mocks__/store");
  return actualStore;
});

jest.mock("react-native-bootsplash", () => ({
  hide: jest.fn().mockResolvedValueOnce(),
  show: jest.fn().mockResolvedValueOnce(),
  getVisibilityStatus: jest.fn().mockResolvedValue("hidden"),
}));

jest.mock("react-native-config", () => ({
  Config: {
    API_BASE_URL: "XXX",
    BUILD_VARIANT: "TEST",
  },
}));

jest.mock("react-native-fs", () => {
  return {
    mkdir: jest.fn(),
    moveFile: jest.fn(),
    copyFile: jest.fn(),
    pathForBundle: jest.fn(),
    pathForGroup: jest.fn(),
    getFSInfo: jest.fn(),
    getAllExternalFilesDirs: jest.fn(),
    unlink: jest.fn(),
    exists: jest.fn(),
    stopDownload: jest.fn(),
    resumeDownload: jest.fn(),
    isResumable: jest.fn(),
    stopUpload: jest.fn(),
    completeHandlerIOS: jest.fn(),
    readDir: jest.fn(),
    readDirAssets: jest.fn(),
    existsAssets: jest.fn(),
    readdir: jest.fn(),
    setReadable: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    read: jest.fn(),
    readFileAssets: jest.fn(),
    hash: jest.fn(),
    copyFileAssets: jest.fn(),
    copyFileAssetsIOS: jest.fn(),
    copyAssetsVideoIOS: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn(),
    write: jest.fn(),
    downloadFile: jest.fn(),
    uploadFiles: jest.fn(),
    touch: jest.fn(),
    MainBundlePath: jest.fn(),
    CachesDirectoryPath: jest.fn(),
    DocumentDirectoryPath: jest.fn(),
    ExternalDirectoryPath: jest.fn(),
    ExternalStorageDirectoryPath: jest.fn(),
    TemporaryDirectoryPath: jest.fn(),
    LibraryDirectoryPath: jest.fn(),
    PicturesDirectoryPath: jest.fn(),
  };
});

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-device-info", () => mockRNDeviceInfo);

jest.mock("./src/utils/NativeModuleMethods", () => ({
  stopOverlayServiceNativeMethod: jest.fn(),
  storeUpcomingActivityAndRoutineMethod: jest.fn(),
}));

jest.mock("./src/utils/Posthog", () => ({
  logSentryError: jest.fn(),
}));

jest.mock("./src/utils/FileLogger", () => ({
  addInfoLog: jest.fn(),
  addErrorLog: jest.fn(),
  logAPIError: jest.fn(),
}));

jest.mock("react-native-localize", () => jest.requireActual("react-native-localize/mock/jest"));

jest.mock("moment", () => jest.requireActual("moment"));

// Mock Sentry
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn(),
  getCurrentHub: jest.fn(() => ({
    getClient: jest.fn(() => ({
      getOptions: jest.fn(() => ({})),
    })),
  })),
}));

// Mock react-native-toast-message
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Mock NativeDeviceInfo
jest.mock("react-native/src/private/specs_DEPRECATED/modules/NativeDeviceInfo", () => ({
  getConstants: jest.fn(() => ({
    Dimensions: {
      width: 375,
      height: 812,
    },
  })),
}));

// Mock react-native-url-polyfill
jest.mock("react-native-url-polyfill/auto", () => {});

// Mock react-native-auth0
jest.mock("react-native-auth0", () => {
  const mockAuth0 = {
    webAuth: {
      authorize: jest.fn(),
      clearSession: jest.fn(),
    },
    auth: {
      passwordRealm: jest.fn(),
      refreshToken: jest.fn(),
      revoke: jest.fn(),
    },
    users: {
      getUser: jest.fn(),
      patchUser: jest.fn(),
    },
  };

  return {
    default: jest.fn(() => mockAuth0),
    __esModule: true,
  };
});

// Mock rn-android-overlay-permission
jest.mock("rn-android-overlay-permission", () => ({
  requestOverlayPermission: jest.fn(),
  canDrawOverlays: jest.fn(),
}));

// Mock @invertase/react-native-apple-authentication
jest.mock("@invertase/react-native-apple-authentication", () => ({
  default: {
    isSupported: jest.fn(),
    signInAsync: jest.fn(),
    getCredentialStateForUser: jest.fn(),
  },
}));

// Mock Platform constants
jest.mock("react-native/Libraries/Utilities/Platform.ios", () => ({
  getConstants: jest.fn(() => ({
    Version: "15.0",
    isTesting: false,
    reactNativeVersion: {
      major: 0,
      minor: 80,
      patch: 1,
    },
  })),
}));

jest.mock("@notifee/react-native", () => {
  /**
   * Devido a vários problemas ao importar o mock oferecido pela notifee, resolvi
   * criar manualmente o mock apenas das funcionalidades que utilizamos no app.
   * https://github.com/invertase/notifee/issues/739
   */

  const notifee = {
    getInitialNotification: jest.fn().mockResolvedValue(null),
    displayNotification: jest.fn().mockResolvedValue(),
    onForegroundEvent: jest.fn().mockReturnValue(jest.fn()),
    onBackgroundEvent: jest.fn(),
    createChannelGroup: jest.fn().mockResolvedValue("channel-group-id"),
    createChannel: jest.fn().mockResolvedValue(),
  };

  return {
    ...jest.requireActual("@notifee/react-native/dist/types/Notification"),
    ...jest.requireActual("@notifee/react-native/dist/types/NotificationAndroid"),
    __esModule: true,
    default: notifee,
  };
});
