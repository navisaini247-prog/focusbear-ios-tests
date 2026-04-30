import { ic_logo } from "@/assets";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Linking, RefreshControl, View, useWindowDimensions } from "react-native";
import { styles } from "@/screens/Subscription/Subscription.styles";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  FullPageLoading,
  Checkbox,
  DisplaySmallText,
  HeadingMediumText,
  HeadingXLargeText,
  BodySmallText,
  Space,
  BigHeaderScrollView,
} from "@/components";
import Purchases from "react-native-purchases";
import {
  ENTITLEMENT_ID_TRIAL,
  ENTITLEMENT_ID_PERSONAL,
  ENTITLEMENT_ID_TEAM_MEMBER,
  REVENUECAT_API_KEY_APPLE,
  REVENUECAT_API_KEY_GOOGLE,
  SUBSCRIPTION_SKU,
} from "@/utils/Enums";
import { getUserSubscription } from "@/actions/UserActions";
import { useDispatch, useSelector } from "react-redux";
import { userSelector } from "@/selectors/UserSelectors";
import { checkIsAndroid, checkIsIOS } from "@/utils/PlatformMethods";
import { addErrorLog, addInfoLog } from "@/utils/FileLogger";
import { Trans } from "react-i18next";
import Toast from "react-native-toast-message";
import { useIsGuestAccount } from "@/hooks/useIsGuestAccount";

const PRODUCT_ID = checkIsAndroid() ? "focus_bear_mobile" : "fb_mp1";

