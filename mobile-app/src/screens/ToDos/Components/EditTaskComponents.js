import React, { useState, useCallback, useMemo, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import {
  Card,
  Group,
  TextField,
  SmallButton,
  MenuItem,
  BodySmallText,
  BodyMediumText,
  HeadingMediumText,
  HeadingLargeText,
  HeadingSmallText,
} from "@/components";
import Slider from "@react-native-community/slider";
import Icon from "react-native-vector-icons/Ionicons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useTheme } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  DUE_IN,
  OUTCOME as OUTCOMES,
  PERSPIRATION as PERSPIRATIONS,
  DUE_IN_TIME,
  getDueInCategory,
  getTOPScore,
  convertDateToDueIn,
  convertDueInToDate,
  mapPerspirationLevelToMinutes,
  timePressureScore,
} from "@/utils/toDos";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { formatDate, formatDateFromNow } from "@/utils/TimeMethods";
import { tasksSelector } from "@/selectors/UserSelectors";
import { projectTagsSelector, projectTagsLoadingSelector } from "@/selectors/GlobalSelectors";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { postHogCapture } from "@/utils/Posthog";
import { checkIsAndroid } from "@/utils/PlatformMethods";
import { fetchProjectTags } from "@/actions/GlobalActions";

const subtractTimezoneOffset = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);

export const DueDateMenu = ({ task, setTask, onSubmit, isReschedule }) => {
  const { t } = useTranslation();
  const locale = t("baseLanguage", { defaultValue: "en" });
  const dueInCategory = getDueInCategory(convertDateToDueIn(task?.due_date));
  const isCustomDate = !dueInCategory;

  const formatWeekDay = new Intl.DateTimeFormat(locale, { weekday: "short" }).format;

  const formatItemDate = (key) => {
    const date = convertDueInToDate(DUE_IN_TIME[key]);
    if (key === DUE_IN.TODAY) {
      return null;
    } else if ([DUE_IN.TOMORROW, DUE_IN.A_FEW_DAYS, DUE_IN.NEXT_WEEK].includes(key)) {
      // Display just the weekday for dates within the next week
      return formatWeekDay(date);
    } else {
      // Display full date otherwise
      return formatDate(date);
    }
  };

  const items = {
    [DUE_IN.TODAY]: t("common.today"),
    [DUE_IN.TOMORROW]: t("common.tomorrow"),
    [DUE_IN.A_FEW_DAYS]: t("toDos.dueIn.aFewDays"),
    [DUE_IN.NEXT_WEEK]: t("toDos.dueIn.nextWeek"),
    [DUE_IN.TWO_WEEKS]: t("toDos.dueIn.twoWeeks"),
    [DUE_IN.A_MONTH]: t("toDos.dueIn.aMonth"),
    [DUE_IN.A_YEAR]: t("toDos.dueIn.aYear"),
  };

  const rescheduleItems = {
    [DUE_IN.TOMORROW]: t("common.tomorrow"),
    [DUE_IN.A_FEW_DAYS]: t("toDos.dueIn.aFewDays"),
    [DUE_IN.NEXT_WEEK]: t("toDos.dueIn.nextWeek"),
    [DUE_IN.TWO_WEEKS]: t("toDos.dueIn.twoWeeks"),
    [DUE_IN.A_MONTH]: t("toDos.dueIn.aMonth"),
  };

  const onPressItem = (option) => {
    setTask((prev) => ({ ...prev, due_date: convertDueInToDate(DUE_IN_TIME[option]) }));
    postHogCapture(POSTHOG_EVENT_NAMES.TODOS_ADJUST_DUE_DATE);
    onSubmit();
  };

  const onSetDatepicker = ({ date, submit }) => {
    date.setHours(0, 0, 0, 0);
    setTask((prev) => ({ ...prev, due_date: date }));
    postHogCapture(POSTHOG_EVENT_NAMES.TODOS_ADJUST_DUE_DATE);
    submit && onSubmit();
  };

  const openAndroidDateTimePicker = () => {
    DateTimePickerAndroid.open({
      mode: "date",
      value: subtractTimezoneOffset(new Date(task?.due_date || Date.now())),
      // event.type === "set" -> user pressed "OK"
      onChange: (event, date) => event.type === "set" && onSetDatepicker({ date, submit: true }),
    });
  };

  return (
    <Group style={styles.container}>
      {Object.entries(isReschedule ? rescheduleItems : items).map(([key, label]) => (
        <MenuItem
          key={key}
          title={label}
          subtitle={formatItemDate(key)}
          description={key === DUE_IN.A_YEAR && <DueInAYearDescription />}
          onPress={() => onPressItem(key)}
          type={isReschedule ? null : "checkmark"}
          isSelected={key === dueInCategory}
          style={!isReschedule && styles.compactDueDateItem}
          isLargeFontScale
        />
      ))}

      {checkIsAndroid() ? (
        <MenuItem
          showChevron
          title={`${t("toDos.exactDate")}...`}
          subtitle={isCustomDate && !isReschedule ? formatDateFromNow(task?.due_date) : null}
          onPress={openAndroidDateTimePicker}
          type={isReschedule ? null : "checkmark"}
          isSelected={isCustomDate}
          style={!isReschedule && styles.compactDueDateItem}
          isLargeFontScale
        />
      ) : (
        <MenuItem
          hideChevron
          disabledWithoutStyleChange
          type={isReschedule ? null : "checkmark"}
          isSelected={isCustomDate}
          style={[styles.iOSDatePickerContainer, !isReschedule && styles.compactDueDateItem]}
          isLargeFontScale
        >
          <View style={styles.flex}>
            <HeadingSmallText>{t("toDos.exactDate")}</HeadingSmallText>
          </View>
          <DateTimePicker
            value={new Date(task?.due_date || Date.now())}
            onChange={(event, date) => {
              if (event.type === "set") onSetDatepicker({ date, submit: false }); // user tapped on a date
              if (event.type === "dismissed") onSubmit(); // picker dismissed. Beware `date` won't have the newly selected value
            }}
            mode="date"
          />
        </MenuItem>
      )}
    </Group>
  );
};

