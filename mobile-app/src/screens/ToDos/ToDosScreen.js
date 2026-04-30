import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { SmallButton, PressableWithFeedback } from "@/components";
import { TaskList } from "./Components/TaskList";
import { AddTaskPanel } from "./Components/AddTaskPanel";
import { AllFilterOptions, ListSortGroupModal } from "./Components/ListOptionsModals";
import { RescheduleModal } from "./Components/RescheduleModal";
import { OcrTodoModal } from "./Components/OcrTodoModal";
import { NotesModal } from "./Components/NotesModal";
import { withDelayRender } from "@/hooks/with-after-animation";
import Icon from "react-native-vector-icons/Ionicons";
import { useTheme } from "@react-navigation/native";
import { TASK_LIST_ORDER, TASK_LIST_GROUPING, TASK_STATUS } from "@/utils/toDos";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { useNavigation } from "@react-navigation/native";
import { NAVIGATION } from "@/constants/navigation";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setDraftTodos } from "@/actions/UserActions";
import { draftTodosSelector } from "@/reducers/UserReducer";
import normalizeDraft from "@/utils/todos/normalizeDraft";

const { NOT_STARTED, IN_PROGRESS, DRAFT } = TASK_STATUS;

export const ToDosScreen = withDelayRender(({ addTaskInputRef }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [listOptionsModalVisible, setListOptionsModalVisible] = useState(false);
  const [listOrder, setListOrder] = useState(TASK_LIST_ORDER.DESC);
  const [listGrouping, setListGrouping] = useState(TASK_LIST_GROUPING.SEPARATE);

  const [expandedSections, setExpandedSections] = useState([NOT_STARTED, IN_PROGRESS, DRAFT]);

  const [perspirationFilter, setPerspirationFilter] = useState(null);
  const isPerspirationFilterActive = perspirationFilter !== null;

  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const [tagFilter, setTagFilter] = useState([]);
  const isTagFilterActive = tagFilter.length > 0;

  const [timeHorizonFilter, setTimeHorizonFilter] = useState(null);
  const isTimeHorizonFilterActive = timeHorizonFilter !== null;

  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [taskIdToReschedule, setTaskIdToReschedule] = useState(null);

  const openRescheduleModal = useCallback((id) => {
    setTaskIdToReschedule(id);
    setRescheduleModalVisible(true);
  }, []);

  // OCR functionality
  const [ocrModalVisible, setOcrModalVisible] = useState(false);
  const [isImageProcessing, setIsImageProcessing] = useState(false);
  const draftTodos = useSelector(draftTodosSelector);

  // Notes functionality
  const [notesModalVisible, setNotesModalVisible] = useState(false);

  const handleOcrTodosExtracted = (todos) => {
    const normalizedTodos = Array.isArray(todos) ? todos.map(normalizeDraft) : [];
    dispatch(setDraftTodos([...draftTodos, ...normalizedTodos]));
  };

  const isAnyFilterActive = isPerspirationFilterActive || isTagFilterActive || isTimeHorizonFilterActive;

  return (
    <View style={styles.flex}>
      <View style={styles.headerRow}>
        <View style={styles.headerButtons}>
          <SmallButton
            subtle
            title={t("toDos.filterBy")}
            onPress={() => {
              postHogCapture(POSTHOG_EVENT_NAMES.TODOS_FILTER_MODAL_OPENED);
              setFilterModalVisible(true);
            }}
            primary={isAnyFilterActive}
            renderLeftIcon={<Icon name="filter" size={14} color={isAnyFilterActive ? colors.white : colors.subText} />}
          />

          <View style={styles.headerRight}>
            <PressableWithFeedback
              onPress={() => {
                postHogCapture(POSTHOG_EVENT_NAMES.TODOS_NOTES_MODAL_OPENED);
                setNotesModalVisible(true);
              }}
              style={styles.headerButton}
              testID="test:id/todos-notes-button"
            >
              <Icon name="document-text" size={22} color={colors.text} />
            </PressableWithFeedback>

            <PressableWithFeedback
              onPress={() => navigation.navigate(NAVIGATION.SearchTodosScreen)}
              testID="test:id/todos-search-button"
            >
              <Icon name="search" size={22} color={colors.text} accessible={false} />
            </PressableWithFeedback>
            <PressableWithFeedback
              onPress={() => setListOptionsModalVisible(true)}
              testID="test:id/todos-options-button"
            >
              <Icon name="ellipsis-vertical" size={22} color={colors.text} accessible={false} />
            </PressableWithFeedback>
          </View>
        </View>
      </View>

      <TaskList
        listOrder={listOrder}
        listGrouping={listGrouping}
        expandedSections={expandedSections}
        setExpandedSections={setExpandedSections}
        perspirationFilter={perspirationFilter}
        tagFilter={tagFilter}
        openRescheduleModal={openRescheduleModal}
        timeHorizonFilter={timeHorizonFilter}
      />

      <AddTaskPanel
        onOpenOcr={() => setOcrModalVisible(true)}
        onAudioTodosExtracted={handleOcrTodosExtracted}
        isImageProcessing={isImageProcessing}
        inputRef={addTaskInputRef}
      />

      <OcrTodoModal
        isVisible={ocrModalVisible}
        setIsVisible={setOcrModalVisible}
        onTodosExtracted={handleOcrTodosExtracted}
        onProcessingStateChange={setIsImageProcessing}
      />

      <RescheduleModal
        isVisible={rescheduleModalVisible}
        setIsVisible={setRescheduleModalVisible}
        taskId={taskIdToReschedule}
      />

      <ListSortGroupModal
        isVisible={listOptionsModalVisible}
        setIsVisible={setListOptionsModalVisible}
        listOrder={listOrder}
        setListOrder={setListOrder}
        listGrouping={listGrouping}
        setListGrouping={setListGrouping}
        setExpandedSections={setExpandedSections}
      />

      <AllFilterOptions
        isVisible={filterModalVisible}
        setIsVisible={setFilterModalVisible}
        perspirationFilter={perspirationFilter}
        setPerspirationFilter={setPerspirationFilter}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
        timeHorizonFilter={timeHorizonFilter}
        setTimeHorizonFilter={setTimeHorizonFilter}
      />

      <NotesModal isVisible={notesModalVisible} setIsVisible={setNotesModalVisible} />
    </View>
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  headerButtons: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
