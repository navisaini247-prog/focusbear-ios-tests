import COLOR from "@/constants/color";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  marginBottom: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonColumn: {
    alignItems: "flex-end",
    gap: 8,
  },
  justifyCenter: {
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: "hidden",
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  scrollContentContainerEnd: {
    justifyContent: "flex-end",
  },
  subHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontWeight: "700",
  },
  focusButton: {
    flex: 1,
    minWidth: 150,
  },
  focusButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  timePickerCard: {
    paddingVertical: 0,
  },
  countdownContainer: {
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  buttonGap: {
    width: 12,
  },
  warningBanner: {
    borderColor: COLOR.NEGATIVE,
    marginBottom: 8,
  },
  paddingLeft: {
    paddingLeft: 16,
  },
  padding16: {
    padding: 16,
  },
});
