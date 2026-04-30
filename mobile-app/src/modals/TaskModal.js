import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { View, StyleSheet, Alert, Pressable, useWindowDimensions } from "react-native";
import {
  HeadingSmallText,
  BodyMediumText,
  BodySmallText,
  BodyXSmallText,
  SmallButton,
  Card,
  Group,
  TextField,
  Separator,
  AnimatedHeightView,
  PressableWithFeedback,
  SheetModal,
  HorizontalSelector,
  ScalableIcon,
} from "@/components";
import { DueDateMenu, PrioritizeMenu, TagsMenu, Badge } from "../screens/ToDos/Components/EditTaskComponents";
import { TaskCheckbox } from "@/screens/ToDos/Components/TaskCheckbox";
import { FONT_SCALE_LIMIT, clampFontScale, scaleByFontScale } from "@/utils/FontScaleUtils";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useAnimatedReaction,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { triggerHaptics, HapticTypes } from "react-native-turbo-haptics";
import { useSelector, useDispatch } from "react-redux";
import { hideTaskModal, clearTaskModalTaskId } from "@/actions/ModalActions";
import { isTaskModalVisibleSelector, taskModalTaskIdSelector } from "@/selectors/ModalSelectors";
import { tasksSelector } from "@/selectors/UserSelectors";
import { draftTodosSelector } from "@/reducers/UserReducer";
import { TASK_STATUS, getTOPScore, stripBackendScores } from "@/utils/toDos";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { addTask, deleteTask, updateTask, removeDraftTodo } from "@/actions/UserActions";
import { useTheme } from "@react-navigation/native";
import { v4 as uuidv4 } from "uuid";
import { debounce } from "lodash";
import { formatDateFromNow } from "@/utils/TimeMethods";
import { useTranslation } from "react-i18next";
import { postHogCapture } from "@/utils/Posthog";
import Toast from "react-native-toast-message";
import COLOR from "@/constants/color";

const { NOT_STARTED, IN_PROGRESS, COMPLETED, DRAFT } = TASK_STATUS;

const ACCORDION_SECTIONS = {
  DUE_DATE: "DUE_DATE",
  PRIORITIZE: "PRIORITIZE",
  TAGS: "TAGS",
};