export function Subscription({ navigation }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const user = useSelector(userSelector);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const isGuestAccount = useIsGuestAccount();

  const [subsProducts, setSubsProducts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { userSubscriptionDetails } = useSelector((state) => state.user);
  const [showBackButton, setShowBackButton] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        const config = {
          apiKey: checkIsIOS() ? REVENUECAT_API_KEY_APPLE : REVENUECAT_API_KEY_GOOGLE,
        };
        if (user?.deviceData?.user_id) {
          config.appUserID = user.deviceData.user_id;
        }
        await Purchases.configure(config);
        await loadOfferings();
        setIsLoading(false);
      } catch (e) {
        addErrorLog("Error in Subscription init:", e);
        setIsLoading(false);
      }
    };
    init();
    loadProductPrice();
  }, []);

  // hide back button if not accessed via settings page
  useEffect(() => {
    const { index, routes } = navigation.getState();
    if (routes[index].params?.hideNavigation === true) {
      setShowBackButton(false);
      return () => setShowBackButton(true);
    }
  }, [navigation]);

  const loadOfferings = async () => {
    const offerings = await Purchases.getOfferings();
    setSubsProducts(offerings.all.Default.availablePackages[0]);
    setIsLoading(false);
  };

  const loadProductPrice = async () => {
    const products = await Purchases.getProducts([PRODUCT_ID]);
    if (products.length > 0) {
      setProduct(products[0]);
    }
  };

  const purchaseSubs = async () => {
    try {
      setIsLoading(true);
      const { customerInfo } = await Purchases.purchasePackage(subsProducts);
      setIsLoading(false);

      if (customerInfo) {
        const personalEntitlementActive = customerInfo.entitlements.active[ENTITLEMENT_ID_PERSONAL];
        const teamMemberEntitlementActive = customerInfo.entitlements.active[ENTITLEMENT_ID_TEAM_MEMBER];

        if (typeof personalEntitlementActive !== "undefined" || typeof teamMemberEntitlementActive !== "undefined") {
          // Both personal and team_member entitlements are active
          setIsLoading(false);
        } else {
          // Handle the case where either personal or team_member entitlement is not active
          addInfoLog("Personal or team_member entitlement is not active.");
        }
      } else {
        // Handle the case where customerInfo is undefined
        addInfoLog("customerInfo is undefined.");
      }
      dispatch(getUserSubscription());
    } catch (e) {
      setIsLoading(false);
      // Handle the error if the purchase fails
      addErrorLog("Error occurred during purchase:", e);
    }
  };

  const restorePurchases = async () => {
    setIsLoading(true);
    try {
      const { customerInfo } = await Purchases.restorePurchases();
      if (customerInfo) {
        const personalEntitlementActive = customerInfo.entitlements.active[ENTITLEMENT_ID_PERSONAL];
        const teamMemberEntitlementActive = customerInfo.entitlements.active[ENTITLEMENT_ID_TEAM_MEMBER];
        setIsLoading(false);
        if (typeof personalEntitlementActive !== "undefined" || typeof teamMemberEntitlementActive !== "undefined") {
          // Both personal and team_member entitlements are active
          setIsLoading(false);
        } else {
          // Handle the case where either personal or team_member entitlement is not active
          addInfoLog("Personal or team_member entitlement is not active.");
        }
        dispatch(getUserSubscription());
      } else {
        Toast.show({
          type: "error",
          text1: t("subscription.restorePurchasesError"),
        });
      }
    } catch (e) {
      const errorMessage = e.message;
      if (errorMessage.includes("The receipt is missing")) {
        Toast.show({
          type: "error",
          text1: t("subscription.restorePurchasesError"),
        });
      } else {
        Toast.show({
          type: "error",
          text1: t("subscription.restorePurchasesError2"),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onClickContinue = () => {
    purchaseSubs();
  };

  const onCancelClick = () => {
    if (checkIsIOS()) {
      Linking.openURL("https://apps.apple.com/account/subscriptions");
    } else {
      Linking.openURL(
        `https://play.google.com/store/account/subscriptions?package=com.focusbear&sku=${SUBSCRIPTION_SKU}`,
      );
    }
  };

  const subscriptionStatusText = useMemo(() => {
    let txtSubscriptionStatus = "";
    if (userSubscriptionDetails?.hasActiveSubscription && userSubscriptionDetails?.activeEntitlements.length > 0) {
      if (userSubscriptionDetails?.activeEntitlements[0] === ENTITLEMENT_ID_TRIAL) {
        txtSubscriptionStatus = t("subscription.trialActive", {
          day: userSubscriptionDetails?.expirations?.trial?.days_left,
          amount: product?.priceString || "$2.99",
        });
      }
    }

    return txtSubscriptionStatus;
  }, [
    product?.priceString,
    t,
    userSubscriptionDetails?.activeEntitlements,
    userSubscriptionDetails?.expirations?.trial?.days_left,
    userSubscriptionDetails?.hasActiveSubscription,
  ]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([dispatch(getUserSubscription())])
      .then(() => {
        setRefreshing(false);
      })
      .catch(() => {
        setRefreshing(false);
      });
  }, []);

  // Show subscription info if user does not have an active subscription or has a trial subscription
  const shouldShowSubscriptionInfo =
    !userSubscriptionDetails?.hasActiveSubscription ||
    userSubscriptionDetails?.activeEntitlements?.[0] === ENTITLEMENT_ID_TRIAL;

  return (
    <View style={styles.container}>
      <BigHeaderScrollView
        title={t("subscription.subscription")}
        hideBackButton={!showBackButton}
        contentContainerStyle={[styles.scrollViewStyle, { paddingBottom: insets.bottom }]}
        scrollViewProps={{ refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }}
      >
        <Image source={ic_logo} style={{ width: screenWidth * 0.6, height: screenWidth * 0.35 }} resizeMode="cover" />
        <DisplaySmallText center>{t("subscription.benefit")}</DisplaySmallText>
        <View>
          {[
            t("subscription.personalizedHabit"),
            t("subscription.productivityBoosting"),
            t("subscription.customizedFocus"),
            t("subscription.automaticGoals"),
          ].map((point, index) => (
            <View style={styles.checkboxContainer} key={index}>
              <Checkbox small value={true} testID={`test:id/subscription-feature-${index}`} />
              <HeadingMediumText style={styles.checkboxText}>{point}</HeadingMediumText>
            </View>
          ))}
        </View>

        <Space height={10} />
        <HeadingMediumText center>
          {shouldShowSubscriptionInfo ? (
            t("subscription.getSubscriptionPlan")
          ) : (
            <Trans
              i18nKey={
                isGuestAccount ? "subscription.thankYouForSubscribingGuestMode" : "subscription.thankYouForSubscribing"
              }
              values={{
                day:
                  userSubscriptionDetails?.expirations?.[Object.keys(userSubscriptionDetails?.expirations || {})?.[0]]
                    ?.days_left || 0,
              }}
              components={{ bold: <HeadingMediumText color={colors.danger} /> }}
            />
          )}
        </HeadingMediumText>

        {!shouldShowSubscriptionInfo ? (
          <View>
            <Space height={12} />
            <Button testID="test:id/upgrade-subscription" title={t("subscription.cancel")} onPress={onCancelClick} />
            <Space height={12} />
          </View>
        ) : (
          <Button onPress={onClickContinue} primary testID="test:id/subscribe-now">
            <HeadingXLargeText center color={colors.white}>
              <Trans
                defaults={t("subscription.subscriptionPlanPrice", {
                  amount: product?.priceString ?? "$2.99",
                })}
                components={{ bold: <DisplaySmallText color="inherit" underline /> }}
              />
            </HeadingXLargeText>
          </Button>
        )}
        {userSubscriptionDetails?.activeEntitlements?.[0] === ENTITLEMENT_ID_TRIAL && (
          <BodySmallText center italic>
            {subscriptionStatusText}
          </BodySmallText>
        )}

        {shouldShowSubscriptionInfo && (
          <View>
            <Button onPress={restorePurchases} testID="test:id/restore-purchases">
              <HeadingMediumText center>{t("subscription.restorePurchases")}</HeadingMediumText>
            </Button>
            <Space height={12} />
            <HeadingMediumText center>{t("subscription.doesSubscriptionAutoRenew")}</HeadingMediumText>
            <BodySmallText center>
              {t("subscription.subscriptionAutoRenew", {
                amount: product?.priceString ?? "$2.99",
              })}
            </BodySmallText>
          </View>
        )}
        <Space height={10} />
      </BigHeaderScrollView>
      <FullPageLoading show={isLoading} />
    </View>
  );
}
