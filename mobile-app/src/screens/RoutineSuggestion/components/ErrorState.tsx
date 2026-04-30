import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { DisplayLargeText, BodyLargeText, Button } from "@/components";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { postHogCapture } from "@/utils/Posthog";
import { POSTHOG_EVENT_NAMES } from "@/utils/Enums";

interface ErrorStateProps {
  isLoading: boolean;
  onRetry: () => void;
  onContinue: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ isLoading, onRetry, onContinue }) => {
  const { t } = useTranslation();
  const [retryLoading, setRetryLoading] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  return (
    <SafeAreaView style={styles.contentContainer}>
      <DisplayLargeText center style={styles.errorTitle}>
        {t("routineSuggestion.errorTitle")}
      </DisplayLargeText>
      <BodyLargeText center style={styles.errorMessage}>
        {t("routineSuggestion.errorMessageGoals")}
      </BodyLargeText>
      <View style={styles.buttonContainer}>
        <Button
          title={t("common.retry")}
          isLoading={retryLoading && isLoading}
          onPress={() => {
            setContinueLoading(false);
            setRetryLoading(true);
            postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_RETRY_CLICKED);
            onRetry();
          }}
          testID="test:id/retry-button"
        />
        <Button
          primary
          title={t("routineSuggestion.updateGoals")}
          isLoading={continueLoading && isLoading}
          onPress={() => {
            setRetryLoading(false);
            setContinueLoading(true);
            postHogCapture(POSTHOG_EVENT_NAMES.ONBOARDING_ROUTINE_SUGGESTION_CONTINUE_ERROR_CLICKED);
            onContinue();
          }}
          testID="test:id/continue-error-button"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    marginBottom: 16,
  },
  errorMessage: {
    marginBottom: 32,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 16,
  },
});