export const TaskModal = memo(function TaskModal() {
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();

  const isVisible = useSelector(isTaskModalVisibleSelector);
  const taskId = useSelector(taskModalTaskIdSelector);

  const useStackedLayout = clampFontScale(fontScale) >= 1.4;
  const accordionMinHeight = scaleByFontScale(48, fontScale);
  const subtaskItemHeight = scaleByFontScale(48, fontScale);

  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => setExpandedSection(null), [isVisible]);

  const [task, setTask] = useState(null); // working copy of the task
  const [hasSaved, setHasSaved] = useState(false);

  const tasks = useSelector(tasksSelector);
  const draftTodos = useSelector(draftTodosSelector);
  const actualTask = useRef(null);
  actualTask.current = useMemo(() => {
    return tasks.find((task) => task.id === taskId) || draftTodos.find((draft) => draft.id === taskId);
  }, [tasks, taskId, draftTodos]);

  useEffect(() => {
    if (taskId) {
      setTask(actualTask.current || null);
    } else if (!isVisible) {
      setTask(null);
    }
  }, [taskId, isVisible]);

  useEffect(() => setHasSaved(false), [taskId]);

  const saveTask = useCallback(
    async (task) => {
      if (!task?.title || !task?.due_date) return;
      setHasSaved(false);
      try {
        if (task.status === DRAFT) {
          dispatch(addTask({ ...task, status: NOT_STARTED }));
          dispatch(removeDraftTodo(task.id));
          Toast.show({ type: "success", text1: t("common.created") });
        } else {
          await dispatch(updateTask(task));
        }
        setHasSaved(true);
      } catch (e) {
        console.error(e);
      }
    },
    [dispatch, t],
  );

  const debouncedSaveTask = useCallback(debounce(saveTask, 1000), [saveTask]);

  const setTaskAndSave = useCallback(
    (updaterFunction, immediate = false) => {
      setTask((prev) => {
        const newTask = stripBackendScores(updaterFunction(prev));
        if (newTask?.status !== "DRAFTS") {
          if (immediate) {
            setTimeout(() => saveTask(newTask), 0);
          } else {
            debouncedSaveTask(newTask);
          }
        }
        return newTask;
      });
    },
    [saveTask, debouncedSaveTask],
  );

  const setTitle = useCallback((title) => setTaskAndSave((prev) => ({ ...prev, title })), [setTaskAndSave]);
  const toggleComplete = useCallback(
    () => setTaskAndSave((prev) => ({ ...prev, status: prev?.status === COMPLETED ? NOT_STARTED : COMPLETED }), true),
    [setTaskAndSave],
  );
  const setStatus = useCallback(
    (status) => {
      setTaskAndSave((prev) => ({ ...prev, status }), true);
      if (status === COMPLETED) {
        postHogCapture(POSTHOG_EVENT_NAMES.TODOS_COMPLETE_TASK);
      }
    },
    [setTaskAndSave],
  );
  const setDetails = useCallback((details) => setTaskAndSave((prev) => ({ ...prev, details })), [setTaskAndSave]);

  const onPressDeleteTask = () => {
    Alert.alert(t("toDos.deleteTask"), t("toDos.deleteTaskDesc"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          if (task.status === DRAFT) {
            dispatch(removeDraftTodo(task.id));
          } else {
            dispatch(deleteTask(taskId));
          }
          dispatch(hideTaskModal());
          dispatch(clearTaskModalTaskId());
        },
      },
    ]);
  };

  return (
    <SheetModal
      fullHeight
      isVisible={isVisible}
      onCancel={() => dispatch(hideTaskModal())}
      HeaderComponent={
        <Header task={task} setTitle={setTitle} toggleComplete={toggleComplete} titleMinHeight={accordionMinHeight} />
      }
      FooterComponent={<Footer onPressDelete={onPressDeleteTask} hasSaved={hasSaved} task={task} saveTask={saveTask} />}
    >
      <Subtasks subtasks={task?.subtasks || []} setTaskAndSave={setTaskAndSave} subtaskItemHeight={subtaskItemHeight} />

      <View style={[styles.container, styles.flex, styles.gap16, { borderColor: colors.separator }]}>
        <StatusSelector task={task} setStatus={setStatus} useStackedLayout={useStackedLayout} />

        {/* For now I'm using expandable sections here but what I really want is popup menus */}
        <Group>
          <DueDateSection
            {...{ expandedSection, setExpandedSection, task, setTaskAndSave }}
            useStackedLayout={useStackedLayout}
            accordionMinHeight={accordionMinHeight}
          />
          <PrioritizeSection
            {...{ expandedSection, setExpandedSection, task, setTaskAndSave }}
            useStackedLayout={useStackedLayout}
            accordionMinHeight={accordionMinHeight}
          />
          <TagsSection
            {...{ expandedSection, setExpandedSection, task, setTaskAndSave }}
            useStackedLayout={useStackedLayout}
            accordionMinHeight={accordionMinHeight}
          />
        </Group>

        <TextField
          multiline
          useRNGHTextInput
          placeholder={t("toDos.addDescription")}
          value={task?.details}
          onChangeText={setDetails}
        />
      </View>
    </SheetModal>
  );
});

const Header = ({ task, setTitle, toggleComplete, titleMinHeight }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.row, styles.titleRow]}>
      <Pressable onPress={toggleComplete} hitSlop={16} testID="test:id/task-toggle-complete">
        <TaskCheckbox value={task?.status === COMPLETED} testID="test:id/task-complete-checkbox" />
      </Pressable>
      <TextField
        multiline
        transparent
        useRNGHTextInput
        placeholder={t("toDos.addATitle")}
        value={task?.title}
        onChangeText={setTitle}
        style={styles.flex}
        inputStyle={[styles.titleFieldInput, titleMinHeight && { minHeight: titleMinHeight }]}
      />
    </View>
  );
};

