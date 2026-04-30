import React, { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";
import { TextField, ConfirmationModal, BodyMediumText } from "@/components";
import { useTranslation } from "react-i18next";
import Base64 from "@/utils/Base64";
import { useDispatch } from "react-redux";
import {
  forceShowPasswordModalSelector,
  latestVerifiedTimestampSelector,
  onPasswordVerifiedSelector,
  onVerificationCanceledSelector,
  isPasswordModalVisibleSelector,
} from "@/selectors/ModalSelectors";
import { hidePasswordModal, passwordVerified } from "@/actions/ModalActions";
import { macPasswordSelector } from "@/selectors/UserSelectors";
import { PASSWORD_VERIFICATION_TIMEOUT } from "@/constants/passwordRules";
import { logSentryError } from "@/utils/Posthog";
import { useSelector } from "@/reducers";
import { useTheme } from "@react-navigation/native";
import { addInfoLog } from "@/utils/FileLogger";
import { TimeCountDown } from "@/components/TimeCountDown";
import { FRICTION_PASSWORD_RESET_COOLDOWN_SECONDS } from "@/constants/forgotPassword";
import { clearFrictionPasswordResetCoolDown, setFrictionPasswordResetCoolDown } from "@/actions/GlobalActions";
import { frictionPasswordResetEndTimeSelector } from "@/selectors/GlobalSelectors";
import { postUserLocalDeviceSettings } from "@/actions/UserActions";
import { PLATFORMS } from "@/constants";

const VerifyPasswordModal = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isPasswordModalVisible = useSelector(isPasswordModalVisibleSelector);
  const onPasswordVerified = useSelector(onPasswordVerifiedSelector);
  const onVerificationCanceled = useSelector(onVerificationCanceledSelector);
  const latestVerifiedTimestamp = useSelector(latestVerifiedTimestampSelector);
  const forceShowPasswordModal = useSelector(forceShowPasswordModalSelector);

  const macOSPassword = useSelector(macPasswordSelector);
  const frictionPasswordResetEndTime = useSelector(frictionPasswordResetEndTimeSelector);

  const dispatch = useDispatch();

  const [password, setPassword] = useState("");
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const isResettingPasswordRef = useRef(false);
  const nowInSeconds = Date.now() / 1000;
  const isFrictionResetPending = !!frictionPasswordResetEndTime && nowInSeconds < frictionPasswordResetEndTime;

  const clearFrictionPassword = useCallback(async () => {
    if (isResettingPasswordRef.current) {
      return;
    }

    try {
      isResettingPasswordRef.current = true;
      await dispatch(postUserLocalDeviceSettings({ kAppPassword: null }, PLATFORMS.MACOS));
      addInfoLog("Friction password reset: cleared app password after 24h cooldown");
    } catch (error) {
      logSentryError(`Friction password reset failed: ${error}`);
    } finally {
      dispatch(clearFrictionPasswordResetCoolDown());
      isResettingPasswordRef.current = false;
    }
  }, [dispatch]);

  useEffect(() => {
    const shouldNotShowModal =
      (Date.now() - latestVerifiedTimestamp) / 1000 <= PASSWORD_VERIFICATION_TIMEOUT && isPasswordModalVisible;

    const canBypassWithCooldown = !!frictionPasswordResetEndTime && nowInSeconds >= frictionPasswordResetEndTime;

    if (!macOSPassword || (shouldNotShowModal && !forceShowPasswordModal)) {
      dispatch(hidePasswordModal());
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          onPasswordVerified?.();
        }, 300);
      });
      return;
    }

    if (canBypassWithCooldown) {
      dispatch(hidePasswordModal());
      clearFrictionPassword();
      return;
    }

    setIsVisible(isPasswordModalVisible);
  }, [
    dispatch,
    clearFrictionPassword,
    forceShowPasswordModal,
    frictionPasswordResetEndTime,
    isPasswordModalVisible,
    latestVerifiedTimestamp,
    macOSPassword,
    nowInSeconds,
    onPasswordVerified,
  ]);

  const onPasswordSubmit = () => {
    try {
      setPassword("");
      const macPassword = Base64.decode(macOSPassword);

      const isInvalidPassword = !macOSPassword || !password || password !== macPassword;

      if (isInvalidPassword) {
        setIsPasswordInvalid(true);
        return;
      }
      setIsPasswordInvalid(false);

      if (isFrictionResetPending) {
        dispatch(clearFrictionPasswordResetCoolDown());
        addInfoLog("User cancelled friction password reset cooldown with correct password");
      }

      addInfoLog(`User verified password`);
      dispatch(hidePasswordModal());
      dispatch(passwordVerified());
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          onPasswordVerified?.();
        }, 300);
      });
    } catch (e) {
      logSentryError(`User verify password error: ${e}`);
      setIsPasswordInvalid(true);
    }
  };

  const onHidePasswordModal = () => {
    addInfoLog(`User cancelled password verification`);
    onVerificationCanceled?.();
    dispatch(hidePasswordModal());
    setIsPasswordInvalid(false);
    setPassword("");
  };

  const onResetPassword = () => {
    const endTime = Date.now() / 1000 + FRICTION_PASSWORD_RESET_COOLDOWN_SECONDS;
    addInfoLog("User requested friction password reset cooldown");
    dispatch(setFrictionPasswordResetCoolDown(endTime));
    setIsPasswordInvalid(false);
    setPassword("");
  };

  return (
    <ConfirmationModal
      title={t("home.unlockToProceed")}
      isVisible={isVisible}
      confirmTitle={t("common.verify")}
      onConfirm={onPasswordSubmit}
      onCancel={onHidePasswordModal}
    >
      <TextField
        autoFocus
        type="password"
        placeholder={t("home.passwordForSettingsTitles")}
        value={password}
        onChangeText={(value) => setPassword(value)}
        onSubmitEditing={onPasswordSubmit}
        testID="test:id/verify-password-input"
      />
      {isPasswordInvalid && (
        <BodyMediumText color={colors.danger}>{t("passwordForSettings.invalid_password")}</BodyMediumText>
      )}
      {isFrictionResetPending ? (
        <>
          <BodyMediumText color={colors.danger}>{t("passwordForSettings.resetAfter24Hours")}</BodyMediumText>
          <TimeCountDown
            time={frictionPasswordResetEndTime}
            callback={() => {
              dispatch(hidePasswordModal());
              clearFrictionPassword();
            }}
            size={20}
          />
        </>
      ) : (
        <BodyMediumText underline color={colors.subText} onPress={onResetPassword}>
          {t("forgotPassword.resetPassword")}
        </BodyMediumText>
      )}
    </ConfirmationModal>
  );
};

export { VerifyPasswordModal };
