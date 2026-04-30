import { StyleSheet } from "react-native";

export const styles = (colors) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      padding: 16,
      flexGrow: 1,
    },
    blurbTextContainer: {
      justifyContent: "center",
      gap: 16,
    },
    optionsContainer: {
      gap: 16,
    },
  });
