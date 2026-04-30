package com.focusbear;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import java.util.ArrayList;
import java.util.List;

import android.content.ComponentName;
import android.content.Context;
import org.json.JSONArray;
import android.content.Intent;
import android.provider.Settings;
import android.accessibilityservice.AccessibilityServiceInfo;
import android.view.accessibility.AccessibilityManager;

public class AccessibilityModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    public AccessibilityModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return "AccessibilityModule";
    }

    @ReactMethod
    public void checkAccessibilityPermission(Promise promise) {
        try {
            AccessibilityManager am = (AccessibilityManager) reactContext.getSystemService(ReactApplicationContext.ACCESSIBILITY_SERVICE);
            if (am == null) {
                promise.resolve(false);
                return;
            }

            String enabledServices = Settings.Secure.getString(
                reactContext.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );

            if (enabledServices == null) {
                promise.resolve(false);
                return;
            }

            String packageName = reactContext.getPackageName();
            if (enabledServices.contains(packageName)) {
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void grantAccessibilityPermission(Promise promise) {
        try {
            Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            reactContext.startActivity(intent);
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void revokeAccessibilityPermission(Promise promise) {
        try {
            String enabledServices = Settings.Secure.getString(
                reactContext.getContentResolver(),
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );

            if (enabledServices != null) {
                String packageName = reactContext.getPackageName();
                String[] services = enabledServices.split(":");
                StringBuilder newServices = new StringBuilder();
                boolean isFirst = true;

                for (String service : services) {
                    if (!service.contains(packageName)) {
                        if (!isFirst) {
                            newServices.append(":");
                        }
                        newServices.append(service);
                        isFirst = false;
                    }
                }

                Settings.Secure.putString(
                    reactContext.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
                    newServices.toString()
                );
                promise.resolve(true);
            } else {
                promise.resolve(false);
            }
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setRestrictedAddresses(ReadableArray addresses, Promise promise) {
        try {
            List<String> addressList = new ArrayList<>();
            for (int i = 0; i < addresses.size(); i++) {
                addressList.add(addresses.getString(i));
            }

            // Persist global block list and recalculate blocked URLs list (global + schedule URLs)
            Context ctx = reactContext.getApplicationContext();
            if (ctx != null) {
                JSONArray json = new JSONArray();
                for (String url : addressList) {
                    json.put(url);
                }
                ctx.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE)
                        .edit()
                        .putString(Constants.RESTRICTED_ADDRESSES_DATA, json.toString())
                        .apply();
                com.focusbear.blocking.BlockingScheduleManager.obtain(ctx).recalculateBlockedUrlsFromGlobalAndSchedules();
            } else {
                AccessibilityUtils.getInstance().setRestrictedAddresses(addressList);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
} 