import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { View, StyleSheet, TouchableWithoutFeedback, ScrollView, BackHandler } from "react-native";
import {
  Card,
  TextField,
  AnimatedHeightView,
  MiniNav,
  ModalHeader,
  SmallButton,
  PressableWithFeedback,
  BodySmallText,
  BodyMediumText,
  Separator,
  Dot,
} from "@/components";
import { DueDateMenu, PrioritizeMenu, TagsMenu, Badge } from "./EditTaskComponents";
import { TaskCheckbox } from "./TaskCheckbox";
import Icon from "react-native-vector-icons/Ionicons";
import { useMiniNav } from "@/components/MiniNav";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme, useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { DUE_IN_TIME, getTOPScore, convertDueInToDate } from "@/utils/toDos";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import COLOR from "@/constants/color";
import { addTask } from "@/actions/UserActions";
import { formatDateFromNow } from "@/utils/TimeMethods";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import useVoiceMemo from "@/hooks/useVoiceMemo";
import { useTaskStatus } from "@/hooks/useTaskStatus";
import { uploadTodoAudioFromUri } from "@/actions/UserActions";
import { postHogCapture } from "@/utils/Posthog";
import Toast from "react-native-toast-message";
import QuickActionsBar from "./QuickActionsBar";
import { pick, types } from "@react-native-documents/picker";

const SCREENS = {
  MAIN_SCREEN: "MAIN_SCREEN",
  DUE_DATE: "DUE_DATE",
  PRIORITIZE: "PRIORITIZE",
  TAGS: "TAGS",
};

const DEFAULT_TASK = {
  title: "",
  due_date: convertDueInToDate(DUE_IN_TIME.TOMORROW),
  outcome: 5,
  perspiration_level: 5,
  tags: [],
};

const NewTaskContext = React.createContext(null);
export const useNewTask = () => React.useContext(NewTaskContext);

export const AddTaskPanel = React.memo(function AddTaskFooter({
  onOpenOcr,
  onAudioTodosExtracted,
  isImageProcessing,
  inputRef,
}) {
  const dispatch = useDispatch();
  const { colors, shadowStyles } = useTheme();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const isScreenFocused = useIsFocused();

  const [isFocused, setIsFocused] = useState(false);
  const miniNavRef = useRef(null);

  const [showTOPReminder, setShowTOPReminder] = useState(true);

  const [task, setTask] = useState(DEFAULT_TASK);
  const submitTask = useCallback(() => {
    if (task.title.trim()) {
      dispatch(addTask({ ...task, title: task.title.trim(), due_date: task.due_date.toISOString() }));
      setTask(DEFAULT_TASK);
      setIsFocused(false);
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_ADD_TASK);
    }
  }, [task, dispatch, setTask, setIsFocused]);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => isFocused && (setIsFocused(false) || true),
      );
      return () => subscription.remove();
    }, [isFocused]),
  );

  useEffect(() => {
    if (!isFocused) {
      miniNavRef.current && miniNavRef.current.reset();
      inputRef.current && inputRef.current.blur();
    }
  }, [isFocused]);

  // prettier-ignore
  const value = useMemo(
    () => ({ isFocused, setIsFocused, task, setTask, submitTask, inputRef, showTOPReminder, setShowTOPReminder, onOpenOcr, onAudioTodosExtracted, isImageProcessing }),
    [isFocused, setIsFocused, task, setTask, submitTask, inputRef, showTOPReminder, setShowTOPReminder, onOpenOcr, onAudioTodosExtracted, isImageProcessing]
  );

  return (
    <>
      <View style={styles.textFieldHeight} />
      <View style={styles.sheetFooterContainer} pointerEvents="box-none">
        <NewTaskContext.Provider value={value}>
          <Overlay />
          <KeyboardStickyView
            enabled={isScreenFocused}
            offset={{ opened: bottomTabBarHeight }}
            style={[
              styles.sheetFooter,
              shadowStyles.shadow,
              { backgroundColor: colors.card, borderColor: colors.separator },
            ]}
          >
            <AnimatedHeightView>
              <MiniNav initialScreen={SCREENS.MAIN_SCREEN} ref={miniNavRef}>
                <MiniNav.Screen name={SCREENS.MAIN_SCREEN} component={MainScreen} />
                <MiniNav.Screen name={SCREENS.DUE_DATE} component={DueDateScreen} />
                <MiniNav.Screen name={SCREENS.PRIORITIZE} component={PrioritizeScreen} />
                <MiniNav.Screen name={SCREENS.TAGS} component={TagsScreen} />
              </MiniNav>
            </AnimatedHeightView>
          </KeyboardStickyView>
        </NewTaskContext.Provider>
      </View>
    </>
  );
});

