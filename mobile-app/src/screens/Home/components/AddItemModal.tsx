import React from "react";
import { StyleSheet, View } from "react-native";
import { Group, HeadingMediumText, MenuItem, SheetModal } from "@/components";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { NAVIGATION } from "@/constants";
import { ScreenNavigationProp } from "@/navigation/AppNavigator";

export const AddItemModal = ({ isVisible, setIsVisible }) => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const { t } = useTranslation();

  return (
    <SheetModal isVisible={isVisible} onCancel={() => setIsVisible(false)}>
      <View style={[styles.contentContainer, styles.gap16]}>
        <HeadingMediumText>{t("home.createHeading")}</HeadingMediumText>

        <Group>
          <MenuItem
            title={t("common.habit")}
            icon="add-circle"
            onPress={() => {
              navigation.navigate(NAVIGATION.HabitSetting);
              setIsVisible(false);
            }}
            hideChevron
            testID="test:id/add-habit"
          />

          <MenuItem
            title={t("habitSetting.routine")}
            icon="layers"
            onPress={() => {
              navigation.navigate(NAVIGATION.EditCustomRoutine);
              setIsVisible(false);
            }}
            hideChevron
            testID="test:id/add-routine"
          />
        </Group>
      </View>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  gap16: { gap: 16 },
  contentContainer: {
    padding: 16,
    paddingVertical: 12,
  },
});