const Subtasks = ({ subtasks, setTaskAndSave, subtaskItemHeight = 48 }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const addSubtaskIconSize = scaleByFontScale(18, fontScale, {
    maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI,
  });

  const [isInputFocused, setIsInputFocused] = useState(false);
  const reorderingState = useSharedValue({ from: null, to: null });

  const inputRef = useRef(null);

  const setSubtasksAndSave = useCallback(
    (updaterFunction) => {
      setTaskAndSave((prev) => {
        const newSubtasks = updaterFunction(prev?.subtasks || []);
        return { ...prev, subtasks: newSubtasks };
      });
    },
    [setTaskAndSave],
  );

  const addSubtask = (newSubtaskName) => {
    if (!newSubtaskName) return;
    setSubtasksAndSave((prev) => [...(prev || []), { name: newSubtaskName, is_completed: false, id: uuidv4() }]);
    inputRef.current && inputRef.current.clear();
  };

  const onPressDeleteSubtask = useCallback(
    (id) => {
      Alert.alert(t("toDos.deleteSubtask"), t("toDos.deleteSubtaskDesc"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => setSubtasksAndSave((prev) => prev.filter((subtask) => !id || subtask.id !== id)),
        },
      ]);
    },
    [setSubtasksAndSave, t],
  );

  const setSubtaskName = useCallback(
    (id, name) =>
      setSubtasksAndSave((prev) => prev.map((subtask) => (subtask.id === id ? { ...subtask, name } : subtask))),
    [setSubtasksAndSave],
  );

  const toggleSubtask = useCallback(
    (id) =>
      setSubtasksAndSave((prev) =>
        prev.map((subtask) => (subtask.id === id ? { ...subtask, is_completed: !subtask.is_completed } : subtask)),
      ),
    [setSubtasksAndSave],
  );

  const reorderSubtask = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      setSubtasksAndSave((prev) => {
        const newSubtasks = [...prev];
        const [movedItem] = newSubtasks.splice(fromIndex, 1);
        newSubtasks.splice(toIndex, 0, movedItem);
        return newSubtasks;
      });
    },
    [setSubtasksAndSave],
  );

  return (
    <>
      <AnimatedHeightView style={styles.overflowVisible}>
        {subtasks.map((subtask, index) => (
          <SubtaskItem
            key={`${subtask.id}${index}`} // prevent flicker by discarding animated translateY of reordered items
            {...subtask}
            index={index}
            totalCount={subtasks.length}
            deleteSubtask={onPressDeleteSubtask}
            toggleSubtask={toggleSubtask}
            setSubtaskName={setSubtaskName}
            reorderSubtask={reorderSubtask}
            reorderingState={reorderingState}
            subtaskItemHeight={subtaskItemHeight}
          />
        ))}
      </AnimatedHeightView>

      <View style={styles.row}>
        <View style={[styles.subtaskCheckboxContainer, { minHeight: subtaskItemHeight }]}>
          {isInputFocused ? (
            <TaskCheckbox small testID="test:id/subtask-add-checkbox" />
          ) : (
            <ScalableIcon name="add" size={addSubtaskIconSize} color={colors.text} scaleWithText={false} />
          )}
        </View>
        {isInputFocused ? (
          <TextField
            ref={inputRef}
            placeholder={t("toDos.addASubtask")}
            autoFocus
            transparent
            useRNGHTextInput
            submitBehavior="submit"
            onSubmitEditing={(event) => addSubtask(event.nativeEvent.text)}
            onEndEditing={(event) => addSubtask(event.nativeEvent.text)}
          />
        ) : (
          <Pressable
            onPress={() => setIsInputFocused(true)}
            style={[styles.flex, styles.inputPlaceholder, { minHeight: subtaskItemHeight }]}
            testID="test:id/subtask-add-pressable"
          >
            <HeadingSmallText
              color={colors.subText}
              maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI}
              style={styles.subtaskAddLabel}
            >
              {t("toDos.addASubtask")}
            </HeadingSmallText>
          </Pressable>
        )}
      </View>
    </>
  );
};

