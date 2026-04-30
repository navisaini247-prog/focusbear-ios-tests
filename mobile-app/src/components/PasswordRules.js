import React from "react";
import { View, StyleSheet } from "react-native";
import { BodySmallText } from "./Text";
import { ScalableIcon } from "./ScalableIcon";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { getPasswordRuleResults } from "@/utils/passwordValidation";
import { FONT_SCALE_LIMIT } from "@/utils/FontScaleUtils";

const PasswordRule = ({ text, isMet, submitted }) => {
  const { colors } = useTheme();
  const color = isMet ? colors.success : submitted ? colors.danger : colors.subText;
  return (
    <View style={styles.ruleContainer}>
      <ScalableIcon
        name={isMet ? "checkmark-circle" : "close-circle"}
        size={14}
        color={color}
        style={styles.ruleIcon}
        scaleOptions={{ maxFontScale: FONT_SCALE_LIMIT.CONSTRAINED_UI }}
      />
      <BodySmallText maxFontSizeMultiplier={FONT_SCALE_LIMIT.CONSTRAINED_UI} color={color} style={styles.ruleText}>
        {text}
      </BodySmallText>
    </View>
  );
};

export const PasswordRules = ({ password, submitted }) => {
  const { t } = useTranslation();

  const ruleResults = getPasswordRuleResults(password);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <PasswordRule text={t("passwordRules.minLength")} isMet={ruleResults.isMinLength} submitted={submitted} />
        <PasswordRule text={t("passwordRules.includeNumbers")} isMet={ruleResults.hasNumber} submitted={submitted} />
      </View>
      <View style={styles.row}>
        <PasswordRule
          text={t("passwordRules.includeLowerCase")}
          isMet={ruleResults.hasLowerCase}
          submitted={submitted}
        />
        <PasswordRule
          text={t("passwordRules.includeUpperCase")}
          isMet={ruleResults.hasUpperCase}
          submitted={submitted}
        />
      </View>
      <View style={styles.row}>
        <PasswordRule
          text={t("passwordRules.includeSpecialChars")}
          isMet={ruleResults.hasSpecialChar}
          submitted={submitted}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    gap: 2,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  ruleContainer: {
    flex: 1,
    minWidth: "48%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  ruleIcon: {
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    flexShrink: 1,
  },
});
