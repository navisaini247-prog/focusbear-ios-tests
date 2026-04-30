package com.focusbear;

import static androidx.core.content.ContextCompat.getSystemService;

import android.annotation.SuppressLint;
import android.app.NotificationManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import java.util.Set;
import java.util.HashSet;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.turbomodule.core.interfaces.TurboModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.CxxCallbackImpl;
import org.json.JSONException;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import java.util.List;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

import android.content.pm.ApplicationInfo;
import android.util.Base64;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Map;

import android.content.pm.ResolveInfo;

import android.content.Intent;
import android.net.Uri;
import com.focusbear.NativeOverlayModuleSpec;
import com.focusbear.Events;
import com.facebook.react.bridge.WritableArray;

public class OverlayModule extends NativeOverlayModuleSpec implements TurboModule {
    private static ReactApplicationContext reactContext;
    private static OverlayModule instance;
    public static boolean isServiceRunning = false;

    public OverlayModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
        // Provide ReactApplicationContext to OverlayControl so it doesn't rely on getCurrentReactContext()
        OverlayControl.setReactContext(context);
        // Only set instance if it's null (first creation)
        if (instance == null) {
            instance = this;
            Log.d("OverlayModule", "OverlayModule singleton instance created: " + this.hashCode());
        } else {
            Log.w("OverlayModule", "Attempted to create duplicate instance: " + this.hashCode() + ", keeping original: " + instance.hashCode());
        }
    }

    // Override setEventEmitterCallback to know when JS subscribes
    @Override
    protected void setEventEmitterCallback(CxxCallbackImpl eventEmitterCallback) {
        super.setEventEmitterCallback(eventEmitterCallback);
        Log.d("OverlayModule", "setEventEmitterCallback called, mEventEmitterCallback is now set: " + (mEventEmitterCallback != null));
        // Only set as registered instance if this is the singleton instance
        if (this == instance) {
            Log.d("OverlayModule", "Set singleton as registered instance: " + this.hashCode());
        } else {
            Log.w("OverlayModule", "Ignoring setEventEmitterCallback for non-singleton instance: " + this.hashCode());
        }
    }

    // getName() is implemented in NativeOverlayModuleSpec

    public static OverlayModule getObject() {
        // Return the singleton instance
        if (instance != null) {
            Log.d("OverlayModule", "getObject() called, mEventEmitterCallback is null: " + (instance.mEventEmitterCallback == null));
            return instance;
        }
        // If no instance, return null
        Log.w("OverlayModule", "No OverlayModule instance available");
        return null;
    }

    // Method to get the instance that has the event emitter callback set
    public static OverlayModule getRegisteredInstance() {
        if (instance != null && instance.mEventEmitterCallback != null) {
            Log.d("OverlayModule", "Found registered singleton instance: " + instance.hashCode());
            return instance;
        }
        Log.w("OverlayModule", "No registered singleton instance found");
        return null;
    }

    public void sendOverlayEventToJS(String value) {
        final int valueLen = value != null ? value.length() : -1;
        Log.d(
            "OverlayModule",
            "Emitting event from instance: " + this.hashCode()
                + ", mEventEmitterCallback is null: " + (mEventEmitterCallback == null)
                + ", valueLen=" + valueLen
        );

        if (reactContext == null || !reactContext.hasActiveReactInstance()) {
            Log.w("OverlayModule", "Skipping event emit - React context is null/inactive.");
            return;
        }

        if (mEventEmitterCallback != null) {
            try {
                String preview = value;
                if (preview != null && preview.length() > 512) {
                    preview = preview.substring(0, 512) + "...(truncated)";
                }
                Log.d("OverlayModule", "Emitting event to JS payload preview: " + preview);

                emitOnOverlayEvent(value); // This is the codegen-generated method
            } catch (RuntimeException e) {
                // Extra logging for mysterious RN internal errors like "__next_prime overflow"
                Log.e(
                    "OverlayModule",
                    "RuntimeException while emitting event to JS (valueLen=" + valueLen + "): " + e.getMessage(),
                    e
                );
            } catch (Exception e) {
                Log.e("OverlayModule", "Error emitting event", e);
            }
        } else {
            Log.w("OverlayModule", "Cannot emit event - JS has not subscribed yet. Event will be lost.");
        }
    }

    @Override
    public void invalidate() {
        super.invalidate();
        Log.d("OverlayModule", "invalidate called for instance: " + this.hashCode());
        if (this == instance) {
            Log.d("OverlayModule", "Clearing singleton instance during invalidate");
            instance = null;
        }
        reactContext = null;
    }

    @Override
    @ReactMethod
    public void getPhoneID(Promise response) {
        try {
            @SuppressLint("HardwareIds") String id = Settings.Secure.getString(reactContext.getContentResolver(), Settings.Secure.ANDROID_ID);
            response.resolve(id);
        } catch (Exception e) {
            response.reject("Error", e);
        }
    }

    @Override
    @RequiresApi(api = Build.VERSION_CODES.P)
    @ReactMethod
    public void showDistractionWindow(String routineName, String activityName, boolean isFocusModeEnabled, boolean isSuperStrictMode, String reason, boolean shouldHideApp, String blockedUrl) {
        if (activityName == null) {
            return;
        }
        Log.i("Check_activityName", activityName);
        OverlayControl.getInstance(reactContext).startMethod(routineName, activityName, isFocusModeEnabled, isSuperStrictMode, reason, shouldHideApp, blockedUrl);
        // Emit event to JS using new event emitter
        try {
            WritableMap event = Arguments.createMap();
            event.putString("type", "showDistractionWindow");
            String jsonString = new org.json.JSONObject(event.toHashMap()).toString();
            
            this.sendOverlayEventToJS(jsonString);
        } catch (Exception e) {
            Log.e("OverlayModule", "Exception in sendOverlayEventToJS", e);
            e.printStackTrace();
        }
    }

    /**
     * React Method to save activity specific allowed apps.
     */
    @Override
    @ReactMethod
    public void saveActivitySpecificAllowedApps(ReadableArray allowedApps) {
        if (allowedApps == null) {
            return;
        }
        OverlayControl.activitySpecificAllowedApps.clear();
        ArrayList<String> allowedArray = new ArrayList<>();
        for (int i = 0; i < allowedApps.size(); i++) {
            String item = allowedApps.getString(i);
            allowedArray.add(item);
        }
        Set<String> uniqueAllowedApps = new HashSet<>(allowedArray);
        OverlayControl.activitySpecificAllowedApps.addAll(uniqueAllowedApps);
    }

    /**
     * React Method to start overlay schedule service.
     */
    @Override
    @RequiresApi(api = Build.VERSION_CODES.P)
    @ReactMethod
    public void startService(String routineName, String activityName, ReadableArray allowedApps, boolean useGlobalBlockList) {
        if (!isServiceRunning) {
            ArrayList<String> allowedArray = new ArrayList<>();
            if (allowedApps != null && allowedApps.size() != 0) {
                for (int i = 0; i < allowedApps.size(); i++) {
                    String item = allowedApps.getString(i);
                    allowedArray.add(item);
                }
            }

            Set<String> uniqueAllowedApps = new HashSet<>(allowedArray);
            
            SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
            shared_preference.edit().putBoolean(Constants.IS_GLOBAL_BLOCKING, useGlobalBlockList).apply();
            Log.d("OverlayModule", "Updated global blocking flag to " + useGlobalBlockList);
            
            OverlayControl.getInstance(reactContext).addListener(routineName, activityName, uniqueAllowedApps);

            isServiceRunning = true;
            // Emit event to JS using new event emitter
            try {
                WritableMap event = Arguments.createMap();
                event.putString("type", "startService");
                String jsonString = new org.json.JSONObject(event.toHashMap()).toString();
                
                this.sendOverlayEventToJS(jsonString);
            } catch (Exception e) {
                Log.e("OverlayModule", "Exception in sendOverlayEventToJS", e);
                e.printStackTrace();
            }
        }
    }

    /**
     * React Method to update global blocking flag without restarting service.
     */
    @Override
    @ReactMethod
    public void updateGlobalBlockingEnabled(boolean enabled) {
        SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        shared_preference.edit().putBoolean(Constants.IS_GLOBAL_BLOCKING, enabled).apply();
        Log.d("OverlayModule", "Updated global blocking flag to " + enabled);
    }

    /**
     * This method to stop overlay popup with timer, It includes popup design and buttons.
     */
    /**
     * Internal method to stop overlay service, checking for other active blocking sources.
     * Returns true if the service was actually stopped, false if it was kept running.
     */
    public static boolean stopOverlayServiceIfSafe(Context context) {
        // Check if there are active schedules
        boolean hasActiveSchedules = false;
        try {
            com.focusbear.blocking.BlockingScheduleManager manager = com.focusbear.blocking.BlockingScheduleManager.Companion.obtain(context);
            manager.ensureInitialized();
            java.util.List<com.focusbear.blocking.BlockingSchedule> allSchedules = manager.getSchedulesInternal();
            java.time.ZonedDateTime now = java.time.ZonedDateTime.now(java.time.ZoneId.systemDefault());
            for (com.focusbear.blocking.BlockingSchedule schedule : allSchedules) {
                // Only check custom schedules (habit schedules use global block list)
                if (schedule.contains(now) && !"habit".equals(schedule.getType())) {
                    hasActiveSchedules = true;
                    break;
                }
            }
        } catch (Exception e) {
            Log.e("OverlayModule", "Failed to check active schedules", e);
        }
        
        // Check if global blocking is active
        SharedPreferences shared_preference = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        
        // Keep service running if there are other active blocking sources
        if (hasActiveSchedules) {
            Log.d("OverlayModule", "Keeping overlay service running: activeSchedules=" + hasActiveSchedules);
            return false;
        }
        
        // No active blocking sources, safe to stop
        isServiceRunning = false;
        shared_preference.edit().putBoolean(Constants.IS_GLOBAL_BLOCKING, false).apply();
        
        OverlayControl.getInstance(context).stopService(true);
        
        // Stop foreground service when blocking stops
        android.content.Intent serviceIntent = new android.content.Intent(context, com.focusbear.ForegroundService.class);
        context.stopService(serviceIntent);
        
        // Do not emit stop event here: this method is often called during logout/app teardown,
        // and JS bridge callbacks may already be invalid.
        
        Log.d("OverlayModule", "Overlay service stopped");
        return true;
    }

    /**
     * Force stop overlay service without checking for other active blocking sources.
     * Used when pausing blocking - schedules/blocking will resume automatically when pause expires.
     */
    public static void stopOverlayServiceForce(Context context) {
        isServiceRunning = false;
        
        SharedPreferences shared_preference = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        shared_preference.edit().putBoolean(Constants.IS_GLOBAL_BLOCKING, false).apply();
        
        OverlayControl.getInstance(context).stopService(true);
        
        // Stop foreground service when blocking stops
        android.content.Intent serviceIntent = new android.content.Intent(context, com.focusbear.ForegroundService.class);
        context.stopService(serviceIntent);
        
        // Do not emit stop event here: this method is often called during logout/app teardown,
        // and JS bridge callbacks may already be invalid.
        
        Log.d("OverlayModule", "Overlay service force stopped (pause)");
    }

    @Override
    @ReactMethod
    public void stopOverlayService(Promise promise) {
        boolean stopped = stopOverlayServiceIfSafe(reactContext);
        promise.resolve(null);
    }

    /**
     * This method to stop overlay popup with timer, It includes popup design and buttons.
     */
    @Override
    @ReactMethod
    public void storeUpcomingRoutineMessage(String routine_name, String activity_name, ReadableArray allowed_apps, Promise promise) {
        SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = shared_preference.edit();
        ArrayList<String> allowedArray = new ArrayList<>();
        for (int i = 0; i < allowed_apps.size(); i++) {
            String item = allowed_apps.getString(i);
            allowedArray.add(item);
        }
        Set<String> set = new HashSet<String>();
        set.addAll(allowedArray);

        editor.putString(Constants.ROUTINE_NAME, routine_name);
        editor.putString(Constants.ACTIVITY_NAME, activity_name);
        editor.putStringSet(Constants.ALLOWED_APPS, set);
        editor.apply();
    }

    /**
     * This method save allowed apps data into local cache.
     */
    @Override
    @ReactMethod
    public void saveAllowedAppsPreference(ReadableArray allowed_apps, Promise promise) {
        SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = shared_preference.edit();
        ArrayList<String> allowedArray = new ArrayList<>();
        for (int i = 0; i < allowed_apps.size(); i++) {
            String item = allowed_apps.getString(i);
            allowedArray.add(item);
        }
        Set<String> set = new HashSet<String>(allowedArray);

        // Update Allowed apps Array when user change it in allowed list
        if (OverlayControl.allowedApps != null) {
            OverlayControl.allowedApps.clear();
            OverlayControl.allowedApps.addAll(set);
        }
        editor.putStringSet(Constants.ALLOWED_APPS_DATA, set);
        editor.apply();
        NativeBlockingLogger.logBlockingEvent(
                reactContext,
                "global_allowed_apps_updated apps=" + NativeBlockingLogger.formatBlockedPreviewLabels(
                                reactContext,
                                set,
                                NativeBlockingLogger.DEFAULT_BLOCKED_PREVIEW_MAX_PRIMARY)
        );
    }

    @Override
    @ReactMethod
    public void saveBlockedAppsPreference(ReadableArray blocked_apps, Promise promise) {
        SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = shared_preference.edit();
        ArrayList<String> blockedAppsArray = new ArrayList<>();
        for (int i = 0; i < blocked_apps.size(); i++) {
            String item = blocked_apps.getString(i);
            blockedAppsArray.add(item);
        }
        Set<String> set = new HashSet<String>(blockedAppsArray);

        Log.d("OverlayModule", "Saving blocked apps to SharedPreferences: input size=" + blocked_apps.size() + 
            ", set size=" + set.size());

        // Save global blocked apps to SharedPreferences
        editor.putStringSet(Constants.BLOCKED_APPS_DATA, set);
        boolean applied = editor.commit(); // Use commit() instead of apply() to ensure it's written immediately
        
        // Verify what was saved
        Set<String> saved = shared_preference.getStringSet(Constants.BLOCKED_APPS_DATA, null);
        Log.d("OverlayModule", "Saved blocked apps verification: commit=" + applied + 
            ", saved size=" + (saved != null ? saved.size() : 0));
        NativeBlockingLogger.logBlockingEvent(
                reactContext,
                "global_blocked_apps_updated apps=" + NativeBlockingLogger.formatBlockedPreviewLabels(
                                reactContext,
                                saved != null ? saved : new HashSet<String>(),
                                NativeBlockingLogger.DEFAULT_BLOCKED_PREVIEW_MAX_PRIMARY)
        );

        // Recalculate blocked apps: merge global + active schedules
        // This ensures active schedules' blocked apps are preserved
        com.focusbear.blocking.BlockingScheduleManager manager = com.focusbear.blocking.BlockingScheduleManager.Companion.obtain(reactContext);
        manager.ensureInitialized();
        manager.recalculateBlockedAppsAfterGlobalUpdate(reactContext);
        
        promise.resolve(null);
    }

    public static String convert(Bitmap bitmap) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream);

        return Base64.encodeToString(outputStream.toByteArray(), Base64.DEFAULT);
    }

    public static Bitmap drawableToBitmap(Drawable drawable) {
        if (drawable instanceof BitmapDrawable) {
            return ((BitmapDrawable) drawable).getBitmap();
        }

        int width = drawable.getIntrinsicWidth();
        width = width > 0 ? width : 1;
        int height = drawable.getIntrinsicHeight();
        height = height > 0 ? height : 1;

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        drawable.draw(canvas);

        return bitmap;
    }

    private String saveIconToFile(Bitmap iconBitmap, String fileName, Context context) {
        File cacheDir = new File(context.getCacheDir(), "icons");
        if (!cacheDir.exists() && !cacheDir.mkdirs()) {
            Log.e("OverlayModule", "Failed to create directory for icons");
            return null;
        }
        File iconFile = new File(cacheDir, fileName + ".png");
        try (FileOutputStream fos = new FileOutputStream(iconFile)) {
            iconBitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
            fos.flush();
            return iconFile.getAbsolutePath();
        } catch (IOException e) {
            Log.e("OverlayModule", "Error saving icon to file", e);
            return null;
        }
    }

    @Override
    @ReactMethod
    public void getApps(Promise promise) {
        try {
            PackageManager pm = this.reactContext.getPackageManager();
            Set<String> packageNameSet = new HashSet<>();
            packageNameSet.clear();
            WritableArray list = Arguments.createArray();
            Intent launcherIntent = new Intent(Intent.ACTION_MAIN, null);
            launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolveInfoList;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                resolveInfoList = pm.queryIntentActivities(launcherIntent,
                        PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL));
            } else {
                resolveInfoList = pm.queryIntentActivities(launcherIntent, 0);
            }

            Set<String> excludedPackageNames = OverlayControl.getInstance(reactContext)
                    .getExcludedPackageNames(reactContext);

            for (ResolveInfo resolveInfo : resolveInfoList) {
                String packageName = resolveInfo.activityInfo.packageName;
                if (!excludedPackageNames.contains(packageName)) {
                    packageNameSet.add(packageName);
                }
            }

            Map<String, UsageStats> stats = new java.util.HashMap<>();
            if (PermissionUtils.hasUsageStatsPermission(reactContext)) {
                UsageStatsManager usageStatsManager = (UsageStatsManager) reactContext
                        .getSystemService(Context.USAGE_STATS_SERVICE);
                if (usageStatsManager != null) {
                    long endTime = System.currentTimeMillis();
                    long startTime = endTime - (24 * 60 * 60 * 1000); // 24 hours
                    try {
                        stats = usageStatsManager.queryAndAggregateUsageStats(startTime, endTime);
                    } catch (SecurityException e) {
                        Log.w("OverlayModule", "Usage stats access not granted: " + e.getMessage());
                    }
                }
            }

            for (String packageName : packageNameSet) {
                ApplicationInfo appInfo = pm.getApplicationInfo(packageName, 0);

                UsageStats appUsageStats = stats.get(packageName);

                WritableMap appData = Arguments.createMap();
                appData.putString("packageName", packageName);
                appData.putString("appName", ((String) appInfo.loadLabel(pm)).trim());

                if (appUsageStats != null) {
                    appData.putString("usageTime", String.valueOf(appUsageStats.getTotalTimeInForeground()));
                }

                Drawable icon = pm.getApplicationIcon(appInfo);
                Bitmap bitmapIcon = drawableToBitmap(icon);
                String iconPath = saveIconToFile(bitmapIcon, packageName, reactContext);
                if (iconPath != null) {
                    appData.putString("icon", "file://" + iconPath);
                } else {
                    // Fallback to base64 if file save fails
                    appData.putString("icon", convert(bitmapIcon));
                }

                appData.putString("category", getAppCategory(appInfo));

                list.pushMap(appData);
            }
            promise.resolve(list);
        } catch (Exception ex) {
            promise.reject(ex);
        }
    }

    public String getAppCategory(ApplicationInfo appInfo) {
        if (appInfo.packageName.equals("com.netflix.mediaclient")) {
            return "Social";
        }

        switch (appInfo.category) {
            case ApplicationInfo.CATEGORY_GAME:
                return "Game";
            case ApplicationInfo.CATEGORY_NEWS:
                return "News";
            case ApplicationInfo.CATEGORY_SOCIAL:
                return "Social";
            case ApplicationInfo.CATEGORY_VIDEO:
                return "Social";
            default:
                return "Misc";
        }
    }

    @Override
    @ReactMethod
    public void saveInstalledApps() {
        OverlayControl overlayControl = OverlayControl.getInstance(reactContext);
        if (overlayControl == null) {
            return;
        }
        overlayControl.cacheInstalledApps();
    }

    @Override
    @ReactMethod
    public void openOverlayPermission() {
        Log.d("OverlayModule", "openOverlayPermission called");
        Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + this.reactContext.getPackageName()));
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); // Start the activity in a new task
        this.reactContext.startActivity(intent);
    }

    @Override
    @ReactMethod
    public void saveRestrictedAppsListType(String restrictedAppListType) {
        SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = shared_preference.edit();
        editor.putString(Constants.RESTRICTED_APP_LIST_TYPE, restrictedAppListType);
        editor.apply();
    }

    // Ask Permission for Notification Policy to Enable/Disable DND.
    @Override
    @ReactMethod
    public void requestNotificationPolicyDNDPermission() {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK); // Start the activity in a new task
        reactContext.startActivity(intent);
    }

    // Check Notification Policy Permission to Enable/Disable DND.
    public Boolean checkIsNotificationPolicyDNDPermissionGranted() {
        NotificationManager mNotificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);
        if (mNotificationManager != null) {
            return mNotificationManager.isNotificationPolicyAccessGranted();
        }
        Log.w("DND_PERMISSION", "NotificationManager is null, cannot check DND permission.");
        return false;
    }

    @Override
    @ReactMethod
    public void isNotificationPolicyDNDPermissionEnabled(Promise promise) {
        try {
            boolean isGranted = checkIsNotificationPolicyDNDPermissionGranted();
            promise.resolve(isGranted);
        } catch (Exception e) {
            Log.e("ERROR_CHECKING_PERMISSION", "An unexpected error occurred while checking the DND permission.", e);
            promise.reject("ERROR_CHECKING_PERMISSION", "An unexpected error occurred while checking the DND permission.", e);
        }
    }

    @Override
    @ReactMethod
    public void shouldEnableDNDMode(boolean shouldEnable) {
        NotificationManager mNotificationManager = (NotificationManager) reactContext.getSystemService(Context.NOTIFICATION_SERVICE);

        if (mNotificationManager != null) {
            // Check if DND permission is granted
            if (checkIsNotificationPolicyDNDPermissionGranted()) {
                if (shouldEnable) {
                    // Turn On DND Mode - Use INTERRUPTION_FILTER_ALARMS to block notifications
                    // but allow alarms and media playback (e.g., Spotify) to continue
                    mNotificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALARMS);
                } else {
                    // Turn Off DND Mode
                    mNotificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
                }
            } else {
                Log.w("DND_PERMISSION", "DND permission is not granted. Cannot enable or disable DND mode.");
            }
        } else {
            Log.e("DND_MANAGER", "NotificationManager is null. Cannot manage DND mode.");
        }
    }

    @Override
    @ReactMethod
    public void goBackToDeviceHome() {
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        reactContext.startActivity(startMain);
    }

    @Override
    @ReactMethod
    public void saveCustomBlockedMessage(String message) {
        SharedPreferences shared_preference = reactContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = shared_preference.edit();
        editor.putString(Constants.CUSTOM_BLOCKED_MESSAGE, message);
        editor.apply();
        Log.d("OverlayModule", "Saved custom blocked message: " + message);
    }

    @Override
    @ReactMethod
    public void updateSoftBlockSettings(
        boolean easySkipEnabled,
        boolean isInFocusMode,
        String currentScreen,
        String bypassPackageId,
        double bypassUntil,
        String unblockingReason
    ) {
        OverlayControl.updateSoftBlockSettings(
            easySkipEnabled,
            isInFocusMode,
            currentScreen,
            bypassPackageId,
            (long) bypassUntil,
            unblockingReason
        );
        Log.d("OverlayModule", "Updated soft block settings: easySkipEnabled=" + easySkipEnabled 
            + ", isInFocusMode=" + isInFocusMode 
            + ", currentScreen=" + currentScreen
            + ", bypassPackageId=" + bypassPackageId
            + ", bypassUntil=" + bypassUntil 
            + ", unblockingReason=" + unblockingReason);
    }

}
