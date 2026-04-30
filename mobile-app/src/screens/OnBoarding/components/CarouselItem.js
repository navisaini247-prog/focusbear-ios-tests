import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { Image } from "react-native";
import { BodyLargeText } from "@/components/Text";

export const CarouselItem = memo(function CarouselItem({ illustration, descriptionKey, content: Content }) {
  return (
    <View style={[styles.container, styles.flex]}>
      {illustration && <Image source={illustration} style={styles.image} resizeMode="contain" />}
      {Content && <Content />}
      <Trans
        i18nKey={descriptionKey}
        parent={BodyLargeText}
        style={styles.description}
        components={{ bold: <BodyLargeText weight="bold" center /> }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    justifyContent: "center",
    gap: 16,
    width: "100%",
  },
  image: {
    alignSelf: "center",
    height: "75%",
    width: "100%",
  },
  description: {
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
