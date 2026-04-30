import React, { useRef, memo, useState, useMemo, useEffect, useCallback } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { PressableWithFeedback, BodyMediumText, BodySmallText, BodyXSmallText, FullPageLoading } from "@/components";
import { TaskItem } from "./TaskItem";
import { useFetchTodos } from "@/hooks/use-todos";
import { useTheme } from "@react-navigation/native";
import {
  TASK_STATUS,
  TASK_LIST_ORDER,
  TASK_LIST_GROUPING,
  NOT_STARTED_AND_IN_PROGRESS,
  getTOPScore,
  filterTasks,
} from "@/utils/toDos";
import { tasksSelector, unfetchedTasksCountsSelector } from "@/selectors/UserSelectors";
import { useSelector } from "react-redux";
import { draftTodosSelector } from "@/reducers/UserReducer";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useTranslation } from "react-i18next";

const { NOT_STARTED, IN_PROGRESS, COMPLETED, DRAFT } = TASK_STATUS;
const { GROUPED_TOGETHER, SEPARATE } = TASK_LIST_GROUPING;

const SECTION_TYPES = {
  [NOT_STARTED]: [NOT_STARTED],
  [IN_PROGRESS]: [IN_PROGRESS],
  [NOT_STARTED_AND_IN_PROGRESS]: [NOT_STARTED, IN_PROGRESS],
  [COMPLETED]: [COMPLETED],
  [DRAFT]: [DRAFT],
};

const GROUPING_SECTIONS = {
  [GROUPED_TOGETHER]: [DRAFT, NOT_STARTED_AND_IN_PROGRESS, COMPLETED],
  [SEPARATE]: [DRAFT, IN_PROGRESS, NOT_STARTED, COMPLETED],
};

export const TaskList = memo(function TaskList({
  listGrouping,
  listOrder,
  expandedSections,
  setExpandedSections,
  perspirationFilter,
  tagFilter,
  openRescheduleModal,
  timeHorizonFilter,
  ...props
}) {
  const tasks = useSelector(tasksSelector);
  const unfetchedCounts = useSelector(unfetchedTasksCountsSelector);
  const draftTodos = useSelector(draftTodosSelector);
  const lastRefreshedAt = useRef(0);
  const refreshPeriod = 1000 * 60 * 10; // 10 minutes

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedTasks, setDisplayedTasks] = useState(tasks);
  const expandedSectionsRef = useRef(expandedSections);
  const listSectionsTypes = GROUPING_SECTIONS[listGrouping];

  const isPerspirationFilterActive = perspirationFilter !== null;
  const isTagFilterActive = tagFilter.length > 0;

  const hideCounts = isPerspirationFilterActive || isTagFilterActive;

  // Set up hooks for fetching tasks
  // TODO: when filters are selected, fetch more tasks that specifically match the filters
  const useFetchNotStarted = useFetchTodos(NOT_STARTED, listOrder);
  const useFetchInProgress = useFetchTodos(IN_PROGRESS, listOrder);
  const useFetchCompleted = useFetchTodos(COMPLETED, listOrder);

  const fetchTodosHooks = useMemo(
    () => ({ [NOT_STARTED]: useFetchNotStarted, [IN_PROGRESS]: useFetchInProgress, [COMPLETED]: useFetchCompleted }),
    [useFetchNotStarted, useFetchInProgress, useFetchCompleted],
  );

  // Keep an identical ref, so that the value can be accessed imperatively without causing re-renders
  useEffect(() => {
    expandedSectionsRef.current = expandedSections;
  }, [expandedSections]);

  // Don't update list until all new tasks have come in
  useEffect(() => {
    if (!isRefreshing) {
      setDisplayedTasks([...tasks, ...draftTodos]);
    }
  }, [tasks, draftTodos, isRefreshing]);

  const refreshAll = useCallback(() => {
    setIsRefreshing(true);
    Promise.all(Object.values(fetchTodosHooks).map((methods) => methods.refresh())).finally(() => {
      setIsRefreshing(false);
    });
  }, [fetchTodosHooks]);

  const canLoadMore = useMemo(() => {
    const displayedStatuses = expandedSections.flatMap((sectionType) => SECTION_TYPES[sectionType] || []);
    return displayedStatuses.some((status) => fetchTodosHooks[status]?.canLoadMore);
  }, [expandedSections, fetchTodosHooks]);

  // Refresh when list order changes
  useEffect(() => {
    if (canLoadMore) {
      refreshAll();
    }
  }, [listOrder]);

  // Refresh periodically when the tab is focused
  useFocusEffect(() => {
    const lastRefreshAge = Date.now() - lastRefreshedAt.current;
    if (lastRefreshAge > refreshPeriod) {
      lastRefreshedAt.current = Date.now();
      refreshAll();
    }
  });

  const loadMore = () => {
    const displayedStatuses = expandedSections.flatMap((sectionType) => SECTION_TYPES[sectionType] || []);
    if (!canLoadMore) {
      return;
    }

    setIsLoadingMore(true);
    Promise.all(
      Object.entries(fetchTodosHooks).map(
        ([status, methods]) => displayedStatuses.includes(status) && methods.loadMore(),
      ),
    ).finally(() => {
      setIsLoadingMore(false);
    });
  };

  const sortSection = useCallback(
    (data, sectionType) => {
      return data.sort((a, b) => {
        const [topScoreA, topScoreB] = [a, b].map((task) => getTOPScore(task));
        const [updatedAtA, updatedAtB] = [a, b].map((task) =>
          new Date(task?.updated_at || task?.created_at || Date.now()).getTime(),
        );

        if (sectionType === COMPLETED) return updatedAtB - updatedAtA;

        if (topScoreA && topScoreB) {
          if (topScoreA !== topScoreB) {
            return (topScoreA - topScoreB) * (listOrder === TASK_LIST_ORDER.ASC ? 1 : -1);
          } else {
            return (a.id || "").localeCompare(b.id || "");
          }
        }
        return 0;
      });
    },
    [listOrder],
  );

  const sectionsData = useMemo(() => {
    const filtered = filterTasks(displayedTasks, { perspirationFilter, tagFilter, timeHorizonFilter });

    const fetchedCounts = { [NOT_STARTED]: 0, [IN_PROGRESS]: 0, [COMPLETED]: 0, [DRAFT]: 0 };
    displayedTasks.forEach((task) => (fetchedCounts[task.status] += 1));

    const counts = {};
    Object.values(TASK_STATUS).forEach((status) => {
      counts[status] = fetchedCounts[status] + (unfetchedCounts[status] || 0);
    });

    const sectionItems = listSectionsTypes.flatMap((sectionType) => {
      const isExpanded = expandedSections.includes(sectionType);
      const isEmpty = !filtered.some((task) => sectionType.includes(task.status));

      const sectionHeader = { isSectionHeader: true, sectionType, isExpanded, count: counts[sectionType] };

      if (isEmpty) return [];

      if (!isExpanded) return [sectionHeader];

      const sectionData = filtered.filter((task) => sectionType.includes(task.status));
      const sortedSectionData = sortSection(sectionData, sectionType);
      return [sectionHeader, ...sortedSectionData];
    });

    return { sections: sectionItems, filteredTasksCount: filtered.length };
  }, [
    displayedTasks,
    sortSection,
    listSectionsTypes,
    expandedSections,
    perspirationFilter,
    tagFilter,
    unfetchedCounts,
    timeHorizonFilter,
  ]);

  const { sections, filteredTasksCount } = sectionsData;
  const isFilteredEmpty = filteredTasksCount === 0;

  const isEmpty = displayedTasks.length === 0;
  const isReallyEmpty = displayedTasks.length === 0 && tasks.length === 0;

  return (
    <>
      <FlatList
        data={sections}
        renderItem={({ item }) =>
          item.isSectionHeader ? (
            <SectionHeader {...item} setExpandedSections={setExpandedSections} hideCounts={hideCounts} />
          ) : (
            <TaskItem
              {...item}
              showTags
              enableSwipe
              showStatus={listGrouping === GROUPED_TOGETHER && item?.status !== COMPLETED}
              expandedSectionsRef={expandedSectionsRef}
              openRescheduleModal={openRescheduleModal}
            />
          )
        }
        ListFooterComponent={!isEmpty && <ListFooter isLoadingMore={isLoadingMore} />}
        ListEmptyComponent={!isRefreshing && (isReallyEmpty || isFilteredEmpty) && <EmptyList />}
        keyExtractor={(item) => (item?.isSectionHeader ? item.sectionType : item.id)}
        style={styles.flex}
        contentContainerStyle={styles.contentContainer}
        refreshing={isRefreshing && !isEmpty}
        onRefresh={() => refreshAll()}
        onEndReached={() => loadMore()}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        windowSize={5}
        {...props}
      />
      <FullPageLoading show={isRefreshing && isEmpty} />
    </>
  );
});

