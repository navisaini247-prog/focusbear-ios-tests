import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginVertical: 10,
    maxWidth: "100%",
  },
  checkboxText: { flexShrink: 1 },
  scrollViewStyle: {
    alignItems: "center",
    padding: 20,
    gap: 10,
  },
});
