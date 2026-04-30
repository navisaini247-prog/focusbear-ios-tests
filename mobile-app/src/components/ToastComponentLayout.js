import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, BodyXSmallText } from "./";
import { useTheme } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";

export const toastConfig = {
  success: (props) => <CustomToast {...props} color={"success"} icon="checkmark" />,
  error: (props) => <CustomToast {...props} color={"danger"} icon="alert-circle" />,
  info: (props) => <CustomToast {...props} color={"subText"} icon="information" />,
  warn: (props) => <CustomToast {...props} color={"warning"} icon="warning" />,
};

const CustomToast = ({ color, icon, text1, text2 }) => {
  const { colors, shadowStyles } = useTheme();

  return (
    <View pointerEvents="none">
      <Card style={[styles.toast, shadowStyles.bigShadow, { backgroundColor: colors.secondary }]}>
        <Icon name={icon} color={colors[color]} size={22} />
        <View style={styles.textContainer}>
          {text1 && <BodyXSmallText numberOfLines={2}>{text1}</BodyXSmallText>}
          {text2 && (
            <BodyXSmallText numberOfLines={2} color={colors.subText} size={11}>
              {text2}
            </BodyXSmallText>
          )}
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    width: "90%",
    paddingVertical: 8,
    gap: 12,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
});
