package com.focusbear;

import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class Events {
    private ReactContext reactContext;
    public static Events events = null;

    private Events(ReactContext reactContext){
        this.reactContext = reactContext;
    }

    private Events(){

    }

    public static Events getInstance(ReactContext reactContext) {
        if (events == null) {
            events = new Events(reactContext);
        } else {
            events.reactContext = reactContext;
        }
        return events;
    }
    /**
     * Send event to javascript side from android side.
     * @param eventName "OVERLAY_SERVICE"
     * @param params
     */
    public void sendEvent(String eventName, @Nullable WritableMap params) {
        if (reactContext != null) {
            try {
                reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, params);
            } catch (Exception e) {
                // Handle any exceptions that occur during event emission
                Log.e("EventEmitter", "Failed to emit event: ");
            }
        } else {
            if (eventName != null) {
                Log.e("EventEmitter", "ReactContext is null. Event not emitted: " + eventName);
            } else {
                Log.e("EventEmitter", "eventName is null");
            }
        }
    }


}
