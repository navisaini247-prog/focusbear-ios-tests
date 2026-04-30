const { NAVIGATION } = require("@/constants");
const { privacyPolicyConsentedSelector } = require("@/reducers/UserReducer");
const { useNavigation } = require("@react-navigation/native");
const { useEffect } = require("react");
import { useSelector } from "@/reducers";

const useConsentToPrivacyPolicy = () => {
  const hasConsented = useSelector(privacyPolicyConsentedSelector);
  const navigation = useNavigation();

  useEffect(() => {
    if (!hasConsented) {
      navigation.replace(NAVIGATION.PrivacyConsent, { signUp: true });
    }
  }, []);
};

export { useConsentToPrivacyPolicy };
