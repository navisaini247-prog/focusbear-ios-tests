import React, { useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ConfirmationButton,
  HorizontalAppLogo,
  DisplaySmallText,
  HeadingSmallText,
  BodyLargeText,
  BodyMediumText,
  PressableWithFeedback,
  HeadingMediumText,
  Card,
  AnimatedHeightView,
  PermissionsIntroModal,
} from "@/components";
import Icon from "react-native-vector-icons/Ionicons";
import { NAVIGATION } from "@/constants";
import { useTranslation } from "react-i18next";
import { useNavigation, useTheme } from "@react-navigation/native";
import { styles } from "./PermissionExplanationScreen.styles";
import { useDispatch, useSelector } from "react-redux";
import { hasSeenPermissionIntro } from "@/selectors/UserSelectors";
import { setHasSeenPermissionIntro } from "@/actions/UserActions";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

export function PermissionExplanationScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const hasSeenIntro = useSelector(hasSeenPermissionIntro);
  const dispatch = useDispatch();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const onContinue = () => {
    if (hasSeenIntro) {
      navigation.navigate(NAVIGATION.GrantPermission);
      return;
    }
    setShowIntro(true);
  };

  const confirmIntro = () => {
    postHogCapture(POSTHOG_EVENT_NAMES.USER_HAS_SEEN_PERMISSION_INTRO);
    dispatch(setHasSeenPermissionIntro());
    setShowIntro(false);
    navigation.navigate(NAVIGATION.GrantPermission);
  };

  const onCancelIntro = () => {
    setShowIntro(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        <HorizontalAppLogo />
        <DisplaySmallText center>{t("permissionExplanation.title")}</DisplaySmallText>
        <HeadingMediumText center color={colors.subText}>
          {t("permissionExplanation.description")}
        </HeadingMediumText>

        <View style={styles.gap8}>
          <AnimatedHeightView>
            {isExpanded && (
              <Card style={styles.gap8}>
                <HeadingMediumText>{t("permissionExplanation.distractionGetBlockedWhen")}</HeadingMediumText>
                <BodyLargeText>{t("permissionExplanation.workTask")}</BodyLargeText>
                <BodyLargeText>{t("permissionExplanation.routineTask")}</BodyLargeText>
                <BodyLargeText>{t("permissionExplanation.sleepTask")}</BodyLargeText>
                <BodyLargeText>{t("permissionExplanation.toggleOption")}</BodyLargeText>
                <BodyMediumText italic>{t("permissionExplanation.friendOption")}</BodyMediumText>
              </Card>
            )}
          </AnimatedHeightView>

          <PressableWithFeedback
            onPress={() => setIsExpanded((prev) => !prev)}
            style={[styles.pressable, styles.row, styles.gap8]}
            testID="test:id/learn-more"
          >
            <HeadingSmallText color={colors.primary}>{t("common.learnMore")}</HeadingSmallText>
            <Icon name={isExpanded ? "caret-up" : "caret-down"} size={16} color={colors.primary} />
          </PressableWithFeedback>
        </View>
      </ScrollView>
      <ConfirmationButton
        confirmTestID="test:id/continue-to-grant-permisson"
        onConfirm={onContinue}
        confirmTitle={t("common.continue")}
      />
      <PermissionsIntroModal isVisible={showIntro} onConfirm={confirmIntro} onCancel={onCancelIntro} />
    </SafeAreaView>
  );
}