const DueInAYearDescription = () => {
  const { t } = useTranslation();
  return <BodySmallText size={10}>{t("toDos.dueIn.aYearDescription")}</BodySmallText>;
};

export const PrioritizeMenu = ({ task, setTask, onPressDueDate }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [hasAdjustedPriorities, setHasAdjustedPriorities] = useState(false);

  const outcomeLabels = useMemo(
    () => ({
      [OUTCOMES.WHO_CARES]: t("toDos.outcome.whoCares"),
      [OUTCOMES.KIND_OF_IMPORTANT]: t("toDos.outcome.kindOfImportant"),
      [OUTCOMES.BIG_DEAL]: t("toDos.outcome.bigDeal"),
      [OUTCOMES.HUGE]: t("toDos.outcome.huge"),
      [OUTCOMES.MIND_BLOWING]: t("toDos.outcome.mindBlowing"),
    }),
    [t],
  );

  const perspirationLabels = useMemo(
    () => ({
      [PERSPIRATIONS.FIVE_MINUTE_JOB]: t("toDos.perspiration.fiveMinuteJob"),
      [PERSPIRATIONS.FIFTEEN_MINUTES_WORK]: t("toDos.perspiration.fifteenMinutesWork"),
      [PERSPIRATIONS.HALF_AN_HOUR]: t("toDos.perspiration.halfAnHour"),
      [PERSPIRATIONS.AN_HOUR]: t("toDos.perspiration.anHour"),
      [PERSPIRATIONS.HALF_A_DAY]: t("toDos.perspiration.halfADay"),
      [PERSPIRATIONS.A_DAY]: t("toDos.perspiration.aDay"),
      [PERSPIRATIONS.A_WEEK]: t("toDos.perspiration.aWeek"),
    }),
    [t],
  );

  const outcomeLabel = useMemo(() => {
    const found = Object.entries(OUTCOMES).find(([_, value]) => value >= task?.outcome);
    if (!found) return outcomeLabels[Object.values(OUTCOMES)[0]] || "";
    const [_, value] = found;
    return outcomeLabels[value] || "";
  }, [outcomeLabels, task?.outcome]);

  const perspirationLabel = useMemo(() => {
    const found = Object.entries(PERSPIRATIONS).find(([_, value]) => value >= task?.perspiration_level);
    if (!found) return perspirationLabels[Object.values(PERSPIRATIONS)[0]] || "";
    const [_, value] = found;
    return perspirationLabels[value] || "";
  }, [perspirationLabels, task?.perspiration_level]);

  const TOPScore = Math.round(getTOPScore(task));

  // Memoize the timeline score calculation to avoid recalculating on every render
  const timelineScore = useMemo(() => {
    const effort = mapPerspirationLevelToMinutes(task?.perspiration_level);
    const t = timePressureScore(task?.due_date, effort);
    return Math.round(t * 10) / 10;
  }, [task?.perspiration_level, task?.due_date]);

  const onSliderChange = useCallback(
    (property, value) => {
      setTask((prev) => ({ ...prev, [property]: value }));
      if (!hasAdjustedPriorities) {
        postHogCapture(POSTHOG_EVENT_NAMES.TODOS_ADJUST_PRIORITIES);
        setHasAdjustedPriorities(true);
      }
    },
    [setTask, hasAdjustedPriorities],
  );

  return (
    <>
      <View style={[styles.container, styles.gap12]}>
        <View style={[styles.row, styles.gap8]}>
          <View style={styles.gap8}>
            <BodySmallText />
            <HeadingLargeText>T</HeadingLargeText>
          </View>
          <View style={[styles.gap8, styles.flex]}>
            <BodySmallText>{t("toDos.timeline")}</BodySmallText>
            <MenuItem onPress={() => onPressDueDate()} isLargeFontScale>
              <HeadingMediumText weight={700}>{timelineScore}</HeadingMediumText>
              <BodyMediumText>{formatDateFromNow(task?.due_date)}</BodyMediumText>
            </MenuItem>
          </View>
        </View>

        <View style={[styles.row, styles.gap8]}>
          <View style={styles.gap8}>
            <BodySmallText />
            <HeadingLargeText>O</HeadingLargeText>
          </View>
          <View style={[styles.gap8, styles.flex]}>
            <BodySmallText>{`${t("toDos.outcome.outcome")}: ${outcomeLabel}`}</BodySmallText>
            <Card style={styles.row}>
              <View style={styles.prioratizationValueContainer}>
                <HeadingMediumText weight={700}>{task?.outcome}</HeadingMediumText>
              </View>
              <View style={styles.flex}>
                <CustomSlider value={task?.outcome} setValue={(value) => onSliderChange("outcome", value)} />
              </View>
            </Card>
          </View>
        </View>

        <View style={[styles.row, styles.gap8]}>
          <View style={styles.gap8}>
            <BodySmallText />
            <HeadingLargeText>P</HeadingLargeText>
          </View>
          <View style={[styles.gap8, styles.flex]}>
            <BodySmallText>{`${t("toDos.perspiration.perspiration")}: ${perspirationLabel}`}</BodySmallText>
            <Card style={styles.row}>
              <View style={styles.prioratizationValueContainer}>
                <HeadingMediumText weight={700}>{task?.perspiration_level}</HeadingMediumText>
              </View>
              <View style={styles.flex}>
                <CustomSlider
                  value={task?.perspiration_level}
                  setValue={(value) => onSliderChange("perspiration_level", value)}
                />
              </View>
            </Card>
          </View>
        </View>

        <View style={[styles.row, styles.gap8, styles.wrap, styles.justifyEnd]}>
          <BodyMediumText>{t("toDos.scoreCalculation")}</BodyMediumText>
          <Icon name="arrow-forward" size={14} color={colors.text} />
          <Text style={{ color: colors.text }}>
            <BodyMediumText weight="700">T</BodyMediumText>
            {" × "}
            <BodyMediumText weight="700">O</BodyMediumText>
            {" ÷ "}
            <BodyMediumText weight="700">P</BodyMediumText>
            {" = "}
          </Text>
          <View style={styles.prioratizationFinalScoreContainer}>
            <Badge value={TOPScore} />
          </View>
        </View>
      </View>
    </>
  );
};

