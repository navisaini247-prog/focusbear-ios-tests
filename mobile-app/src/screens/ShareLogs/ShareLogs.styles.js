import { StyleSheet } from "react-native";

export const styles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subContainer: {
      padding: 16,
    },
    uploadTxtContainer: {
      alignItems: "center",
      flexDirection: "row",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 6,
      alignSelf: "flex-start",
      marginBottom: 12,
    },
    textField: {
      minHeight: 150,
    },
    pickedImage: {
      height: 46,
      width: 46,
      resizeMode: "cover",
    },
    deleteOverlay: {
      position: "absolute",
    },
    addImageButton: {
      borderColor: colors.secondaryBorder,
      borderRadius: 10,
      height: 50,
      width: 50,
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    imageCollectionContainer: {
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
      flexWrap: "wrap",
    },
    imageItem: {
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
  });
