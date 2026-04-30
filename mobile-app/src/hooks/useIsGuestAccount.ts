import { v4 as uuidv4 } from "uuid";
import { isTestingEnvironment } from "@/utils/Environment";
import { useSelector } from "react-redux";
import { isGuestAccountSelector } from "@/selectors/UserSelectors";

export const GUEST_PASSWORD = "Passw0rd!";

export const useIsGuestAccount = (): boolean => {
  return useSelector(isGuestAccountSelector);
};

/*  
Developer testing with anonymous/guest accounts in development mode, makes PostHog
analytics difficult (i.e test users are indistinguishable from real anonymous users trying out the app)

com.focusbear.development => in dev mode => `internaltest+${uuidv4()}@focusbear.io`
com.focusbear.production => in prod mode => `anonymoususer+${uuidv4()}@focusbear.com`
*/
export const createGuestEmail = () =>
  isTestingEnvironment() ? `internaltest+${uuidv4()}@focusbear.io` : `anonymoususer+${uuidv4()}@focusbear.com`;