const CustomSlider = ({ value, setValue }) => {
  const { colors } = useTheme();
  return (
    <Slider
      value={value || 0}
      onValueChange={setValue}
      minimumValue={1}
      maximumValue={10}
      step={1}
      minimumTrackTintColor={colors.primary}
    />
  );
};

export const Badge = ({ value, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.valueContainer, { backgroundColor: colors.secondary }, style]}>
      <BodySmallText>{value}</BodySmallText>
    </View>
  );
};

const MAX_FREQUENT_TAGS_TO_SHOW = 10;

/** Merge two tag arrays by id; tags in primary take precedence. Ensures selected tags always appear in lists. */
const mergeTagsById = (primary, secondary) => {
  const byId = new Map();
  (secondary || []).forEach((t) => t?.id && t?.text && byId.set(t.id, t));
  (primary || []).forEach((t) => t?.id && t?.text && byId.set(t.id, t));
  return Array.from(byId.values());
};

export const TagsMenu = ({ task, setTask }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const tasks = useSelector(tasksSelector) || [];
  const apiTags = useSelector(projectTagsSelector);
  const isLoadingTags = useSelector(projectTagsLoadingSelector);
  const selectedTags = task?.tags || [];

  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    dispatch(fetchProjectTags());
  }, [dispatch]);

  const frequentlyUsedTags = useMemo(() => {
    const tagUsageCount = {};
    tasks.forEach((_task) => {
      (_task?.tags || []).forEach((tag) => {
        if (tag?.id && tag?.text) {
          tagUsageCount[tag.id] = {
            tag,
            count: (tagUsageCount[tag.id]?.count || 0) + 1,
          };
        }
      });
    });

    return Object.values(tagUsageCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_FREQUENT_TAGS_TO_SHOW)
      .map((item) => item.tag);
  }, [tasks]);

  const allAvailableTags = useMemo(
    () => mergeTagsById(selectedTags, apiTags.length > 0 ? apiTags : frequentlyUsedTags),
    [selectedTags, apiTags, frequentlyUsedTags],
  );

  const filteredTags = useMemo(() => {
    const searchLower = searchText.toLowerCase().trim();

    if (!searchLower) {
      return mergeTagsById(selectedTags, frequentlyUsedTags);
    }

    return allAvailableTags.filter((tag) => tag?.text?.toLowerCase().includes(searchLower)).slice(0, 20);
  }, [searchText, selectedTags, frequentlyUsedTags, allAvailableTags]);

  const onPressItem = useCallback(
    (tag) => {
      if (!tag?.id || !tag?.text) {
        return;
      }

      setTask((prev) => {
        const prevTags = prev?.tags || [];
        const alreadyHasTag = prevTags.some((_tag) => _tag?.id === tag?.id);
        if (alreadyHasTag) {
          return { ...prev, tags: prevTags.filter((_tag) => _tag?.id !== tag?.id) };
        } else {
          return { ...prev, tags: [...prevTags, tag] };
        }
      });
    },
    [setTask],
  );

  const addNewTag = useCallback(
    (text) => {
      const trimmedText = text.trim();
      if (!trimmedText) {
        return;
      }

      const existingTag = allAvailableTags.find((tag) => tag?.text?.toLowerCase() === trimmedText.toLowerCase());

      if (existingTag) {
        onPressItem(existingTag);
      } else {
        setTask((prev) => ({
          ...prev,
          tags: [...(prev?.tags || []), { id: uuidv4(), text: trimmedText }],
        }));
      }
      setSearchText("");
    },
    [setTask, allAvailableTags, onPressItem],
  );

  const showNoResults = searchText.trim() && filteredTags.length === 0 && !isLoadingTags;

  return (
    <View style={[styles.container, styles.tagMenuContainer, styles.gap8]}>
      <View style={styles.row}>
        <Icon name="search" size={18} color={colors.text} />
        <TextField
          placeholder={t("toDos.searchOrCreateProject")}
          transparent
          value={searchText}
          inputStyle={styles.subtaskInput}
          onChangeText={setSearchText}
          onSubmitEditing={({ nativeEvent: { text } }) => addNewTag(text)}
          submitBehavior="submit"
        />
        {isLoadingTags && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      <View style={[styles.tagListContainer, styles.gap8, styles.row]}>
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <TagButton
              key={tag?.id}
              {...tag}
              isSelected={selectedTags.some((_tag) => _tag?.id === tag?.id)}
              onPressItem={onPressItem}
            />
          ))
        ) : showNoResults ? (
          <BodyMediumText color={colors.subText}>
            {t("toDos.noMatchingProjects", { search: searchText.trim() })}
          </BodyMediumText>
        ) : !searchText.trim() && filteredTags.length === 0 ? (
          <BodyMediumText color={colors.subText}>{t("toDos.noExistingProjects")}</BodyMediumText>
        ) : null}
      </View>
    </View>
  );
};

const TagButton = ({ text, id, isSelected, onPressItem }) => {
  const { colors } = useTheme();

  return (
    <SmallButton
      onPress={() => onPressItem({ text, id })}
      style={styles.tagButton}
      title={text}
      primary={isSelected}
      renderLeftIcon={
        <Icon name={isSelected ? "checkmark" : "add"} color={isSelected ? colors.white : colors.text} size={18} />
      }
    />
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  justifyEnd: { justifyContent: "flex-end" },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  container: {
    padding: 16,
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  wrap: {
    flexWrap: "wrap",
  },
  valueContainer: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 16,
  },
  compactDueDateItem: {
    minHeight: 42,
  },
  iOSDatePickerContainer: {
    paddingVertical: 0,
    paddingRight: 0,
  },
  tagButton: {
    borderRadius: 100,
  },
  tagListContainer: {
    flexWrap: "wrap",
    paddingBottom: 8,
  },
  tagMenuContainer: {},
  prioratizationValueContainer: {
    minWidth: 24,
  },
  prioratizationFinalScoreContainer: {
    minWidth: 36,
    alignItems: "flex-start",
  },
});