const SECTION_HEADER_TEST_IDS = {
  [COMPLETED]: "test:id/completed-section",
  [NOT_STARTED]: "test:id/not-started-section",
  [IN_PROGRESS]: "test:id/in-progress-section",
  [NOT_STARTED_AND_IN_PROGRESS]: "test:id/current-section",
  [DRAFT]: "test:id/draft-section",
};

const SectionHeader = memo(function SectionHeader({ sectionType, isExpanded, setExpandedSections, count, hideCounts }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const sectionText = {
    [NOT_STARTED]: t("toDos.notStarted"),
    [IN_PROGRESS]: t("toDos.inProgress"),
    [NOT_STARTED_AND_IN_PROGRESS]: t("toDos.current"),
    [COMPLETED]: t("toDos.completed"),
    [DRAFT]: t("toDos.drafts"),
  };

  const toggleExpanded = () => {
    setExpandedSections((prev) => {
      if (prev.includes(sectionType)) {
        return prev.filter((s) => s !== sectionType);
      } else {
        return [...prev, sectionType];
      }
    });
  };

  return (
    <PressableWithFeedback
      onPress={toggleExpanded}
      style={[styles.row, styles.sectionHeader]}
      testID={SECTION_HEADER_TEST_IDS[sectionType]}
    >
      <Icon name={`chevron-${isExpanded ? "down" : "forward"}`} size={14} color={colors.text} />
      <BodySmallText>{sectionText[sectionType]}</BodySmallText>
      {!hideCounts && <BodyXSmallText weight="700">{count}</BodyXSmallText>}
    </PressableWithFeedback>
  );
});

const ListFooter = ({ isLoadingMore }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.endOfListSpacer}>
      {isLoadingMore && <ActivityIndicator size="large" color={colors.text} />}
    </View>
  );
};

const EmptyList = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.endOfListSpacer}>
      <BodyMediumText center color={colors.subText}>
        {t("toDos.noTasksToShow")}
      </BodyMediumText>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentContainer: {
    gap: 8,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  endOfListSpacer: {
    alignItems: "center",
    justifyContent: "center",
    height: 64,
  },
  sectionHeader: {
    paddingHorizontal: 8,
    marginHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
});
