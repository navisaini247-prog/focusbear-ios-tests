export const TYPES = {
  SET_APP_QUALITY_OVERRIDE: "SET_APP_QUALITY_OVERRIDE",
  CLEAR_STORE: "CLEAR_STORE",
};

export const setAppQualityOverride = (packageName, quality) => ({
  type: TYPES.SET_APP_QUALITY_OVERRIDE,
  payload: { packageName, quality },
});