const Overlay = () => {
  const { isFocused, setIsFocused } = useNewTask();
  const [overlayVisible, setOverlayVisible] = useState(false);
  const visibilityTimeoutRef = useRef(null);
  const overlayOpacity = useSharedValue(0);

  // You can always use <Animated.View fadeIn/fadeOut /> for this, but for an overlay that covers the screen I
  // prefer that the unmount doesn't trigger an animation
  useEffect(() => {
    overlayOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    if (isFocused) {
      setOverlayVisible(true);
      visibilityTimeoutRef.current && clearTimeout(visibilityTimeoutRef.current);
    } else {
      visibilityTimeoutRef.current = setTimeout(() => setOverlayVisible(false), 200);
    }

    return () => visibilityTimeoutRef.current && clearTimeout(visibilityTimeoutRef.current);
  }, [isFocused, overlayOpacity]);

  return (
    overlayVisible && (
      <TouchableWithoutFeedback onPress={() => setIsFocused(false)}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: COLOR.DARK_OVERLAY, opacity: overlayOpacity }]}
        />
      </TouchableWithoutFeedback>
    )
  );
};

const MainScreen = () => {
  const { miniNav } = useMiniNav();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    isFocused,
    task,
    inputRef,
    setTask,
    submitTask,
    setIsFocused,
    showTOPReminder,
    setShowTOPReminder,
    onOpenOcr,
    onAudioTodosExtracted,
    isImageProcessing,
  } = useNewTask();

  const [isAudioProcessing, setIsAudioProcessing] = useState(false);

  const { isRecording, formattedTime, startRecording, stopRecording, setAudioPath } = useVoiceMemo();

  const { startPolling } = useTaskStatus((statusData) => {
    if (statusData?.status === "completed") {
      const aiResponse = statusData && statusData.metadata ? statusData.metadata.aiResponse : null;
      onAudioTodosExtracted(aiResponse);
      setIsAudioProcessing(false);
      Toast.show({ type: "success", text1: t("toDos.audio.completed"), text2: t("toDos.audio.completedDesc") });
    } else if (statusData?.status === "failed") {
      setIsAudioProcessing(false);
      Toast.show({ type: "error", text1: t("common.somethingWrong") });
    }
  });

  const tags = task?.tags || [];

  const handleUpload = useCallback(async () => {
    if (isAudioProcessing) return; // Prevent multiple uploads

    try {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_AUDIO_UPLOAD_START);
      const [res] = await pick({
        type: types.audio,
        allowMultiSelection: false,
      });

      const filePath = res?.uri;
      if (!filePath) return;

      setIsAudioProcessing(true);
      const uploaded = await uploadTodoAudioFromUri({
        localUri: filePath,
        contentType: res?.type || "audio/mpeg",
        fileName: res?.name,
      });
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_AUDIO_UPLOAD_SUCCESS);
      setTask((prev) => ({ ...prev, voice_memo: uploaded }));
      if (uploaded?.asyncTaskId) {
        startPolling(uploaded.asyncTaskId);
        Toast.show({ type: "info", text1: t("toDos.audio.processing") });
      }
    } catch (e) {
      setIsAudioProcessing(false);
      if (e?.includes("canceled")) return;
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_AUDIO_UPLOAD_FAILED);
      Toast.show({ type: "error", text1: t("common.somethingWrong") });
    }
  }, [setTask, startPolling, t, isAudioProcessing]);

  const handleToggleRecord = useCallback(async () => {
    if (isRecording) {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_AUDIO_RECORD_STOP);
      const path = await stopRecording();
      if (path) {
        setAudioPath(path);
        try {
          setIsAudioProcessing(true);
          const uploaded = await uploadTodoAudioFromUri({ localUri: path, contentType: "audio/mpeg" });
          setTask((prev) => ({ ...prev, voice_memo: uploaded }));
          if (uploaded?.asyncTaskId) {
            startPolling(uploaded.asyncTaskId);
            Toast.show({ type: "info", text1: t("toDos.audio.processing") });
          }
        } catch (e) {
          setIsAudioProcessing(false);
          Toast.show({ type: "error", text1: t("common.somethingWrong") });
        }
      }
    } else {
      postHogCapture(POSTHOG_EVENT_NAMES.TODOS_AUDIO_RECORD_START);
      await startRecording();
    }
  }, [isRecording, stopRecording, setAudioPath, setTask, startPolling, t, startRecording]);

  return (
    <>
      <View style={[styles.row, styles.textFieldRow]}>
        <View style={styles.checkboxContainer}>
          {isFocused ? <TaskCheckbox small /> : <Icon name="add" size={24} color={colors.text} />}
        </View>
        <TextField
          autoFocus={isFocused}
          placeholder={t("toDos.addATask")}
          style={styles.flex}
          inputStyle={[styles.textFieldInput, styles.textFieldHeight]}
          value={task.title}
          onChangeText={(value) => setTask({ ...task, title: value })}
          ref={inputRef}
          onSubmitEditing={submitTask}
          onFocus={() => setTimeout(() => setIsFocused(true), 50)}
          transparent
          testID="test:id/input-task"
        />
        <QuickActionsBar
          onUpload={handleUpload}
          onToggleRecord={handleToggleRecord}
          isRecording={isRecording}
          formattedTime={formattedTime}
          onOpenOcr={onOpenOcr}
          isAudioProcessing={isAudioProcessing}
          isImageProcessing={isImageProcessing}
        />

        <SubmitButton />
      </View>

      {isFocused && (
        <ScrollView
          horizontal
          contentContainerStyle={styles.mainMenuContainer}
          fadingEdgeLength={100}
          keyboardShouldPersistTaps="handled"
        >
          <MainMenuButton
            icon="calendar-clear"
            title={t("toDos.due")}
            onPress={() => miniNav.navigate(SCREENS.DUE_DATE)}
          >
            <Badge value={formatDateFromNow(task.due_date)} />
          </MainMenuButton>

          <Separator vertical />

          <MainMenuButton
            icon="heart"
            title={tags.length === 0 ? t("toDos.projects") : null}
            onPress={() => miniNav.navigate(SCREENS.TAGS)}
          >
            {tags.map((tag) => (
              <Card noPadding key={tag.id} style={styles.tag}>
                <BodySmallText>{tag.text}</BodySmallText>
              </Card>
            ))}
          </MainMenuButton>

          <Separator vertical />

          <MainMenuButton
            hasDot={showTOPReminder}
            icon="flash"
            title={t("toDos.TOP")}
            onPress={() => {
              miniNav.navigate(SCREENS.PRIORITIZE);
              postHogCapture(POSTHOG_EVENT_NAMES.TODOS_OPEN_PRIORITIZE_SCREEN);
              setShowTOPReminder(false);
            }}
          >
            <Badge value={Math.round(getTOPScore(task))} />
          </MainMenuButton>
        </ScrollView>
      )}
    </>
  );
};

