package com.focusbear;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import android.content.Intent;

public class WindowModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;
    private static final String TAG = "WindowModule";

    public WindowModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "Window";
    }

    @ReactMethod
    public void openDeepLinkOverlay(String deepLinkUrl) {
        try {
            Window window = Window.getInstance(reactContext);
            Log.d(TAG, "Window instance: " + window);
            if (window != null) {
               window.openDeepLinkOverlay(deepLinkUrl);
            } else {
                Log.e(TAG, "Window instance is null");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in openDeepLinkOverlay: " + e.getMessage());
        }
    }
} 