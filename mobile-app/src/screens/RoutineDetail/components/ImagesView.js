import React from "react";
import { Image, View, StyleSheet } from "react-native";
import { useRoutineDetailContext } from "../context/context";
import { ScrollView } from "react-native-gesture-handler";

const ImagesView = () => {
  const { imageUrls } = useRoutineDetailContext();

  if (!imageUrls || imageUrls.length === 0) {
    return null;
  }

  return (
    <View style={styles.flex}>
      <ScrollView style={styles.imageListContainer}>
        {imageUrls.map((imageUrl, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image style={styles.imageStyle} resizeMode="contain" source={{ uri: imageUrl }} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  imageListContainer: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: "column",
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  imageStyle: {
    flex: 1,
    width: "100%",
  },
});

export default ImagesView;
