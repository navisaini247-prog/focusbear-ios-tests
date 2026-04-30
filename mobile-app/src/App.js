import "react-native-get-random-values";
import React, { useEffect } from "react";
import { enableScreens } from "react-native-screens";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@/store";
import * as Sentry from "@sentry/react-native";
import Config from "react-native-config";
import { SENTRY } from "./utils/Enums";
import { configureFileLogger } from "./utils/FileLogger";
import { Text, TextInput } from "react-native";
import { checkIsDebug } from "./utils/GlobalMethods";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { isProductionEnvironment } from "./utils/Environment";
import { FONT_SCALE_LIMIT } from "./utils/FontScaleUtils";

import { TextEncoder, TextDecoder } from "text-encoding";
import { RootNavigator } from "./navigation";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

enableScreens();

if (!checkIsDebug()) {
  Sentry.init({
    dsn: SENTRY.DSN,
    environment: Config.BUILD_VARIANT,
    tracesSampleRate: 1.0,
    enableNdkScopeSync: true,
    debug: !isProductionEnvironment(),
  });
}

// Enable system font scaling globally, but cap it so it never gets too large.
if (Text.defaultProps == null) {
  Text.defaultProps = {};
}
Text.defaultProps.allowFontScaling = true;
Text.defaultProps.maxFontSizeMultiplier = FONT_SCALE_LIMIT.DEFAULT_TEXT;

if (TextInput.defaultProps == null) {
  TextInput.defaultProps = {};
}
TextInput.defaultProps.allowFontScaling = true;
TextInput.defaultProps.maxFontSizeMultiplier = FONT_SCALE_LIMIT.DEFAULT_TEXT;

function App() {
  useEffect(() => {
    configureFileLogger();
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <SafeAreaProvider>
          <Sentry.ErrorBoundary>
            <RootNavigator />
          </Sentry.ErrorBoundary>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

export default Sentry.wrap(App);
