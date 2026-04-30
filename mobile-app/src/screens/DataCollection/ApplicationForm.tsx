/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { HorizontalAppLogo } from "@/components/AppLogo";
import { BodyLargeText, BodyMediumText, BodySmallText } from "@/components/Text";
import { TextField, Button, Space, AppHeader, Checkbox } from "@/components";
import { SafeAreaView } from "react-native-safe-area-context";
import DropDownPicker from "react-native-dropdown-picker";
import { useTheme } from "@react-navigation/native";
import { FONTFAMILY } from "@/constants/color";
import Toast from "react-native-toast-message";
import { NAVIGATION } from "@/constants";
import { useParticipantCode } from "@/hooks/useParticipantCode";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import PhoneInput from "react-native-phone-number-input";
import { i18n } from "@/localization";

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
}

interface DropdownItem {
  label: string;
  value: string;
}

const ApplicationFormScreen = ({ navigation }) => {
  const { t } = useTranslation();

  const facultyOptions: DropdownItem[] = [
    { label: t("participantCode.facultyOfBusiness"), value: "business" },
    { label: t("participantCode.facultyOfEngineering"), value: "engineering" },
    { label: t("participantCode.facultyOfHumanities"), value: "humanities" },
    { label: t("participantCode.facultyOfHealth"), value: "health" },
  ];

  const yearLevelOptions: DropdownItem[] = [
    { label: t("participantCode.yearLevel1"), value: "1" },
    { label: t("participantCode.yearLevel2"), value: "2" },
    { label: t("participantCode.yearLevel3"), value: "3" },
    { label: t("participantCode.yearLevel4"), value: "4" },
    { label: t("participantCode.yearLevel5"), value: "5" },
  ];

  const { colors } = useTheme();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phoneNumber: "",
  });

  const [faculty, setFaculty] = useState<string | null>(null);
  const [yearLevel, setYearLevel] = useState<string | null>(null);
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [yearLevelOpen, setYearLevelOpen] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [error, setError] = useState<Record<string, string>>({
    name: "",
    email: "",
    faculty: "",
    yearLevel: "",
    phoneNumber: "",
  });

  const { register } = useParticipantCode();

  // Real-time validation functions
  const validateName = (name: string) => {
    return name === "" ? t("participantCode.invalidName") : "";
  };

  const validateEmail = (email: string) => {
    if (email === "") {
      return t("participantCode.invalidEmail");
    }
    // TODO: Uncomment this when finally release the app
    // if (!email.endsWith("@catolica.edu.sv")) return t("participantCode.invalidEmail");
    return "";
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    return phoneNumber === "" ? t("participantCode.invalidPhoneNumber") : "";
  };

  const validateFaculty = (faculty: string | null) => {
    return faculty === null ? t("participantCode.invalidFaculty") : "";
  };

  const validateYearLevel = (yearLevel: string | null) => {
    return yearLevel === null ? t("participantCode.invalidYearLevel") : "";
  };

  // Real-time validation effects - only run after first submission
  useEffect(() => {
    if (hasSubmitted) {
      setError((prev) => ({ ...prev, name: validateName(formData.name) }));
    }
  }, [formData.name, hasSubmitted]);

  useEffect(() => {
    if (hasSubmitted) {
      setError((prev) => ({ ...prev, email: validateEmail(formData.email) }));
    }
  }, [formData.email, hasSubmitted]);

  useEffect(() => {
    if (hasSubmitted) {
      setError((prev) => ({ ...prev, phoneNumber: validatePhoneNumber(formData.phoneNumber) }));
    }
  }, [formData.phoneNumber, hasSubmitted]);

  useEffect(() => {
    if (hasSubmitted) {
      setError((prev) => ({ ...prev, faculty: validateFaculty(faculty) }));
    }
  }, [faculty, hasSubmitted]);

  useEffect(() => {
    if (hasSubmitted) {
      setError((prev) => ({ ...prev, yearLevel: validateYearLevel(yearLevel) }));
    }
  }, [yearLevel, hasSubmitted]);

  const validateForm = () => {
    const newError = {
      name: validateName(formData.name),
      email: validateEmail(formData.email),
      faculty: validateFaculty(faculty),
      yearLevel: validateYearLevel(yearLevel),
      phoneNumber: validatePhoneNumber(formData.phoneNumber),
    };

    setError(newError);
    setHasSubmitted(true);

    return Object.values(newError).every((value) => value === "");
  };

  // Handle field changes
  const handleNameChange = (text: string) => {
    setFormData({ ...formData, name: text });
  };

  const handleEmailChange = (text: string) => {
    setFormData({ ...formData, email: text });
  };

  const handlePhoneNumberChange = (text: string) => {
    setFormData({ ...formData, phoneNumber: text });
  };

  const handleRegister = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      await register({
        email: formData.email,
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        faculty,
        yearLevel,
        whatsappConsent: true,
        lang: i18n.language,
      });

      Toast.show({
        type: "success",
        text1: t("common.Success"),
        text2: t("participantCode.pleaseCheckEmail"),
      });

      navigation.navigate(NAVIGATION.ParticipantCode, { hasParticipantCode: true });
    } catch (e) {
      if (e.response.status === 409 || e.response.data.includes("Email already exists registered for the study")) {
        setError({ ...error, email: t("participantCode.emailAlreadyExists") });
      }
      if (e.response.status === 400) {
        setError({ ...error, email: t("participantCode.invalidEmail") });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.header}>
      <AppHeader title={t("participantCode.applicationForm")} />
      <KeyboardAwareScrollView style={styles.container}>
        <HorizontalAppLogo />
        <BodyMediumText style={styles.label}>{t("participantCode.name")}</BodyMediumText>
        <TextField
          placeholder={t("participantCode.enterYourName")}
          value={formData.name}
          onChangeText={handleNameChange}
          style={styles.textField}
          errorMessage={error.name}
        />

        <BodyMediumText style={styles.label}>{t("participantCode.email")}</BodyMediumText>
        <TextField
          placeholder={t("participantCode.enterYourEmail")}
          value={formData.email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          errorMessage={error.email}
        />
        {error.email ? (
          <BodySmallText style={styles.errorMessage} color={colors.danger}>
            {error.email}
          </BodySmallText>
        ) : (
          <Space height={16} />
        )}

        <BodyMediumText style={styles.label}>{t("participantCode.phoneNumber")}</BodyMediumText>
        <PhoneInput
          defaultCode="SV"
          placeholder={t("participantCode.enterYourPhoneNumber")}
          value={formData.phoneNumber}
          onChangeFormattedText={handlePhoneNumberChange}
          containerStyle={{
            backgroundColor: colors.secondary,
            borderColor: colors.secondaryBorder,
            width: "100%",
            borderWidth: 1,
            borderRadius: 8,
          }}
          textContainerStyle={{
            backgroundColor: colors.secondary,
            borderColor: colors.secondaryBorder,
          }}
          textInputStyle={{
            color: colors.text,
            fontFamily: FONTFAMILY.FENWICK,
          }}
        />
        {error.phoneNumber ? (
          <BodySmallText style={styles.errorMessage} color={colors.danger}>
            {error.phoneNumber}
          </BodySmallText>
        ) : (
          <Space height={16} />
        )}

        <BodyMediumText style={styles.label}>{t("participantCode.faculty")}</BodyMediumText>
        <DropDownPicker
          open={facultyOpen}
          setOpen={setFacultyOpen}
          value={faculty}
          setValue={setFaculty}
          items={facultyOptions}
          placeholder={t("participantCode.selectFaculty")}
          style={[
            styles.dropdown,
            { backgroundColor: colors.secondary, borderColor: colors.secondaryBorder },
            { borderColor: error.faculty ? colors.danger : colors.secondaryBorder },
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { backgroundColor: colors.card, borderColor: colors.separator },
            { borderColor: error.faculty ? colors.danger : colors.secondaryBorder },
          ]}
          textStyle={{
            color: colors.text,
            fontFamily: FONTFAMILY.FENWICK,
          }}
          zIndex={2000}
        />

        <BodyMediumText style={styles.label}>{t("participantCode.yearLevel")}</BodyMediumText>
        <DropDownPicker
          open={yearLevelOpen}
          setOpen={setYearLevelOpen}
          value={yearLevel}
          setValue={setYearLevel}
          items={yearLevelOptions}
          placeholder={t("participantCode.selectYearLevel")}
          style={[
            styles.dropdown,
            { backgroundColor: colors.secondary, borderColor: colors.secondaryBorder },
            { borderColor: error.yearLevel ? colors.danger : colors.secondaryBorder },
          ]}
          dropDownContainerStyle={[
            styles.dropdownContainer,
            { backgroundColor: colors.card, borderColor: colors.separator },
            { borderColor: error.yearLevel ? colors.danger : colors.secondaryBorder },
          ]}
          textStyle={{
            color: colors.text,
            fontFamily: FONTFAMILY.FENWICK,
          }}
          zIndex={1000}
        />

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setWhatsappConsent(!whatsappConsent)}
          testID="test:id/whatsapp-consent-toggle"
        >
          <Checkbox small value={whatsappConsent} testID="test:id/whatsapp-consent-checkbox" />
          <BodyLargeText style={styles.checkboxText}>{t("participantCode.whatsappConsent")}</BodyLargeText>
        </TouchableOpacity>
        <BodySmallText style={styles.errorMessage} color={colors.danger}>
          {error.terms}
        </BodySmallText>

        <View style={styles.buttonContainer}>
          <Button
            primary
            title={t("participantCode.register")}
            onPress={handleRegister}
            isLoading={isLoading}
            disabled={!whatsappConsent}
            testID="test:id/register-button"
          />
        </View>

        <Space height={50} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  label: {
    marginBottom: 8,
  },
  textField: {
    marginBottom: 16,
  },
  dropdown: {
    marginBottom: 16,
  },
  dropdownContainer: {
    borderWidth: 1,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  errorMessage: {
    marginTop: 4,
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxText: {
    marginLeft: 8,
  },
});

export { ApplicationFormScreen };
