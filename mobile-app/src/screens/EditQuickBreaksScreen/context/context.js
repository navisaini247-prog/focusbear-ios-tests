import { useCallback, useState } from "react";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { useNavigation, useRoute } from "@react-navigation/native";
import { i18n } from "@/localization";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuid } from "uuid";
import { addErrorLog } from "@/utils/FileLogger";
import { PLATFORMS } from "@/constants/platforms";
import { userQuickBreaksSelector } from "@/selectors/UserSelectors";

export const useEditQuickBreaks = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const index = useRoute().params?.index;
  const habit = useRoute().params?.habit;

  const [quickBreakInfo, setQuickBreakInfo] = useState({
    id: habit?.id,
    name: habit?.name || (habit.labelLanguageKey ? i18n.t(`quickBreak.${habit.labelLanguageKey}`) : ""),
    minutes: Math.floor(habit?.duration_seconds / 60),
    seconds: habit?.duration_seconds % 60,
    videoUrl: habit?.video_urls?.[0] || "",
    emoji: habit?.emoji,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const existingQuickBreaks = useSelector(userQuickBreaksSelector);

  const updateUserSettings = useCallback(
    async (newQuickBreak) => {
      try {
        const updatedQuickBreaks =
          index !== undefined
            ? existingQuickBreaks.map((quickBreak, i) => (i === index ? newQuickBreak : quickBreak))
            : [newQuickBreak, ...existingQuickBreaks].slice(0, 3);
        await dispatch(postUserLocalDeviceSettings({ quickBreaks: updatedQuickBreaks }, PLATFORMS.MACOS));
        navigation.goBack();
        Toast.show({
          type: "success",
          text1: i18n.t("common.Success"),
          text2: i18n.t("quickBreak.saveQuickBreakSuccessfully"),
        });
      } catch (error) {
        addErrorLog("Error saving Quick Break: ", error);
      } finally {
        setIsUpdating(false);
      }
    },
    [index, existingQuickBreaks, dispatch, navigation],
  );

  const handleAddQuickBreak = useCallback(() => {
    setIsUpdating(true);

    const { name, minutes, seconds, videoUrl, emoji } = quickBreakInfo;
    const formattedName = (name || "").trim().replace(/[\r\n]+/g, " ");

    const newQuickBreak = {
      id: uuid(),
      name: formattedName || i18n.t("quickBreak.defaultQuickBreakName"),
      duration_seconds: Math.max(1, (minutes || 0) * 60 + (seconds || 0)),
      video_urls: videoUrl ? [videoUrl] : [],
      emoji: emoji || "",
    };

    updateUserSettings(newQuickBreak);
  }, [quickBreakInfo, updateUserSettings]);

  return { quickBreakInfo, setQuickBreakInfo, isUpdating, handleAddQuickBreak };
};
