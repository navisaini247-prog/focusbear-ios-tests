import Config from "react-native-config";

// Current Environment Checks
export const isDevEnvironment = () => Config.BUILD_VARIANT === "DEV";
export const isStagingEnvironment = () => Config.BUILD_VARIANT === "STAGING";
export const isProductionEnvironment = () => Config.BUILD_VARIANT === "PROD";

export const isTestingEnvironment = () => isDevEnvironment() || isStagingEnvironment();
