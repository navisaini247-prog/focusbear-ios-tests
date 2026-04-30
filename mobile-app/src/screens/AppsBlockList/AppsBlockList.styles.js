import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  horizontalBar: {
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  },
  searchContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  selectToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    paddingLeft: 16,
  },
  selectedCountContainer: {
    minWidth: 24, // So the layout doesn't shift when the count changes
    alignItems: "flex-end",
  },
  listItem: {
    paddingHorizontal: 16,
    borderWidth: 0,
  },
  filterChipsContainer: {
    paddingLeft: 8,
    paddingRight: 16,
    gap: 8,
    alignItems: "center",
    flexDirection: "row",
  },
  sectionListHeader: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  imageStyle: {
    height: 32,
    width: 32,
    resizeMode: "contain",
  },
  emptyContainer: {
    padding: 24,
  },
  modalContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