const SubtaskItem = memo(function SubtaskItem({
  index,
  totalCount,
  deleteSubtask,
  toggleSubtask,
  setSubtaskName,
  reorderSubtask,
  reorderingState,
  subtaskItemHeight = 48,
  ...subtask
}) {
  const { name, is_completed, id } = subtask;
  const { colors } = useTheme();

  const [isInputFocused, setIsInputFocused] = useState(false);

  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const prevNewIndex = useSharedValue(-1);

  useAnimatedReaction(
    () => reorderingState.value,
    (reordering) => {
      if (reordering.from === null || reordering.from === index) return;

      if (reordering.from < index && reordering.to >= index) {
        translateY.value = withSpring(-subtaskItemHeight, { mass: 2 });
      } else if (reordering.from > index && reordering.to <= index) {
        translateY.value = withSpring(subtaskItemHeight, { mass: 2 });
      } else {
        translateY.value = withSpring(0);
      }
    },
    [reorderingState, translateY, index, subtaskItemHeight],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(200)
        .onStart(() => {
          isDragging.value = true;
          translateY.value = 0;
          triggerHaptics(HapticTypes.impactMedium);
        })
        .onUpdate((event) => {
          const minTranslate = -index * subtaskItemHeight;
          const maxTranslate = (totalCount - 1 - index) * subtaskItemHeight;
          translateY.value = Math.max(minTranslate, Math.min(maxTranslate, event.translationY));

          const offsetIndex = Math.round(translateY.value / subtaskItemHeight);
          const newIndex = Math.max(0, Math.min(totalCount - 1, index + offsetIndex));

          if (prevNewIndex.value !== newIndex) {
            reorderingState.value = { from: index, to: newIndex };
            prevNewIndex.value = newIndex;
          }
        })
        .onEnd(() => {
          const offsetIndex = Math.round(translateY.value / subtaskItemHeight);
          const newIndex = Math.max(0, Math.min(totalCount - 1, index + offsetIndex));
          const targetTranslateY = (newIndex - index) * subtaskItemHeight;

          isDragging.value = false;

          translateY.value = withTiming(targetTranslateY, { duration: 150 }, () => {
            reorderingState.value = { from: null, to: null };
            if (newIndex !== index) {
              runOnJS(reorderSubtask)(index, newIndex);
            }
          });
        }),
    [index, totalCount, reorderSubtask, isDragging, translateY, prevNewIndex, reorderingState, subtaskItemHeight],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isDragging.value ? 100 : 0,
    backgroundColor: isDragging.value ? colors.overlay : COLOR.TRANSPARENT,
    boxShadow: isDragging.value ? [{ color: COLOR.SHADOW, blurRadius: 10, offsetX: 0, offsetY: 0 }] : [],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <Separator />
        <View style={[styles.row, styles.subtaskItem]}>
          <PressableWithFeedback onPress={() => toggleSubtask(id)} hitSlop={16} testID={`test:id/subtask-toggle-${id}`}>
            <TaskCheckbox small value={is_completed} testID={`test:id/subtask-checkbox-${id}`} />
          </PressableWithFeedback>
          {isInputFocused ? (
            <TextField
              autoFocus
              transparent
              useRNGHTextInput
              value={name}
              onChangeText={(text) => setSubtaskName(id, text)}
              onBlur={() => setIsInputFocused(false)}
              style={styles.flex}
            />
          ) : (
            <Pressable
              onPress={() => setIsInputFocused(true)}
              style={[styles.flex, styles.inputPlaceholder, { minHeight: subtaskItemHeight }]}
              testID={`test:id/subtask-edit-${id}`}
            >
              <HeadingSmallText numberOfLines={1}>{name}</HeadingSmallText>
            </Pressable>
          )}
          <PressableWithFeedback
            onPress={() => deleteSubtask(id)}
            style={styles.pressable}
            testID={`test:id/subtask-delete-${id}`}
          >
            <ScalableIcon name="close" size={18} color={colors.border} />
          </PressableWithFeedback>
        </View>
      </Animated.View>
    </GestureDetector>
  );
});

