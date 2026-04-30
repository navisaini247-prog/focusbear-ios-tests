import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { HeadingLargeText, BodyMediumText } from "@/components";
import { TimeCountDown } from "@/components/TimeCountDown";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { currentFocusModeFinishTimeSelector } from "@/selectors/UserSelectors";
import { NAVIGATION } from "@/constants/navigation";
import { useTranslation } from "react-i18next";
import { ScreenNavigationProp } from "@/navigation/AppNavigator";
import { StartFocusButton } from "../StartFocusButton";

const FocusModeCard = () => {
  const navigation = useNavigation<ScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const finishTime = useSelector(currentFocusModeFinishTimeSelector);
  const [, setState] = useState(false); // so we can trigger a rerender
  const isActive = new Date(finishTime).getTime() > Date.now();
  const navigateToFocus = () => navigation.navigate(NAVIGATION.Focus);

  return (
    <>
      <View style={[styles.container, styles.headerContainer]}>
        <View style={styles.titleRow}>
          <HeadingLargeText weight="700">{t("overview.focusModeTitle")}</HeadingLargeText>
          <BodyMediumText color={colors.subText}>{`\u00B7 ${
            isActive ? t("overview.focusActive") : t("overview.focusInactive")
          }`}</BodyMediumText>
        </View>

        {isActive ? (
          <TimeCountDown
            size={32}
            time={new Date(finishTime).getTime() / 1000}
            callback={() => setState((prev) => !prev)}
            onEditDurationPress={() => {}}
          />
        ) : (
          <StartFocusButton onPress={navigateToFocus} />
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  headerContainer: {
    gap: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default FocusModeCard;
