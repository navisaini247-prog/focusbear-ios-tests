import React, { memo } from "react";
import { Image } from "react-native";
import { BodyMediumText, MenuItem } from "@/components";
import { styles } from "@/screens/AppsBlockList/AppsBlockList.styles";
import { useTheme } from "@react-navigation/native";

type AppFlatListItemProps = {
  packageName: string;
  appName: string;
  icon?: string;
  onPress: (packageName: string) => void;
  isBlocked: boolean;
};

const AppFlatListItem = memo(function AppFlatListItem({
  packageName,
  appName,
  icon,
  onPress,
  isBlocked,
}: AppFlatListItemProps) {
  const { colors } = useTheme();
  return (
    <MenuItem
      style={[styles.listItem, { backgroundColor: colors.transparent }]}
      onPress={() => onPress(packageName)}
      type="checkbox"
      isSelected={isBlocked}
    >
      {icon ? (
        <Image
          source={{
            uri: icon.startsWith("file://")
              ? icon // Enhanced format: file path
              : icon.startsWith("data:image/png;base64,")
                ? icon // Already has data prefix
                : `data:image/png;base64,${icon}`, // Legacy format: base64 without prefix
          }}
          style={styles.imageStyle}
        />
      ) : null}
      <BodyMediumText style={styles.flexShrink}>{appName}</BodyMediumText>
    </MenuItem>
  );
});

export default AppFlatListItem;
