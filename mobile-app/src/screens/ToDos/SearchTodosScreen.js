import React, { memo, useState, useCallback, useMemo } from "react";
import { View, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { BodyMediumText, BackButton, TextField } from "@/components";
import { TaskItem } from "./Components/TaskItem";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSearchTodos } from "@/hooks/use-todos";
import { useSelector } from "react-redux";
import { tasksSelector } from "@/selectors/UserSelectors";
import { draftTodosSelector } from "@/reducers/UserReducer";
import { useTheme } from "@react-navigation/native";
import { debounce } from "lodash";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

export const SearchTodosScreen = memo(function SearchTodosScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const tasks = useSelector(tasksSelector);
  const draftTodos = useSelector(draftTodosSelector);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { results, search, clearResults } = useSearchTodos();
  const searchTasks = useCallback((title) => search(title).finally(() => setIsRefreshing(false)), [search]);
  const debouncedSearch = useCallback(debounce(searchTasks, 500), [searchTasks]);

  const onSearchTextChange = useCallback(
    (text) => {
      setSearchText(text);
      debouncedSearch(text);
      if (text.trim()) {
        setIsRefreshing(true);
      } else {
        setIsRefreshing(false);
        clearResults();
      }
    },
    [debouncedSearch, clearResults],
  );

  const data = useMemo(() => {
    const trimmedSearch = searchText.trim().toLowerCase();
    if (!trimmedSearch) {
      return [];
    }

    const fetchedTodoTasks = tasks.filter((task) => results.includes(task.id));
    const matchingDraftToDos = draftTodos.filter((draft) => draft.title?.toLowerCase().includes(trimmedSearch));

    return [...fetchedTodoTasks, ...matchingDraftToDos];
  }, [results, tasks, draftTodos, searchText]);

  return (
    <View style={styles.flex}>
      <SafeAreaView
        edges={["top"]}
        style={[styles.screenHeaderContainer, { backgroundColor: colors.card, borderColor: colors.separator }]}
      >
        <View style={styles.screenHeaderContent}>
          <BackButton onPress={() => navigation.goBack()} style={styles.headerBackButton} />
          <TextField
            small
            value={searchText}
            onChangeText={onSearchTextChange}
            placeholder={t("toDos.searchTasks")}
            autoFocus
            style={styles.flex}
          />
        </View>
      </SafeAreaView>

      <FlatList
        data={data}
        renderItem={({ item }) => <TaskItem {...item} />}
        ListHeaderComponent={isRefreshing && <LoadingSpinner />}
        ListEmptyComponent={<EmptyList isRefreshing={isRefreshing} searchText={searchText} />}
        keyExtractor={(item) => item.id}
        style={styles.flex}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom }]}
      />
    </View>
  );
});

const LoadingSpinner = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.headerSpacer}>
      <ActivityIndicator size="large" color={colors.text} />
    </View>
  );
};

const EmptyList = ({ isRefreshing, searchText }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (isRefreshing || !searchText.trim()) return null;
  return (
    <View style={styles.headerSpacer}>
      <BodyMediumText center color={colors.subText}>
        {t("toDos.noTasksFound")}
      </BodyMediumText>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerSpacer: {
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
  screenHeaderContainer: {
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  screenHeaderContent: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBackButton: {
    marginLeft: -8,
  },
  contentContainer: {
    gap: 8,
    paddingTop: 12,
  },
});
