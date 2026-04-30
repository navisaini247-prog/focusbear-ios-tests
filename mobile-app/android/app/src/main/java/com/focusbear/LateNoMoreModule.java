package com.focusbear;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class LateNoMoreModule extends ReactContextBaseJavaModule {
    public static final String NAME = "LateNoMoreModule";

    public LateNoMoreModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @ReactMethod
    public void startService() {
        ForegroundService.startService(getReactApplicationContext());
    }

    @ReactMethod
    public void stopService() {
        ForegroundService.stopService(getReactApplicationContext());
    }
}