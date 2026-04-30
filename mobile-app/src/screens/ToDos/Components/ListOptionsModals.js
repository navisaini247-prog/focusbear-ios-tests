import React, { useMemo, useCallback, useState } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useFontScale } from "@/hooks/use-font-scale";
import {
  ModalHeader,
  BodySmallText,
  Group,
  SheetModal,
  MenuItem,
  BodyMediumText,
  PressableWithFeedback,
  SmallButton,
} from "@/components";
import {
  TASK_LIST_ORDER,
  TASK_LIST_GROUPING,
  PERSPIRATION_FILTER,
  TASK_STATUS,
  NOT_STARTED_AND_IN_PROGRESS,
  TIME_HORIZON_FILTER,
} from "@/utils/toDos";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { tasksSelector } from "@/selectors/UserSelectors";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { postHogCapture } from "@/utils/Posthog";
import { useTheme } from "@react-navigation/native";
import { FOCUS_BEAR_SPOON_URL } from "@/constants";
const { ASC, DESC } = TASK_LIST_ORDER;
const { GROUPED_TOGETHER, SEPARATE } = TASK_LIST_GROUPING;
const { NOT_STARTED, IN_PROGRESS, DRAFT } = TASK_STATUS;

export const ListSortGroupModal = ({
  isVisible,
  setIsVisible,
  listOrder,
  setListOrder,
  listGrouping,
  setListGrouping,
  setExpandedSections,
}) => {
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();

  const toggleListGrouping = () => {
    const newListGrouping = listGrouping === SEPARATE ? GROUPED_TOGETHER : SEPARATE;
    const newExpandedSections =
      newListGrouping === SEPARATE ? [NOT_STARTED, IN_PROGRESS, DRAFT] : [NOT_STARTED_AND_IN_PROGRESS, DRAFT];

    setListGrouping(newListGrouping);
    setExpandedSections(newExpandedSections);
  };

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      HeaderComponent={<ModalHeader title={t("toDos.listOptions")} />}
    >
      <View style={styles.container}>
        <View style={styles.gap8}>
          <BodySmallText weight="700">{t("toDos.sortBy")}</BodySmallText>
          <Group>
            <MenuItem
              type="radio"
              title={t("toDos.lowToHigh")}
              isSelected={listOrder === ASC}
              isLargeFontScale={isLargeFontScale}
              onPress={() => setTimeout(() => setListOrder(ASC), 0)}
            />
            <MenuItem
              type="radio"
              title={t("toDos.highToLow")}
              isSelected={listOrder === DESC}
              isLargeFontScale={isLargeFontScale}
              onPress={() => setTimeout(() => setListOrder(DESC), 0)}
            />
          </Group>
        </View>

        <View style={styles.gap8}>
          <BodySmallText weight="700">{t("toDos.groupBy")}</BodySmallText>
          <MenuItem
            type="switch"
            title={t("toDos.groupedTogether")}
            isSelected={listGrouping === GROUPED_TOGETHER}
            isLargeFontScale={isLargeFontScale}
            onPress={() => setTimeout(toggleListGrouping, 0)}
          />
        </View>
      </View>
    </SheetModal>
  );
};