const StatusSelector = ({ task, setStatus, useStackedLayout }) => {
  const { t } = useTranslation();

  if (task?.status === DRAFT) return null;

  const items = [
    { key: NOT_STARTED, title: t("toDos.notStarted"), testID: "test:id/not-started-status" },
    { key: IN_PROGRESS, title: t("toDos.inProgress"), testID: "test:id/in-progress-status" },
    { key: COMPLETED, title: t("toDos.completed"), testID: "test:id/completed-status" },
  ];

  return (
    <HorizontalSelector
      style={[styles.statusSelectorContainer, useStackedLayout && styles.flexWrap]}
      items={items}
      selectedItem={task?.status}
      setSelectedItem={setStatus}
    />
  );
};

const DueDateSection = ({ expandedSection, setExpandedSection, task, setTaskAndSave, ...props }) => {
  const { t } = useTranslation();

  return (
    <AccordionSection
      section={ACCORDION_SECTIONS.DUE_DATE}
      expandedSection={expandedSection}
      setExpandedSection={setExpandedSection}
      title={t("toDos.due")}
      icon="calendar-clear"
      CollapsedComponent={<Badge value={formatDateFromNow(task?.due_date)} />}
      {...props}
    >
      <DueDateMenu
        task={task}
        setTask={(updater) => setTaskAndSave(updater, true)}
        onSubmit={() => setExpandedSection(null)}
      />
    </AccordionSection>
  );
};

const PrioritizeSection = ({ expandedSection, setExpandedSection, task, setTaskAndSave, ...props }) => {
  const { t } = useTranslation();

  return (
    <AccordionSection
      section={ACCORDION_SECTIONS.PRIORITIZE}
      expandedSection={expandedSection}
      setExpandedSection={setExpandedSection}
      title={t("toDos.TOP")}
      icon="flash"
      CollapsedComponent={<Badge value={Math.round(getTOPScore(task))} />}
      {...props}
    >
      <PrioritizeMenu
        task={task}
        setTask={(updater) => setTaskAndSave(updater, false)}
        onPressDueDate={() => setExpandedSection(ACCORDION_SECTIONS.DUE_DATE)}
      />
    </AccordionSection>
  );
};

const TagsSection = ({ expandedSection, setExpandedSection, task, setTaskAndSave, ...props }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const tags = task?.tags || [];

  return (
    <AccordionSection
      section={ACCORDION_SECTIONS.TAGS}
      expandedSection={expandedSection}
      setExpandedSection={setExpandedSection}
      title={t("toDos.projects")}
      icon="heart"
      CollapsedComponent={
        <View style={[styles.row, styles.gap4]}>
          {tags.map((tag) => (
            <Card noPadding key={tag.id} style={styles.tag}>
              <BodyXSmallText color={colors.subText} numberOfLines={1}>
                {tag.text}
              </BodyXSmallText>
            </Card>
          ))}
        </View>
      }
      {...props}
    >
      <TagsMenu task={task} setTask={(updater) => setTaskAndSave(updater, true)} />
    </AccordionSection>
  );
};

