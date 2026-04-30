import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EMAIL_VERIFICATION_COOL_DOWN } from "@/constants";
import { forgotPasswordAction, sendEmailConfirmation } from "@/actions/UserActions";
import { i18n } from "@/localization";
import { useTranslation } from "react-i18next";
import { isValidEmail } from "@/utils/GlobalUtils";
import { NormalAlert } from "@/utils/GlobalMethods";
import { getForgotPasswordCoolDownSelector } from "@/selectors/GlobalSelectors";
import { setCoolDown, clearCoolDown } from "@/actions/GlobalActions";
import { FORGOT_PASSWORD_ERROR_TYPES } from "@/constants/forgotPassword";

export function useForgotPassword() {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const coolDownEndTime = useSelector(getForgotPasswordCoolDownSelector);
  const [isProcessing, setIsProcessing] = useState(false);

  // Note: same func ref for TimeCountDown
  const handleCoolDownComplete = useCallback(() => {
    dispatch(clearCoolDown());
  }, [dispatch]);

  const startCoolDown = () => {
    dispatch(setCoolDown(Date.now() / 1000 + EMAIL_VERIFICATION_COOL_DOWN.RESET));
  };

  const validateEmail = () => {
    if (!email) {
      return { isValid: false, error: "signIn.enterEmailError" };
    }
    if (!isValidEmail(email)) {
      return { isValid: false, error: "signIn.enterValidEmailError" };
    }
    return { isValid: true };
  };

  const resetPassword = useCallback(async () => {
    const validationResult = validateEmail();
    if (!validationResult.isValid) {
      NormalAlert({ message: t(validationResult.error) });
      const error = new Error(validationResult.error);
      error.type = FORGOT_PASSWORD_ERROR_TYPES.VALIDATION_ERROR;
      throw error;
    }

    setIsProcessing(true);

    try {
      const result = await dispatch(forgotPasswordAction(email));
      startCoolDown();
      setEmail("");
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [email, dispatch]);

  /*
    If the user's existing email is not verified, then ask user to request a verification email link
    */
  const sendVerificationEmailLink = useCallback(async () => {
    const validationResult = validateEmail();
    if (!validationResult.isValid) {
      const error = new Error(validationResult.error);
      error.type = FORGOT_PASSWORD_ERROR_TYPES.VALIDATION_ERROR;
      throw error;
    }

    setIsProcessing(true);

    try {
      await dispatch(sendEmailConfirmation({ email, lang: i18n.language, noToken: true }));
      startCoolDown();
      setEmail("");
      return { success: true };
    } finally {
      setIsProcessing(false);
    }
  }, [email, dispatch, validateEmail]);

  return {
    email,
    setEmail,
    coolDownEndTime,
    isProcessing,
    resetPassword,
    sendVerificationEmailLink,
    startCoolDown,
    handleCoolDownComplete,
  };
}