export const PerspirationFilterModal = ({ isVisible, setIsVisible, perspirationFilter, setPerspirationFilter }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isLargeFontScale } = useFontScale();

  const onPressPerspirationFilter = useCallback(
    (filter) => {
      setIsVisible(false);
      setTimeout(() => setPerspirationFilter(filter), 0);
      if (filter) {
        postHogCapture(POSTHOG_EVENT_NAMES.TODOS_USE_PERSPIRATION_FILTER);
      }
    },
    [setPerspirationFilter, setIsVisible],
  );

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      HeaderComponent={<ModalHeader title={t("toDos.filterByPerspiration")} />}
    >
      <View style={styles.container}>
        <BodyMediumText>{t("toDos.spoonsDesc")}</BodyMediumText>
        <PressableWithFeedback
          testID="test:id/learn-about-spoon-theory"
          onPress={() => Linking.openURL(FOCUS_BEAR_SPOON_URL)}
          style={styles.flexStart}
        >
          <BodySmallText underline color={colors.primary}>
            {t("toDos.learnAboutSpoonTheory")}
          </BodySmallText>
        </PressableWithFeedback>
        <Group>
          <MenuItem
            type="radio"
            title={t("toDos.lowSpoons")}
            description={`${t("toDos.perspirationLevel")} 0 - 3`}
            isSelected={perspirationFilter === PERSPIRATION_FILTER.LOW_SPOONS}
            isLargeFontScale={isLargeFontScale}
            onPress={() => onPressPerspirationFilter(PERSPIRATION_FILTER.LOW_SPOONS)}
          />
          <MenuItem
            type="radio"
            title={t("toDos.fullSpoons")}
            description={`${t("toDos.perspirationLevel")} 4 - 10`}
            isSelected={perspirationFilter === PERSPIRATION_FILTER.FULL_SPOONS}
            isLargeFontScale={isLargeFontScale}
            onPress={() => onPressPerspirationFilter(PERSPIRATION_FILTER.FULL_SPOONS)}
          />
          <MenuItem
            title={t("toDos.noFilter")}
            type="radio"
            isSelected={perspirationFilter === null}
            isLargeFontScale={isLargeFontScale}
            onPress={() => onPressPerspirationFilter(null)}
          />
        </Group>
      </View>
    </SheetModal>
  );
};

export const TagFilterModal = ({ isVisible, setIsVisible, tagFilter, setTagFilter }) => {
  const { t } = useTranslation();
  const { isLargeFontScale } = useFontScale();

  const tasks = useSelector(tasksSelector);

  const existingTags = useMemo(() => {
    return (tasks || [])
      .map((_task) => _task?.tags || [])
      .flat()
      .filter((tag, index, tags) => index === tags.findIndex((_tag) => _tag.id === tag.id));
  }, [tasks]);

  const onPressTag = useCallback(
    (tag) => {
      const alreadyHasTag = tagFilter.some((_tag) => _tag?.id === tag?.id);
      if (alreadyHasTag) {
        setTimeout(() => setTagFilter((prev) => prev.filter((_tag) => _tag?.id !== tag?.id)), 0);
      } else {
        setTimeout(() => setTagFilter((prev) => [...(prev || []), tag]), 0);
        postHogCapture(POSTHOG_EVENT_NAMES.TODOS_USE_PROJECT_FILTER);
      }
    },
    [tagFilter, setTagFilter],
  );

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      HeaderComponent={<ModalHeader title={t("toDos.filterByProject")} />}
    >
      <View style={styles.container}>
        <Group>
          {existingTags.map((tag) => (
            <MenuItem
              key={tag?.id}
              type="checkmark"
              title={tag.text}
              isSelected={tagFilter.some((_tag) => _tag?.id === tag?.id)}
              isLargeFontScale={isLargeFontScale}
              onPress={() => onPressTag(tag)}
            />
          ))}

          <MenuItem
            key="no-filter"
            type="checkmark"
            title={t("toDos.noFilter")}
            isSelected={tagFilter.length === 0}
            isLargeFontScale={isLargeFontScale}
            onPress={() => setTagFilter([])}
          />
        </Group>
      </View>
    </SheetModal>
  );
};

const MODAL_DISMISS_ANIMATION_DURATION_MS = 300;

