import { updateUserConsentStatus } from "@/actions/UserActions";
import { userConsentToPrivacyPolicyLoggedSelector, privacyPolicyConsentedSelector } from "@/reducers/UserReducer";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "@/reducers";

/**
 * Custom hook for updating user consent status.
 */
const useUpdateUserConsentStatus = () => {
  const userConsented = useSelector(privacyPolicyConsentedSelector);
  const userConsentedLogged = useSelector(userConsentToPrivacyPolicyLoggedSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userConsented && !userConsentedLogged) {
      dispatch(updateUserConsentStatus());
    }
  }, []);
};

export { useUpdateUserConsentStatus };
