import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    padding: 16,
    gap: 32,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  checkboxesContainer: {
    gap: 16,
    paddingHorizontal: 16,
  },
  bearsonaContainer: {
    height: 200,
    aspectRatio: 1,
    alignSelf: "center",
    overflow: "hidden",
    marginBottom: "5%",
    justifyContent: "center",
    alignItems: "center",
  },
  bearImage: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