const TIME_HORIZON_OPTIONS = [
  {
    filter: TIME_HORIZON_FILTER.OVERDUE,
    translationKey: "toDos.overdue",
    postHogEvent: POSTHOG_EVENT_NAMES.TODOS_USE_OVERDUE_TIME_FILTER,
  },
  {
    filter: TIME_HORIZON_FILTER.TODAY,
    translationKey: "common.today",
    postHogEvent: POSTHOG_EVENT_NAMES.TODOS_USE_TODAY_TIME_FILTER,
  },
  {
    filter: TIME_HORIZON_FILTER.TOMORROW,
    translationKey: "common.tomorrow",
    postHogEvent: POSTHOG_EVENT_NAMES.TODOS_USE_TOMORROW_TIME_FILTER,
  },
  {
    filter: TIME_HORIZON_FILTER.THIS_WEEK,
    translationKey: "toDos.thisWeek",
    postHogEvent: POSTHOG_EVENT_NAMES.TODOS_USE_THIS_WEEK_TIME_FILTER,
  },
  {
    filter: TIME_HORIZON_FILTER.NEXT_WEEK,
    translationKey: "toDos.nextWeek",
    postHogEvent: POSTHOG_EVENT_NAMES.TODOS_USE_NEXT_WEEK_TIME_FILTER,
  },
  {
    filter: TIME_HORIZON_FILTER.LATER,
    translationKey: "common.later",
    postHogEvent: POSTHOG_EVENT_NAMES.TODOS_USE_LATER_TIME_FILTER,
  },
];

export const TimeHorizonFilterModal = ({ isVisible, setIsVisible, timeHorizonFilter, setTimeHorizonFilter }) => {
  const { t } = useTranslation();

  const onPressTimeHorizonFilter = useCallback(
    (filter, postHogEvent) => {
      setIsVisible(false);
      setTimeout(() => setTimeHorizonFilter(filter), 0);
      if (filter) {
        postHogCapture(postHogEvent);
      }
    },
    [setTimeHorizonFilter, setIsVisible],
  );

  return (
    <SheetModal
      isVisible={isVisible}
      onCancel={() => setIsVisible(false)}
      HeaderComponent={<ModalHeader title={t("toDos.filterByDueDate")} />}
    >
      <View style={styles.container}>
        <Group>
          {TIME_HORIZON_OPTIONS.map(({ filter, translationKey, postHogEvent }) => (
            <MenuItem
              key={filter}
              type="radio"
              title={t(translationKey)}
              isSelected={timeHorizonFilter === filter}
              onPress={() => {
                onPressTimeHorizonFilter(filter, postHogEvent);
              }}
            />
          ))}
          <MenuItem
            title={t("toDos.noFilter")}
            type="radio"
            isSelected={timeHorizonFilter === null}
            onPress={() => onPressTimeHorizonFilter(null)}
          />
        </Group>
      </View>
    </SheetModal>
  );
};

