import { isOnboardingStatusSelector } from "@/selectors/GlobalSelectors";
import { useSelector } from "@/reducers";

export const useOnBoardingStatus = () => {
  const isOnboardingStatus = useSelector(isOnboardingStatusSelector);

  return isOnboardingStatus;
};
