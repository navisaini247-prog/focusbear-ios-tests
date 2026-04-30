const { postUserLocalDeviceSettings } = require("@/actions/UserActions");
const { PLATFORMS } = require("@/constants");
const { userSelector } = require("@/selectors/UserSelectors");
const { useEffect } = require("react");
const { useSelector, useDispatch } = require("react-redux");

export const useHideFocusToolTip = () => {
  const user = useSelector(userSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user?.userLocalDeviceSettingsData?.MACOS?.hideFocusModeToolTip) {
      dispatch(
        postUserLocalDeviceSettings(
          {
            hideFocusModeToolTip: true,
          },
          PLATFORMS.MACOS,
        ),
      );
    }
  }, []);
};