export const AllFilterOptions = ({
  isVisible,
  setIsVisible,
  perspirationFilter,
  setPerspirationFilter,
  tagFilter,
  setTagFilter,
  timeHorizonFilter,
  setTimeHorizonFilter,
}) => {
  const { t } = useTranslation();
  const [perspirationFilterModalVisible, setPerspirationFilterModalVisible] = useState(false);
  const isPerspirationFilterActive = perspirationFilter !== null;

  const [tagFilterModalVisible, setTagFilterModalVisible] = useState(false);
  const isTagFilterActive = tagFilter.length > 0;

  const [timeHorizonFilterVisible, setTimeHorizonFilterVisible] = useState(false);
  const isTimeHorizonFilterActive = timeHorizonFilter !== null;

  const isAnyFilterActive = isPerspirationFilterActive || isTagFilterActive || isTimeHorizonFilterActive;

  const perspirationFilterText = (() => {
    if (!isPerspirationFilterActive) {
      return t("toDos.perspiration.perspiration");
    } else if (perspirationFilter === PERSPIRATION_FILTER.LOW_SPOONS) {
      return t("toDos.lowSpoons");
    } else if (perspirationFilter === PERSPIRATION_FILTER.FULL_SPOONS) {
      return t("toDos.fullSpoons");
    }
  })();

  const tagFilterText = (() => {
    if (!isTagFilterActive) {
      return t("toDos.project");
    } else if (tagFilter.length === 1) {
      return tagFilter[0].text;
    } else {
      return `${tagFilter.length} ${t("toDos.projects")}`;
    }
  })();

  const timeHorizonFilterText = useMemo(() => {
    if (!isTimeHorizonFilterActive) {
      return t("toDos.toDosDueDate");
    }
    const filterTextMap = {
      [TIME_HORIZON_FILTER.TODAY]: t("common.today"),
      [TIME_HORIZON_FILTER.OVERDUE]: t("toDos.overdue"),
      [TIME_HORIZON_FILTER.TOMORROW]: t("common.tomorrow"),
      [TIME_HORIZON_FILTER.THIS_WEEK]: t("toDos.thisWeek"),
      [TIME_HORIZON_FILTER.NEXT_WEEK]: t("toDos.nextWeek"),
      [TIME_HORIZON_FILTER.LATER]: t("common.later"),
    };
    return filterTextMap[timeHorizonFilter] || t("toDos.toDosDueDate");
  }, [isTimeHorizonFilterActive, timeHorizonFilter, t]);

  const deleteAllFilters = () => {
    setPerspirationFilter(null);
    setTagFilter([]);
    setTimeHorizonFilter(null);
  };

  return (
    <>
      <SheetModal
        isVisible={isVisible}
        onCancel={() => setIsVisible(false)}
        HeaderComponent={
          <ModalHeader
            title={t("toDos.filterTasksBy")}
            rightContent={
              isAnyFilterActive ? (
                <SmallButton subtle testID="test:id/clear-all-filters" onPress={() => deleteAllFilters()}>
                  <BodySmallText>{t("common.clearAll")}</BodySmallText>
                </SmallButton>
              ) : null
            }
          />
        }
      >
        <View style={styles.container}>
          <Group>
            <MenuItem
              type="checkmark"
              showChevron
              isSelected={isPerspirationFilterActive}
              title={perspirationFilterText}
              icon="barbell"
              onPress={() => {
                setIsVisible(false);
                postHogCapture(POSTHOG_EVENT_NAMES.TODOS_FILTER_SELECTION_CHANGED, { filter: "perspiration" });
                setTimeout(() => setPerspirationFilterModalVisible(true), MODAL_DISMISS_ANIMATION_DURATION_MS);
              }}
            />
            <MenuItem
              type="checkmark"
              showChevron
              isSelected={isTagFilterActive}
              title={tagFilterText}
              icon="heart"
              onPress={() => {
                setIsVisible(false);
                postHogCapture(POSTHOG_EVENT_NAMES.TODOS_FILTER_SELECTION_CHANGED, { filter: "project" });
                setTimeout(() => setTagFilterModalVisible(true), MODAL_DISMISS_ANIMATION_DURATION_MS);
              }}
            />
            <MenuItem
              type="checkmark"
              showChevron
              isSelected={isTimeHorizonFilterActive}
              title={timeHorizonFilterText}
              icon="time"
              onPress={() => {
                setIsVisible(false);
                setTimeout(() => setTimeHorizonFilterVisible(true), MODAL_DISMISS_ANIMATION_DURATION_MS);
              }}
            />
          </Group>
        </View>
      </SheetModal>
      <PerspirationFilterModal
        isVisible={perspirationFilterModalVisible}
        setIsVisible={setPerspirationFilterModalVisible}
        perspirationFilter={perspirationFilter}
        setPerspirationFilter={setPerspirationFilter}
      />

      <TagFilterModal
        isVisible={tagFilterModalVisible}
        setIsVisible={setTagFilterModalVisible}
        tagFilter={tagFilter}
        setTagFilter={setTagFilter}
      />
      <TimeHorizonFilterModal
        isVisible={timeHorizonFilterVisible}
        setIsVisible={setTimeHorizonFilterVisible}
        timeHorizonFilter={timeHorizonFilter}
        setTimeHorizonFilter={setTimeHorizonFilter}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gap8: { gap: 8 },
  container: {
    padding: 16,
    paddingTop: 12,
    gap: 16,
  },
  flexStart: {
    alignSelf: "flex-start",
  },
});