const SubmitButton = () => {
  const { colors } = useTheme();
  const { task, submitTask } = useNewTask();
  return (
    task.title.trim() && (
      <SmallButton
        primary
        onPress={submitTask}
        renderRightIcon={<Icon name="send" size={18} color={colors.white} />}
        hitSlop={8}
        testID="test:id/submit-task"
      />
    )
  );
};

const MainMenuButton = ({ icon, title, children, onPress, hasDot }) => {
  const { colors } = useTheme();
  return (
    <PressableWithFeedback
      onPress={onPress}
      style={[styles.mainMenuButton, styles.row, styles.gap8]}
      testID={`test:id/main-menu-${title?.toLowerCase() || "button"}`}
    >
      {icon && <Icon name={icon} size={18} color={colors.subText} />}
      <View style={[styles.row, styles.gap4]}>
        {title && <BodyMediumText>{title}</BodyMediumText>}
        {children}
      </View>
      {hasDot && <Dot style={styles.dot} size={6} />}
    </PressableWithFeedback>
  );
};

const DueDateScreen = () => {
  const { t } = useTranslation();
  const { miniNav } = useMiniNav();
  const { setTask, task } = useNewTask();

  return (
    <>
      <ModalHeader title={t("toDos.dueDate")} onBackPress={() => miniNav.goBack()} rightContent={<SubmitButton />} />

      <DueDateMenu task={task} setTask={setTask} onSubmit={() => miniNav.goBack()} />
    </>
  );
};

const PrioritizeScreen = () => {
  const { t } = useTranslation();
  const { miniNav } = useMiniNav();
  const { task, setTask } = useNewTask();

  return (
    <>
      <ModalHeader
        title={t("toDos.TOPPrioritization")}
        onBackPress={() => miniNav.goBack()}
        rightContent={<SubmitButton />}
      />
      <PrioritizeMenu task={task} setTask={setTask} onPressDueDate={() => miniNav.navigate(SCREENS.DUE_DATE)} />
    </>
  );
};

const TagsScreen = () => {
  const { t } = useTranslation();
  const { miniNav } = useMiniNav();
  const { task, setTask } = useNewTask();

  return (
    <>
      <ModalHeader
        title={t("toDos.addProjects")}
        onBackPress={() => miniNav.goBack()}
        rightContent={<SubmitButton />}
      />
      <TagsMenu task={task} setTask={setTask} onSubmit={() => miniNav.goBack()} />
    </>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap8: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  sheetFooterContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 20, // because the header has zIndex 10
  },
  sheetFooter: {
    borderTopWidth: 1,
    paddingTop: 8,
    // So sheet doesn't have a gap at the bottom
    marginBottom: -1000,
    paddingBottom: 1000,
  },
  textFieldRow: {
    paddingHorizontal: 16,
    marginTop: -8,
  },
  checkboxContainer: {
    position: "absolute",
    left: 16,
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textFieldInput: {
    paddingLeft: 34,
    fontSize: 15,
  },
  textFieldHeight: {
    height: 56,
  },
  mainMenuContainer: {
    padding: 8,
    paddingTop: 0,
  },
  mainMenuButton: {
    padding: 8,
  },
  tag: {
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  dot: {
    position: "absolute",
    left: 10,
    top: 10,
  },
});
