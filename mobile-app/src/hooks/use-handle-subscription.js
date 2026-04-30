import { useEffect } from "react";
import { getUserSubscription } from "@/actions/UserActions";
import { useDispatch } from "react-redux";
import { addErrorLog } from "@/utils/FileLogger";

export default function useHandleSubscription(navigation) {
  const dispatch = useDispatch();

  // No longer redirect user to subscription page if trial has passed
  useEffect(() => {
    const getSubscriptionData = async () => {
      dispatch(getUserSubscription());
    };

    try {
      getSubscriptionData();
    } catch (err) {
      addErrorLog("error getting user subscription data: ", err);
    }
  }, [dispatch, navigation]);
}
