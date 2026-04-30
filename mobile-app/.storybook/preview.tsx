import type { Preview } from "@storybook/react";
import React from "react";
import { View, useColorScheme } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "react-redux";
import { store } from "../src/store";
import { theme as themes } from "../src/theme";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#FFFFFF" },
        { name: "dark", value: "#1A1A1A" },
      ],
    },
  },
  decorators: [
    (Story) => {
      const scheme = useColorScheme();
      const theme = themes[scheme] || themes.light;

      return (
        <Provider store={store}>
          <SafeAreaProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <NavigationContainer theme={theme}>
                <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
                  <Story />
                </View>
              </NavigationContainer>
            </GestureHandlerRootView>
          </SafeAreaProvider>
        </Provider>
      );
    },
  ],
};

export default preview;
