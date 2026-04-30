import { StyleSheet } from "react-native";

export const styles = (colors) => {
  return StyleSheet.create({
    flex: {
      flex: 1,
      paddingTop: 32,
    },
    container: {
      alignItems: "center",
      padding: 16,
      paddingHorizontal: 32,
    },
    headingText: {
      marginTop: 32,
    },
    subtitleText: {
      marginTop: 16,
      paddingHorizontal: 16,
    },
    image_style: {
      resizeMode: "contain",
      alignSelf: "center",
      marginVertical: 20,
    },
    moon_image_style: {
      marginTop: 35,
      marginBottom: 15,
    },
    descriptionTextContainer: {
      flex: 1,
      justifyContent: "center",
    },
    warningText: {
      paddingTop: 20,
      color: colors.danger,
    },
    timeContainerWrapper: {
      position: "relative",
      alignItems: "center",
    },
    bearOverlay: {
      position: "absolute",
      top: -180,
      width: 400,
      height: 250,
      zIndex: 10,
      alignSelf: "center",
    },
    timeContainer: {
      borderWidth: 1,
      borderRadius: 8,
      overflow: "hidden",
      borderColor: colors.separator,
      backgroundColor: colors.background,
      alignItems: "center",
    },
    waveContainer: {
      width: "100%",
      alignItems: "center",
    },
    iconContainer: {
      marginTop: 40,
      marginBottom: 16,
    },
    lottieContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      marginVertical: 20,
    },
    lottieAnimation: {
      width: 300,
      height: 450,
    },
    descriptionText: {
      textAlign: "center",
      lineHeight: 20,
    },
    buttonContainer: {
      width: "100%",
      gap: 16,
      paddingBottom: 32,
    },
  });
};
