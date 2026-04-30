const { getFocusModeList, createNewFocusMode } = require("@/actions/FocusModeActions");
const { useEffect } = require("react");
const { Platform } = require("react-native");
const { useDispatch } = require("react-redux");
import { useSelector } from "@/reducers";
import { useTranslation } from "react-i18next";

const useCreateFocusMode = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();

  const { focusModesList } = useSelector((state) => state.focusMode);

  useEffect(() => {
    dispatch(getFocusModeList());
  }, []);

  useEffect(() => {
    const hasDefaultFocusMode = focusModesList?.some(
      (focusMode) =>
        focusMode?.name === i18n.t("home.blockSuperDistractingApps") && focusMode?.metadata?.isDefault === true,
    );

    if (!hasDefaultFocusMode) {
      dispatch(createNewFocusMode(i18n.t("home.blockSuperDistractingApps"), { isDefault: true, source: Platform.OS }));
    }
  }, [i18n.language]);
};

export { useCreateFocusMode };
