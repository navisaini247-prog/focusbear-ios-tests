import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { HeadingMediumText, BodyMediumText, HeadingSmallText, Card, Group, CardProps } from "@/components";
import { useTheme } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import { useTranslation } from "react-i18next";
import { TextField } from "../../../components/TextField";
import { Activity } from "@/types/Routine";

const TWO_DECIMALS_PLACE_REGEX = /^(\d*\.{0,1}\d{0,2}$)/;

interface LogQuantityAnswer {
  question_id: string;
  logged_value: number | string;
}

interface LogQuantityProps {
  logQuantity: Activity["log_quantity_questions"];
  logQuantityAnswers: LogQuantityAnswer[];
  setLogQuantityAnswers: React.Dispatch<React.SetStateAction<LogQuantityAnswer[]>>;
  error: Record<string, string>;
  setError: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export const LogQuantity = ({
  logQuantity,
  logQuantityAnswers,
  setLogQuantityAnswers,
  error,
  setError,
}: LogQuantityProps) => {
  const { t } = useTranslation();

  const onChangeSliderInputValue = (value, questionId, item) => {
    // Replace comma with a dot to handle different decimal separators
    const processedText = `${value}`.replace(",", ".");

    // Validate the processed text to allow only valid decimal numbers with up to two decimal places
    const validated = processedText?.match(TWO_DECIMALS_PLACE_REGEX);

    // If the processed text is not a valid decimal number, return and do nothing
    if (!validated) {
      return;
    }

    // If the processedText ends with a decimal point or is empty, keep it for further input
    let formattedValue = processedText;
    if (processedText.endsWith(".") || processedText.endsWith(".0") || processedText === "") {
      formattedValue = processedText;
    } else {
      // Otherwise, parse the processedText as a float and limit it to the specified range (max_value)
      const parsedValue = parseFloat(processedText) || 0;
      formattedValue = String(Math.min(item?.max_value, parsedValue) || "");
    }

    // Update the state with the formatted value for the corresponding questionId
    setLogQuantityAnswers((prev) => {
      return {
        ...prev,
        [questionId]: {
          question_id: questionId,
          logged_value: formattedValue,
        },
      };
    });
  };

  const onChangeSliderValue = (value, questionId) => {
    const twoDecValue = parseFloat(value?.toFixed(2));
    setLogQuantityAnswers((prev) => {
      return {
        ...prev,
        [questionId]: {
          question_id: questionId,
          logged_value: twoDecValue,
        },
      };
    });
  };

  useEffect(() => {
    // Create an object to store errors
    const errors = {};

    // Check if all logged values in logQuantityAnswers meet the specified constraints
    Object.values(logQuantityAnswers).forEach((item) => {
      // Find the corresponding question object in logQuantity array based on question_id
      const { min_value, max_value, id } = logQuantity.find((logItem) => logItem.id === item.question_id);

      // Check if the logged value is a number and falls within the specified range
      if (
        isNaN(Number(item.logged_value)) ||
        Number(item.logged_value) < min_value ||
        Number(item.logged_value) > max_value
      ) {
        // If the value is invalid, set the error message
        errors[id] = t("complete.quantity_input_error", { min: min_value, max: max_value });
      }
    });

    setError(errors);
  }, [logQuantity, logQuantityAnswers, setError, t]);

  return (
    <View style={styles.gap12}>
      <HeadingMediumText>{t("complete.logQuantity")}</HeadingMediumText>
      <Group>
        {logQuantity.map((item, index) => (
          <LogQuantityItem
            key={index}
            {...{ item, error, onChangeSliderInputValue, onChangeSliderValue, logQuantityAnswers, index }}
          />
        ))}
      </Group>
    </View>
  );
};

type LogQuantityQuestion = Activity["log_quantity_questions"][number];
interface LogQuantityItemProps extends CardProps {
  item: LogQuantityQuestion;
  error: Record<string, string>;
  onChangeSliderInputValue: (value: string, id: string, item: LogQuantityQuestion) => void;
  onChangeSliderValue: (value: number, id: string) => void;
  logQuantityAnswers: LogQuantityAnswer[];
  index: number;
}

const LogQuantityItem = ({
  item,
  error,
  onChangeSliderInputValue,
  onChangeSliderValue,
  logQuantityAnswers,
  index,
  style,
  ...props
}: LogQuantityItemProps) => {
  const { colors } = useTheme();
  const shouldAutoFocus = index === 0;

  return (
    <Card style={[styles.gap8, style]} {...props}>
      <HeadingSmallText>{item.question}</HeadingSmallText>
      {!item.min_value && !item.max_value ? (
        <TextField
          type="numeric"
          placeholder="123"
          autoFocus={shouldAutoFocus}
          onChangeText={(value) => onChangeSliderInputValue(value, item.id, item)}
        />
      ) : (
        <>
          <TextField
            type="numeric"
            errorMessage={error[item.id]}
            autoFocus={shouldAutoFocus}
            testID="test:id/enter-log-quantity-via-textinput"
            onChangeText={(value) => onChangeSliderInputValue(value, item.id, item)}
            value={`${logQuantityAnswers[item?.id]?.logged_value}`}
            defaultValue={`${item.min_value || 0}`}
          />
          {error[item.id] && <BodyMediumText>{error[item.id]}</BodyMediumText>}
          <View style={[styles.row, styles.gap8]}>
            <BodyMediumText>{item?.min_value}</BodyMediumText>
            <Slider
              style={styles.flex}
              value={Number(logQuantityAnswers[item?.id]?.logged_value || 0) || item?.min_value || 0}
              minimumValue={item?.min_value}
              maximumValue={item?.max_value}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.separator}
              thumbTintColor={colors.text}
              onValueChange={(value) => onChangeSliderValue(value, item.id)}
              step={0.1}
            />
            <BodyMediumText>{item?.max_value}</BodyMediumText>
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
