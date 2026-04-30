import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

export const INITIAL_STORE_STATE = {
  routine: {
    fullRoutineData: { shutdown_time: "17:30", startup_time: "09:00" },
  },
  activity: {},
  global: {
    isOverlayPermissionGranted: false,
  },
  user: {
    user: {},
    userLocalDeviceSettingsData: {},
  },
};

let currentState = { ...INITIAL_STORE_STATE };

const store = mockStore(() => {
  // allows manipulation of state via tests
  return currentState;
});

// Function to reset the store with default state or new state
// Used by tests to change the current store state
export const resetStore = (newState) => {
  currentState = newState;
  store.dispatch({ type: "@@INIT" }); // Trigger re-evaluation of the getState
};

// Ensure all modules get the same store instance
export default store;

export { store };
