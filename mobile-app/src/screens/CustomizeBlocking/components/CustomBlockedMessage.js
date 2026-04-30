import React from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { TextField, BodyMediumText, Group, Card } from "@/components";

export function CustomBlockedMessage({ value, onChangeText }) {
  const { t } = useTranslation();

  return (
    <View>
      <Group>
        <Card>
          <TextField
            placeholder={t("customizeBlocking.customBlockedMessage.placeholder", {
              defaultValue: "e.g. Stay focused — future you will thank you!",
            })}
            value={value}
            onChangeText={onChangeText}
            multiline
            numberOfLines={4}
            testID="test:id/custom-blocked-message-input"
          />
        </Card>
      </Group>

      <BodyMediumText style={styles.hint}>
        {t("customizeBlocking.customBlockedMessage.hint", {
          defaultValue: "Leave blank to show a random motivational message.",
        })}
      </BodyMediumText>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    opacity: 0.6,
    fontStyle: "italic",
    marginTop: 6,
    fontSize: 13,
  },
});
