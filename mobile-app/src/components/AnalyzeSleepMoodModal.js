import React, { memo, useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ConfirmationModal, Card, BodyMediumText, HeadingMediumText } from "@/components";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { showSleepMoodAnalyzeModalStatusSelector, userLoginTimeSelector } from "@/selectors/GlobalSelectors";
import moment from "moment";
import { showSleepMoodAnalyzeModal } from "@/actions/GlobalActions";
import { IMPACT_REPORTING, POSTHOG_EVENT_NAMES } from "@/utils/Enums";
import { ROUTINE_NAMES } from "@/constants";
import { getInstalledHabitPack, installHabitPack } from "@/actions/UserActions";
import PropTypes from "prop-types";
import { getIsMorningOrEvening } from "@/utils/ActivityRoutineMethods";
import { logSentryError, postHogCapture } from "@/utils/Posthog";
import { addErrorLog } from "@/utils/FileLogger";
import { useSelector } from "@/reducers";
import { getUserDetails, getCurrentActivityProps, getUserLocalDeviceSettings } from "@/actions/UserActions";

const AnalyzeSleepMoodModal = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const dispatch = useDispatch();
  const shouldShowSleepMoodAnalyzeModal = useSelector(showSleepMoodAnalyzeModalStatusSelector);

  const userLoginTime = useSelector(userLoginTimeSelector);
  const triggerReportingTime = moment(userLoginTime).add(2, "days");

  const currentDate = moment();

  useEffect(() => {
    if (currentDate.isAfter(triggerReportingTime) && shouldShowSleepMoodAnalyzeModal) {
      const isMorningTime = getIsMorningOrEvening() === ROUTINE_NAMES.MORNING;
      if (isMorningTime) {
        // Checks if impact reporting has been already installed
        dispatch(getInstalledHabitPack())
          .then((installedHabitPacks) => {
            const hasImpactReportingInstalled = installedHabitPacks.some(
              (habitPack) => habitPack.id === IMPACT_REPORTING.HABIT_PACK_ID,
            );
            if (hasImpactReportingInstalled) {
              // If user has already installed impact reporting from any other device then do not show it on mobile app
              dispatch(showSleepMoodAnalyzeModal(false));
            } else {
              setIsVisible(true);
              postHogCapture(POSTHOG_EVENT_NAMES.SHOW_RECORD_IMPACT_PERMISSION);
            }
          })
          .catch((error) => {
            addErrorLog("Get user installed habit pack error: " + error);
            const exception = new Error(error);
            logSentryError(exception);
          });
      }
    }
  }, []);

  const refreshAll = useCallback(() => {
    Promise.all([
      dispatch(getUserDetails()),
      dispatch(getUserLocalDeviceSettings()),
      dispatch(getCurrentActivityProps()),
    ]).catch((error) => {
      addErrorLog("Error occurred during data fetching:", error);
    });
  }, [dispatch]);

  const onConfirm = useCallback(() => {
    setIsVisible(false);
    dispatch(showSleepMoodAnalyzeModal(false));
    postHogCapture(POSTHOG_EVENT_NAMES.RECORD_IMPACT_PERMISSION_ALLOWED);
    dispatch(installHabitPack(IMPACT_REPORTING.HABIT_PACK_ID))
      .then(() => {
        refreshAll();
      })
      .catch(() => {
        addErrorLog("INSTALL SLEEP MOOD ANALYZE HABIT PACK FAILED");
      });
  }, [refreshAll]);

  const onCancel = useCallback(() => {
    setIsVisible(false);
    dispatch(showSleepMoodAnalyzeModal(false));
    postHogCapture(POSTHOG_EVENT_NAMES.RECORD_IMPACT_PERMISSION_DENIED);
  }, []);

  return (
    <ConfirmationModal
      isVisible={isVisible}
      title={t("impact_reporting.title")}
      confirmTitle={t("impact_reporting.okSure")}
      onConfirm={onConfirm}
      cancelTitle={t("impact_reporting.noThanks")}
      onCancel={onCancel}
    >
      <BodyMediumText>{t("impact_reporting.description")}</BodyMediumText>
      <Card style={styles.container}>
        <HeadingMediumText>{t("impact_reporting.subtitle")}</HeadingMediumText>
        <View style={styles.bulletPointsContainer}>
          <BodyMediumText>{t("impact_reporting.bulletPoints")}</BodyMediumText>
        </View>
      </Card>
    </ConfirmationModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  bulletPointsContainer: {
    paddingLeft: 4,
  },
});

export default memo(AnalyzeSleepMoodModal);

AnalyzeSleepMoodModal.propTypes = {
  onPressConfirm: PropTypes.func,
};

AnalyzeSleepMoodModal.defaultProps = {
  onPressConfirm: () => {},
};
