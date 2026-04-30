import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { Provider } from "react-redux";
import configureStore from "redux-mock-store";
import { ROUTINE_NAMES } from "@/constants";
import { isAfterCutOffTime } from "@/utils/TimeMethods";
import { useIsPasswordRequired } from "./use-is-password-required";

jest.mock("@/utils/TimeMethods", () => ({
  isAfterCutOffTime: jest.fn(),
}));

const mockStore = configureStore([]);

describe("useIsPasswordRequired", () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      routine: {
        fullRoutineData: {
          startupTime: "08:00",
          shutdownTime: "22:00",
        },
      },
      user: {
        userLocalDeviceSettingsData: {
          MacOS: {
            kAppPassword: "test-password",
            kIsPasswordRequireInSkipMorning: false,
            kIsPasswordRequireInSkipEvening: false,
            kIsPasswordRequireInSkipEveningAfterCutOff: false,
          },
        },
      },
    });
  });

  const renderUseIsPasswordRequired = (routineName) =>
    renderHook(() => useIsPasswordRequired(routineName), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

  test("should return false if userUnlockPassword is not set", () => {
    store = mockStore({
      ...store.getState(),
      user: {
        userLocalDeviceSettingsData: {
          MacOS: {
            kAppPassword: null, // No password set
            kIsPasswordRequireInSkipMorning: true,
          },
        },
      },
    });

    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.MORNING);
    expect(result.current).toBe(false);
  });

  test("should return true if password is required for morning routine", () => {
    store = mockStore({
      ...store.getState(),
      user: {
        userLocalDeviceSettingsData: {
          MacOS: {
            kAppPassword: "test-password",
            kIsPasswordRequireInSkipMorning: true,
          },
        },
      },
    });

    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.MORNING);
    expect(result.current).toBe(true);
  });

  test("should return false if password is not required for morning routine", () => {
    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.MORNING);
    expect(result.current).toBe(false);
  });

  test("should return true if password is required for evening routine", () => {
    store = mockStore({
      ...store.getState(),
      user: {
        userLocalDeviceSettingsData: {
          MacOS: {
            kAppPassword: "test-password",
            kIsPasswordRequireInSkipEvening: true,
          },
        },
      },
    });

    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.EVENING);
    expect(result.current).toBe(true);
  });

  test("should return false if password is not required for evening routine", () => {
    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.EVENING);
    expect(result.current).toBe(false);
  });

  test("should return true if password is required after cutoff time", () => {
    isAfterCutOffTime.mockReturnValue(true);

    store = mockStore({
      ...store.getState(),
      user: {
        userLocalDeviceSettingsData: {
          MacOS: {
            kAppPassword: "test-password",
            kIsPasswordRequireInSkipEveningAfterCutOff: true,
          },
        },
      },
    });

    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.EVENING);
    expect(result.current).toBe(true);
  });

  test("should return false if password is required but the time is before cutoff time", () => {
    isAfterCutOffTime.mockReturnValue(false);

    store = mockStore({
      ...store.getState(),
      user: {
        userLocalDeviceSettingsData: {
          MacOS: {
            kAppPassword: "test-password",
            kIsPasswordRequireInSkipEveningAfterCutOff: true,
          },
        },
      },
    });

    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.EVENING);
    expect(result.current).toBe(false);
  });

  test("should return false if password is not required after cutoff time", () => {
    isAfterCutOffTime.mockReturnValue(true);

    const { result } = renderUseIsPasswordRequired(ROUTINE_NAMES.EVENING);
    expect(result.current).toBe(false);
  });
});
