import { TYPES } from "@/actions/AppQualityActions";

const INITIAL_STATE = {
  overrides: {},
};

export const appQualityReducer = (state = INITIAL_STATE, { payload, type }) => {
  switch (type) {
    case TYPES.SET_APP_QUALITY_OVERRIDE:
      return {
        ...state,
        overrides: {
          ...state.overrides,
          [payload.packageName]: payload.quality,
        },
      };
    case TYPES.CLEAR_STORE:
      return { ...INITIAL_STATE };
    default:
      return state;
  }
};

export const appQualityOverridesSelector = (state) => state.appQuality?.overrides || {};
export const appQualityOverrideSelector = (packageName) => (state) => state.appQuality?.overrides?.[packageName];
