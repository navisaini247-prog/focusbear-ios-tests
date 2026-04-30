import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  headerContainer: {
    gap: 8,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 32,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 16,
  },
  bodyContainer: {
    gap: 16,
    justifyContent: "center",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  termsText: {
    lineHeight: 24,
  },
  termsTextContainer: {
    flex: 1,
  },
  bearSpacer: {
    flex: 1,
    minHeight: 20,
  },
  bearImageContainer: {
    width: "100%",
    alignItems: "center",
  },
  bearImage: {
    width: "100%",
    height: 200,
  },
  backToSignInMethod: {
    marginTop: 8,
    paddingVertical: 8,
  },
  emailButton: {
    paddingHorizontal: 48,
  },
});