const AccordionSection = ({
  section,
  expandedSection,
  setExpandedSection,
  title,
  icon,
  children,
  CollapsedComponent,
  ExpandedComponent,
  useStackedLayout,
  accordionMinHeight,
  ...props
}) => {
  const { colors } = useTheme();

  const toggleExpanded = () => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const isExpanded = expandedSection === section;

  return (
    <Card noPadding {...props}>
      <PressableWithFeedback
        onPress={toggleExpanded}
        style={[
          styles.accordionButton,
          useStackedLayout ? styles.accordionStacked : styles.row,
          styles.gap12,
          { minHeight: accordionMinHeight },
        ]}
        testID={`test:id/accordion-${section.toLowerCase()}`}
      >
        <View style={[styles.row, styles.gap12, useStackedLayout && styles.accordionStackedLeft]}>
          <ScalableIcon name={icon} size={18} color={colors.subText} />
          <BodyMediumText>{title}</BodyMediumText>
        </View>
        <View style={[styles.row, styles.flex, useStackedLayout && styles.accordionStackedRight]}>
          {isExpanded ? ExpandedComponent : CollapsedComponent}
          <ScalableIcon name={isExpanded ? "chevron-down" : "chevron-forward"} size={20} color={colors.text} />
        </View>
      </PressableWithFeedback>
      <AnimatedHeightView>{isExpanded && children}</AnimatedHeightView>
    </Card>
  );
};

const Footer = ({ onPressDelete, hasSaved, task, saveTask }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const createdAt = task?.created_at;
  const isDraft = task?.status === DRAFT;
  const [createdAtTextVisible, setCreatedAtTextVisible] = useState(Boolean(createdAt));

  useEffect(() => {
    setCreatedAtTextVisible(Boolean(createdAt));
  }, [createdAt]);

  useEffect(() => {
    if (hasSaved) setCreatedAtTextVisible(false);
  }, [hasSaved]);

  return (
    <View style={[styles.footer, styles.row, styles.gap12, { borderColor: colors.separator }]}>
      {isDraft && <SmallButton title={t("common.accept")} onPress={() => saveTask(task)} primary />}
      <View style={styles.flex}>
        {hasSaved ? (
          <Animated.View entering={FadeIn.duration(100)} style={[styles.row, styles.gap4]}>
            <ScalableIcon name="checkmark" size={16} color={colors.text} />
            <BodySmallText color={colors.text}>{t("common.saved")}</BodySmallText>
          </Animated.View>
        ) : (
          createdAtTextVisible && (
            <BodySmallText color={colors.subText}>
              {t("common.created")} {formatDateFromNow(createdAt)}
            </BodySmallText>
          )
        )}
      </View>
      <PressableWithFeedback onPress={onPressDelete} testID="test:id/delete-task" style={styles.pressable}>
        <ScalableIcon name="trash" size={22} color={colors.subText} />
      </PressableWithFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap4: { gap: 4 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  overflowVisible: { overflow: "visible" },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  titleRow: {
    paddingLeft: 16,
  },
  titleFieldInput: {
    fontSize: 18,
    fontWeight: "bold",
    minHeight: 48,
    textAlignVertical: "center",
  },
  inputPlaceholder: {
    padding: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  subtaskCheckboxContainer: {
    marginLeft: 16,
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  subtaskAddLabel: {
    includeFontPadding: false,
  },
  subtaskItem: {
    paddingHorizontal: 16,
    marginTop: -1, // compensate for separator
  },
  pressable: {
    padding: 8,
    margin: -8,
  },
  statusSelectorContainer: {
    alignSelf: "flex-start",
  },
  flexWrap: {
    flexWrap: "wrap",
  },
  accordionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  accordionStacked: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 8,
  },
  accordionStackedLeft: {
    flexGrow: 0,
  },
  accordionStackedRight: {
    marginLeft: 0,
    alignSelf: "flex-start",
  },
  tag: {
    borderRadius: 100,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  footer: {
    paddingHorizontal: 20,
    borderTopWidth: 1,
    minHeight: 44,
  },
});
