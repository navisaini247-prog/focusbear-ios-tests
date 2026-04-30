import { StyleSheet } from "react-native";
import COLOR from "@/constants/color";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLOR.GRAY[950],
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 8,
    justifyContent: "space-between",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    justifyContent: "space-between",
  },
  title: {
    marginTop: 8,
    marginHorizontal: 16,
  },
  centerBear: {
    alignSelf: "center",
    width: 180,
    height: 180,
  },
  bottomSection: {
    flexDirection: "column",
    marginTop: 24,
  },
  bubble: {
    maxWidth: 240,
    marginBottom: 16,
  },
  bearWrapper: {
    alignSelf: "flex-end",
    marginHorizontal: -8,
    marginBottom: -12,
  },
  captainBear: {
    width: 220,
    height: 260,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: COLOR.GRAY[900],
  },
  secondaryFooter: {
    backgroundColor: COLOR.GRAY[900],
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
    gap: 4,
  },
  card: {
    flex: 1,
    paddingTop: 8,
    height: 200,
    overflow: "hidden",
    opacity: 0.7,
  },
  cardImageWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "85%",
  },
  cardLabel: {
    marginTop: 4,
  },
  textSkip: {
    marginBottom: 16,
  },
  textSkipLabel: {},
  habitListImage: {
    width: 300,
    height: 220,
    marginTop: 40,
    alignSelf: "center",
  },
  footerButton: {
    width: "100%",
    marginTop: 8,
  },
});
