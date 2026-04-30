package com.focusbear;

import static android.content.Context.MODE_PRIVATE;
import static android.content.Context.POWER_SERVICE;

import android.annotation.TargetApi;
import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.widget.Toast;
import androidx.annotation.RequiresApi;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.google.gson.Gson;

import java.util.Calendar;
import java.util.List;
import java.util.Map;
import android.util.Log;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Objects;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import android.content.pm.ApplicationInfo;

public class UsagePermissionModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    public UsagePermissionModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }

    @NonNull
    @Override
    public String getName() {
        return "UsagePermissionModule";
    }


    /**
     * Get the app name from package name
     * @param packageName The package name of the app
     * @return The app name or empty string if not found
     */
    public String getAppName(String packageName) {
        PackageManager packageManager = reactContext.getPackageManager();
        String appName = "";
        try {
            appName = (String) packageManager.getApplicationLabel(packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA));
        } catch (PackageManager.NameNotFoundException e) {
            Log.e("UsagePermissionModule", "App not found: " + packageName);
        }
        return appName;
    }

    /**
     * Requests the enabling of the usage access setting for EST.
     */
    @ReactMethod
    private void requestUsageAccess() {
        Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Toast.makeText(reactContext, "  Allow usage access for Focus Bear  ", Toast.LENGTH_LONG).show();
        if (reactContext.getCurrentActivity() != null) {
            reactContext.getCurrentActivity().startActivity(intent);
        } else {
            reactContext.startActivity(intent);
        }
    }

    /**
     * request app usage access setting for EST.
     */
    @ReactMethod
    public void requestAppUsageAccessPermission(Promise promise) {

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve(true);
            return;
        }
        final AppOpsManager appOps = (AppOpsManager) reactContext.getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), reactContext.getPackageName());
        if (mode == AppOpsManager.MODE_ALLOWED) {
            promise.resolve(true);
            return;
        }
        appOps.startWatchingMode(AppOpsManager.OPSTR_GET_USAGE_STATS,
                reactContext.getApplicationContext().getPackageName(),
                new AppOpsManager.OnOpChangedListener() {
                    @Override
                    @TargetApi(Build.VERSION_CODES.M)
                    public void onOpChanged(String op, String packageName) {
                        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), reactContext.getPackageName());
                        if (mode != AppOpsManager.MODE_ALLOWED) {
                            return;
                        }
                        appOps.stopWatchingMode(this);
                        Intent intent = new Intent(reactContext, MainActivity.class);
                        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                        if (reactContext.getCurrentActivity() != null) {
                            reactContext.getCurrentActivity().startActivity(intent);
                        } else {
                            reactContext.startActivity(intent);
                        }
                    }
                });
        requestUsageAccess();
        promise.resolve(false);
    }


    /**
     * Checks whether the user has enabled the usage access setting for EST.
     */
    @ReactMethod
    public void isUsageAccessEnabled(Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve(true);
        }

        boolean granted = false;
        AppOpsManager appOps = (AppOpsManager) getReactApplicationContext()
                .getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS,
                android.os.Process.myUid(), getReactApplicationContext().getPackageName());
        if (mode == AppOpsManager.MODE_DEFAULT) {
            granted = (getReactApplicationContext().checkCallingOrSelfPermission(android.Manifest.permission.PACKAGE_USAGE_STATS) == PackageManager.PERMISSION_GRANTED);
        } else {
            granted = (mode == AppOpsManager.MODE_ALLOWED);
        }
        promise.resolve(granted);
    }

    /**
     * Request dialog for ignoring Battery optimisation for this app.
     *
     * @param promise
     */
    @ReactMethod
    public void ignoreBatteryOptimisation(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean granted = false;
            Intent intent = new Intent();
            String packageName = reactContext.getPackageName();
            PowerManager pm = (PowerManager) reactContext.getSystemService(POWER_SERVICE);
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.setData(Uri.parse("package:" + packageName));
                reactContext.startActivity(intent);
            }
            promise.resolve(!pm.isIgnoringBatteryOptimizations(packageName));
        }
    }

    /**
     * Request dialog for ignoring Battery optimization for this app.
     * Returns an intent for requesting the permission, but does not trigger anything.
     *
     * @param promise
     */
    @ReactMethod
    public void getIgnoreBatteryOptimisationPermission(Promise promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean granted = false;
            Intent intent = new Intent();
            String packageName = reactContext.getPackageName();
            PowerManager pm = (PowerManager) reactContext.getSystemService(POWER_SERVICE);
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                promise.resolve(false); // Return the intent to be handled by the caller
            } else {
                promise.resolve(true); // Return null if already granted
            }
        } else {
            promise.resolve(false); // Return null for devices below Android M
        }
    }

    /**
     * return true if in App's Battery settings "Not optimized" and false if "Optimizing battery use"
     */
    @ReactMethod
    public void checkBatteryOptimisation() {

    }

    private static class AppUsageInfo {
        long timeInForeground;
        int launchCount;
        long lastTimeUsed;

        AppUsageInfo() {
            this.timeInForeground = 0;
            this.launchCount = 0;
            this.lastTimeUsed = 0;
        }
    }

    /**
     * Returns true if the app has been granted usage stats access (PACKAGE_USAGE_STATS).
     */
    @RequiresApi(api = Build.VERSION_CODES.LOLLIPOP)
    private HashMap<String, AppUsageInfo> queryUsageStatistics(long startTime, long endTime) {
        UsageEvents.Event currentEvent;
        List<UsageEvents.Event> allEvents = new ArrayList<>();
        HashMap<String, AppUsageInfo> map = new HashMap<>();
        UsageStatsManager mUsageStatsManager = (UsageStatsManager) reactContext.getSystemService(Context.USAGE_STATS_SERVICE);
        if (mUsageStatsManager == null) return map;

        try {
            // Query the events from startTime till endTime
            UsageEvents usageEvents = mUsageStatsManager.queryEvents(startTime, endTime);

        // Go over all events
        while (usageEvents.hasNextEvent()) {
            currentEvent = new UsageEvents.Event();
            usageEvents.getNextEvent(currentEvent);
            
            if (currentEvent.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED || 
                currentEvent.getEventType() == UsageEvents.Event.ACTIVITY_PAUSED) {
                allEvents.add(currentEvent);
                String packageName = currentEvent.getPackageName();
                if (!map.containsKey(packageName)) {
                    map.put(packageName, new AppUsageInfo());
                }
            }
        }

        // log allEvents


        // Iterate through all events
        for (int i = 0; i < allEvents.size() - 1; i++) {
            UsageEvents.Event event0 = allEvents.get(i);
            UsageEvents.Event event1 = allEvents.get(i + 1);

            if (event0.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED &&
                event1.getEventType() == UsageEvents.Event.ACTIVITY_PAUSED &&
                event0.getClassName().equals(event1.getClassName())) {

                long diff = event1.getTimeStamp() - event0.getTimeStamp();
                AppUsageInfo info = Objects.requireNonNull(map.get(event0.getPackageName()));
                info.timeInForeground += diff;
                info.lastTimeUsed = event1.getTimeStamp();
                info.launchCount++;

                Log.d("UsagePermissionModule", "Session for " + event0.getPackageName() + ": " +
                        (diff / 1000) + " seconds | Launch count: " + info.launchCount);
            }
        }
        // Handle the current foreground app
        if (!allEvents.isEmpty()) {
            UsageEvents.Event lastEvent = allEvents.get(allEvents.size() - 1);
            if (lastEvent.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                long currentTime = System.currentTimeMillis();
                long diff = currentTime - lastEvent.getTimeStamp();
                AppUsageInfo info = Objects.requireNonNull(map.get(lastEvent.getPackageName()));
                info.timeInForeground += diff;
                info.lastTimeUsed = currentTime;
            }
        }

        return map;
        } catch (SecurityException e) {
            Log.w("UsagePermissionModule", "Usage stats access not granted: " + e.getMessage());
            return map;
        }
    }

    @ReactMethod
    public void getAppUsageStats(double startTime, double endTime, Promise promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            promise.resolve(Arguments.createArray());
            return;
        }
        if (!PermissionUtils.hasUsageStatsPermission(reactContext)) {
            Log.w("UsagePermissionModule", "Usage stats access not granted, returning empty stats");
            promise.resolve(Arguments.createArray());
            return;
        }

        try {
            HashMap<String, AppUsageInfo> usageStats = queryUsageStatistics((long)startTime, (long)endTime);
            WritableArray result = Arguments.createArray();
            
            for (Map.Entry<String, AppUsageInfo> entry : usageStats.entrySet()) {
                String packageName = entry.getKey();
                AppUsageInfo info = entry.getValue();
                
                WritableMap statMap = Arguments.createMap();
                statMap.putString("packageName", packageName);
                statMap.putString("appName", getAppName(packageName));
                statMap.putDouble("totalTimeUsed", info.timeInForeground);
                statMap.putDouble("lastTimeUsed", info.lastTimeUsed);
                statMap.putInt("launchCount", info.launchCount);
                try {
                    ApplicationInfo appInfo = reactContext.getPackageManager().getApplicationInfo(packageName, 0);
                    statMap.putDouble("category", appInfo.category);
                } catch (PackageManager.NameNotFoundException e) {
                    statMap.putDouble("category", 0);
                }
                result.pushMap(statMap);
            }
            promise.resolve(result);
        } catch (Exception e) {
            Log.e("UsagePermissionModule", "Error getting usage stats: " + e.getMessage());
            promise.reject("ERROR", e.getMessage());
        }
    }

    /**
     * Calculate time saved based on usage statistics and block durations
     * @param usageStats Array of usage statistics
     * @param blockDurations Map of package names to block durations in milliseconds
     * @param promise Promise to resolve with time saved
     */
    @ReactMethod
    public void calculateTimeSaved(ReadableArray usageStats, ReadableMap blockDurations, Promise promise) {
        try {
            long totalTimeSaved = 0;
            
            for (int i = 0; i < usageStats.size(); i++) {
                ReadableMap stat = usageStats.getMap(i);
                String packageName = stat.getString("packageName");
                long timeInForeground = (long) stat.getDouble("totalTimeInForeground");
                
                if (blockDurations.hasKey(packageName)) {
                    long blockDuration = (long) blockDurations.getDouble(packageName);
                    // Calculate time saved based on block duration
                    totalTimeSaved += Math.min(timeInForeground, blockDuration);
                }
            }
            
            WritableMap result = Arguments.createMap();
            result.putDouble("timeSaved", totalTimeSaved);
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
