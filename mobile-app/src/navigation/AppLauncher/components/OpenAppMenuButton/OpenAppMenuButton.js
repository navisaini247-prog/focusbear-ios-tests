import React from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import { useLauncherContext } from "../../context";
import { checkIsIOS } from "@/utils/PlatformMethods";
import { useDispatch } from "react-redux";
import { showOpenAppMenuToolTipSelector } from "@/selectors/GlobalSelectors";
import { setOpenAppMenuToolTip } from "@/actions/GlobalActions";
import { useTranslation } from "react-i18next";
import { useSelector } from "@/reducers";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components";

const OpenAppMenuButton = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { setOpenAppMenu, styles, isFocusBearDefaultLauncher } = useLauncherContext();

  const dispatch = useDispatch();

  const shouldShowToolTip = useSelector(showOpenAppMenuToolTipSelector);

  if (checkIsIOS() || !isFocusBearDefaultLauncher) {
    return null;
  }

  const onOpenAppMenu = () => {
    dispatch(setOpenAppMenuToolTip(false));
    setOpenAppMenu(true);
  };

  return (
    <TouchableOpacity
      onPress={() => onOpenAppMenu()}
      style={[styles.openAppMenuButton, { transform: [{ translateY: insets.top }] }]}
      testID="test:id/open-app-menu-button"
    >
      <Icon name="bars" size={30} color="white" style={{}} />
      {shouldShowToolTip && (
        <View pointerEvents="none" style={styles.tooltip}>
           <Text style={styles.textStyle}>{t("launcher.openAppMenuToolTip")}</Text>
          <View style={styles.square} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export { OpenAppMenuButton };
