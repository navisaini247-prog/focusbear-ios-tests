import React, { memo, useState, useCallback, useEffect } from "react";
import { View } from "react-native";
import { DisplaySmallText, BodyMediumText, BodySmallText, HeadingWithInfo, Space } from "@/components";
import { useTranslation } from "react-i18next";
import { TimeCountDown } from "@/components/TimeCountDown";
import { styles } from "./FocusMode.styles";
import { useDispatch } from "react-redux";
import ConfettiCannon from "react-native-confetti-cannon";
import { StrictnessToggle } from "./FocusSettings";
import { setIsFocusSuperStrictMode } from "@/actions/FocusModeActions";
import { Card, Group, TextField } from "@/components";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { FocusMusicButton } from "./FocusMusicButton";
import { FocusNotesButton } from "./FocusNotesButton";
import { EditFocusSessionModal } from "./EditFocusSessionModal";
import { ModifyFocusSessionModal } from "./ModifyFocusSessionModal";
import { playTimerCompletionSound } from "@/utils/SoundPlayer";
import { vibrateFocusTimerCompletion } from "@/utils/Vibration";
import { setSuperStrictModeNative } from "@/utils/NativeModuleMethods";
import { useKeepAwake } from "@sayem314/react-native-keep-awake";

const confettiCannonProps = {
  count: 100,
  origin: { x: -10, y: 0 },
  fadeOut: false,
  explosionSpeed: 500,
  colors: ["#FFD700", "#FFA500", "#FF6347", "#87CEEB", "#90EE90"],
};

const Focusing = ({
  timeString,
  focusFinishTime,
  onFocusDone,
  addTimeToFocus,
  reduceTimeFromFocus,
  focusNotes,
  setFocusModeNotes,
  congratsMessage,
  isSuperStrict,
  setIsSuperStrict,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isModifyModalVisible, setIsModifyModalVisible] = useState(false);
  const [isCongrats, setIsCongrats] = useState(false);
  const finishTimeUnix = focusFinishTime.getTime() / 1000;
  const setFocusThoughts = (thoughts) => dispatch(setFocusModeNotes({ ...focusNotes, thoughts }));

  const onTimerComplete = useCallback(() => {
    setIsCongrats(true);
    playTimerCompletionSound();
    vibrateFocusTimerCompletion();
    onFocusDone();
  }, [onFocusDone]);

  useEffect(() => {
    dispatch(setIsFocusSuperStrictMode(isSuperStrict));
    setSuperStrictModeNative(isSuperStrict);
  }, [dispatch, isSuperStrict]);

  const handleEditDuration = () => {
    // If super strict mode is on, only allow extending time using ModifyFocusSessionModal
    // Otherwise, allow full editing using EditFocusSessionModal
    if (isSuperStrict) {
      setIsModifyModalVisible(true);
    } else {
      setIsEditModalVisible(true);
    }
  };

  const handleConfirmEdit = (newTotalTimeMs) => {
    // Calculate the difference between new time and current remaining time
    const currentTimeLeftMs = focusFinishTime.getTime() - Date.now();
    const timeDifferenceMs = newTotalTimeMs - currentTimeLeftMs;
    if (timeDifferenceMs > 0) {
      addTimeToFocus(new Date(timeDifferenceMs));
    } else if (timeDifferenceMs < 0) {
      reduceTimeFromFocus(new Date(Math.abs(timeDifferenceMs)));
    }
    setIsEditModalVisible(false);
  };

  useKeepAwake();

  return (
    <SafeAreaView style={styles.flex} edges={["top"]}>
      <KeyboardAwareScrollView contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.row}>
          <View style={[styles.flex, styles.paddingLeft]}>
            <DisplaySmallText>{isCongrats ? congratsMessage : t("focusMode.focusingDescription")}</DisplaySmallText>
          </View>
          <View style={styles.buttonColumn}>
            <FocusMusicButton />
            <FocusNotesButton />
          </View>
        </View>

        <View style={[styles.flex, styles.justifyCenter, styles.padding16]}>
          <View style={styles.countdownContainer}>
            <TimeCountDown time={finishTimeUnix} callback={onTimerComplete} onEditDurationPress={handleEditDuration} />
          </View>

          <Space height={24} />

          <Group>
            <Card>
              <BodySmallText style={styles.label}>{t("focusMode.userIntention")}</BodySmallText>
              <BodyMediumText>{focusNotes.intention.trim() || t("focusMode.noIntentionWasFound")}</BodyMediumText>
            </Card>
          </Group>

          <Space height={24} />
          <HeadingWithInfo infoTestID="test:id/brain-dump-tooltip" infoText={t("focusMode.brainDumpToolTip")}>
            {t("focusMode.brainDump")}
          </HeadingWithInfo>
          <Space height={8} />
          <Group>
            <TextField
              testID="test:id/enter-focusing-thoughts"
              placeholder={t("focusMode.userDumpThoughTextInputDescription")}
              value={focusNotes.thoughts}
              multiline
              clearable
              editable={!isCongrats}
              onChangeText={setFocusThoughts}
            />
            <StrictnessToggle
              {...{ isSuperStrict, setIsSuperStrict }}
              disabled={isSuperStrict || isCongrats}
              fromFocusing
            />
          </Group>
        </View>

        <EditFocusSessionModal
          isVisible={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          onConfirm={handleConfirmEdit}
          currentRemainingTime={focusFinishTime.getTime() - Date.now()}
        />

        <ModifyFocusSessionModal
          isVisible={isModifyModalVisible}
          onCancel={() => setIsModifyModalVisible(false)}
          onConfirm={(additionalTime) => {
            // In super strict mode, only allow extending time
            addTimeToFocus(additionalTime);
            setIsModifyModalVisible(false);
          }}
          mode="extend"
        />
      </KeyboardAwareScrollView>

      {isCongrats && <ConfettiCannon {...confettiCannonProps} />}
    </SafeAreaView>
  );
};

export default memo(Focusing);
