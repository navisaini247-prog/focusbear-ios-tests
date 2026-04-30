import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: "center",
    padding: 32,
    paddingTop: 16,
    gap: 16,
  },
  image: {
    alignSelf: "center",
    width: 128,
    height: 128,
    marginTop: -128,
    resizeMode: "cover",
  },
});
