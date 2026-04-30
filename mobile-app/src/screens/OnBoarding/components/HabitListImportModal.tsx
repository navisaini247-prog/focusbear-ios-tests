import React from "react";
import { View, StyleSheet, Image } from "react-native";
import { Modal, HorizontalAppLogo, Button } from "@/components";
import { HeadingLargeText } from "@/components/Text";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import WelcomeBear7 from "@/assets/bears/welcome-bear-7.png";
import Paper from "@/assets/bears/paper.png";

interface HabitListImportModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const HabitListImportModal: React.FC<HabitListImportModalProps> = ({ isVisible, onCancel, onConfirm }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const juniorBearMode = useSelector((state: any) => state.global?.juniorBearMode) || "normal";
  const isPirate = juniorBearMode === "pirate";

  return (
    <Modal
      isVisible={isVisible}
      onCancel={onCancel}
      fullScreen
      backdropColor={colors.background}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <SafeAreaView edges={["top", "bottom"]} style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <HorizontalAppLogo width={48} style={styles.logo} />
          <HeadingLargeText center style={styles.question}>
            {t("goals.addHabitList.haveHabitListQuestion")}
          </HeadingLargeText>
          <Image source={isPirate ? Paper : WelcomeBear7} style={styles.bearImage} resizeMode="contain" />
        </View>
        <View style={[styles.buttonContainer, { paddingBottom: Math.max(32, insets.bottom + 16) }]}>
          <Button
            title={t("common.no")}
            onPress={onCancel}
            style={styles.button}
            testID="test:id/habit-list-modal-no-thanks"
          />
          <Button
            title={t("goals.addHabitList.importHabits")}
            onPress={onConfirm}
            primary
            style={styles.button}
            testID="test:id/habit-list-modal-import"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
  },
  logo: {
    marginBottom: 0,
  },
  question: {
    paddingHorizontal: 16,
  },
  bearImage: {
    width: 300,
    height: 380,
    marginTop: 0,
    alignSelf: "center",
    paddingTop: 32,
  },
  buttonContainer: {
    gap: 16,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  button: {
    flex: 1,
  },
});
