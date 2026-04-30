import { StyleSheet } from "react-native";

export const styles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    image_style: {
      height: 32,
      width: 32,
      resizeMode: "contain",
      marginHorizontal: 20,
      alignSelf: "flex-end",
    },
    webView: {
      minHeight: 200,
    },
    webViewHidden: {
      display: "none",
    },
  });
