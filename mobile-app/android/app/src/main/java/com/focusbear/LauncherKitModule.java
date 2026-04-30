package com.focusbear;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

import android.app.ActivityOptions;
import android.content.ActivityNotFoundException;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.ApplicationInfo;
import android.content.Intent;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import javax.annotation.Nullable;

import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.Rect;
import android.graphics.Paint;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import com.facebook.react.bridge.Callback;
import android.provider.Settings;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import java.util.HashSet;
import java.util.Set;

import android.content.BroadcastReceiver;

import android.util.Log;
import org.json.JSONObject;
import org.json.JSONArray;

import android.graphics.drawable.AdaptiveIconDrawable;
import android.provider.AlarmClock;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

@ReactModule(name = LauncherKitModule.NAME)
public class LauncherKitModule extends ReactContextBaseJavaModule {
  public static final String NAME = "LauncherKit";
  private final ReactApplicationContext reactContext;

  public LauncherKitModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  // Enhanced AppDetail class with new features
  private class EnhancedAppDetail {
    CharSequence label;
    CharSequence packageName;
    Drawable icon;
    String iconPath;
    String version;
    String accentColor;

    /**
     * Enhanced constructor for new features
     *
     * @param ri                 ResolveInfo for the app
     * @param pManager           PackageManager instance
     * @param context            Context of the application
     * @param includeVersion     Flag to include version information
     * @param includeAccentColor Flag to include accent color calculation
     */
    public EnhancedAppDetail(ResolveInfo ri, PackageManager pManager, Context context, boolean includeVersion, boolean includeAccentColor) {
      this.label = ri.loadLabel(pManager);
      this.packageName = ri.activityInfo.packageName;
      this.icon = ri.loadIcon(pManager);

      // Process the icon to a Bitmap
      Bitmap iconBitmap = drawableToBitmap(this.icon);
      if (iconBitmap != null) {
        this.iconPath = saveIconToFile(iconBitmap, this.packageName.toString(), context);
      }

      if (includeVersion) {
        try {
          PackageInfo packageInfo = pManager.getPackageInfo(this.packageName.toString(), 0);
          this.version = packageInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
          Log.e("AppUtils", "Package not found", e);
          this.version = "Unknown";
        }
      }

      if (includeAccentColor && iconBitmap != null) {
        this.accentColor = getAccentColor(iconBitmap);
      }
    }

    private Bitmap drawableToBitmap(Drawable drawable) {
      if (drawable instanceof BitmapDrawable) {
        return ((BitmapDrawable) drawable).getBitmap();
      } else {
        int width = Math.max(drawable.getIntrinsicWidth(), 1);
        int height = Math.max(drawable.getIntrinsicHeight(), 1);
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        drawable.setBounds(0, 0, width, height);
        drawable.draw(canvas);
        return bitmap;
      }
    }

    private String saveIconToFile(Bitmap iconBitmap, String fileName, Context context) {
      File cacheDir = new File(context.getCacheDir(), "icons");
      if (!cacheDir.exists() && !cacheDir.mkdirs()) {
        Log.e("AppUtils", "Failed to create directory for icons");
        return null;
      }
      File iconFile = new File(cacheDir, fileName + ".png");
      try (FileOutputStream fos = new FileOutputStream(iconFile)) {
        iconBitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
        fos.flush();
        return iconFile.getAbsolutePath();
      } catch (IOException e) {
        Log.e("AppUtils", "Error saving icon to file", e);
        return null;
      }
    }

    private String getAccentColor(Bitmap bitmap) {
      // Simplified accent color - just return a default color for now
      // TODO: Could implement basic color extraction without Palette library
      return "#1976D2"; // Default blue color
    }

    @Override
    public String toString() {
      try {
        JSONObject json = new JSONObject();
        json.put("label", label != null ? label.toString() : "");
        json.put("packageName", packageName != null ? packageName.toString() : "");
        json.put("icon", iconPath != null ? "file://" + iconPath : "");
        json.put("version", version != null ? version : "");
        json.put("accentColor", accentColor != null ? accentColor : "");
        return json.toString();
      } catch (Exception e) {
        Log.e("LauncherKitModule", "Error creating JSON for app: " + packageName, e);
        return "{\"label\":\"\",\"packageName\":\"\",\"icon\":\"\",\"version\":\"\",\"accentColor\":\"\"}";
      }
    }
  }


  private class DeviceDetails {
    CharSequence deviceId;
    CharSequence bundleId;
    CharSequence systemName;
    CharSequence systemVersion;
    CharSequence appVersion;
    CharSequence buildNumber;
    CharSequence appName;
    CharSequence brand;
    CharSequence model;
    public String toString() {
      try {
        JSONObject json = new JSONObject();
        json.put("deviceId", deviceId != null ? deviceId.toString() : "");
        json.put("bundleId", bundleId != null ? bundleId.toString() : "");
        json.put("systemName", systemName != null ? systemName.toString() : "");
        json.put("systemVersion", systemVersion != null ? systemVersion.toString() : "");
        json.put("appVersion", appVersion != null ? appVersion.toString() : "");
        json.put("buildNumber", buildNumber != null ? buildNumber.toString() : "");
        json.put("appName", appName != null ? appName.toString() : "");
        json.put("brand", brand != null ? brand.toString() : "");
        json.put("model", model != null ? model.toString() : "");
        return json.toString();
      } catch (Exception e) {
        Log.e("LauncherKitModule", "Error creating JSON for device details", e);
        return "{\"deviceId\":\"\",\"bundleId\":\"\",\"systemName\":\"\",\"systemVersion\":\"\",\"appVersion\":\"\",\"buildNumber\":\"\",\"appName\":\"\",\"brand\":\"\",\"model\":\"\"}";
      }
    }
  }

  private class AppDetail {
    CharSequence appName;
    CharSequence packageName;
    Drawable icon;
    public String toString() {
      try {
        Bitmap icon;
        if(this.icon.getIntrinsicWidth() <= 0 || this.icon.getIntrinsicHeight() <= 0) {
          icon = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888); // Single color bitmap will be created of 1x1 pixel
        } else {
          icon = Bitmap.createBitmap(this.icon.getIntrinsicWidth(), this.icon.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
        }
        final Canvas canvas = new Canvas(icon);
        this.icon.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
        this.icon.draw(canvas);

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        icon.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
        byte[] byteArray = byteArrayOutputStream.toByteArray();
        String encoded = Base64.encodeToString(byteArray, Base64.NO_WRAP);

        JSONObject json = new JSONObject();
        json.put("appName", appName != null ? appName.toString() : "");
        json.put("packageName", packageName != null ? packageName.toString() : "");
        json.put("icon", encoded != null ? encoded : "");
        return json.toString();
      } catch (Exception e) {
        Log.e("LauncherKitModule", "Error creating JSON for app: " + packageName, e);
        return "{\"appName\":\"\",\"packageName\":\"\",\"icon\":\"\"}";
      }
    }
  }

  // Keep existing getApps() method for backward compatibility
  private String getApps(){
    PackageManager pManager = this.reactContext.getPackageManager();

    Intent i = new Intent(Intent.ACTION_MAIN, null);
    i.addCategory(Intent.CATEGORY_LAUNCHER);
    List<ResolveInfo> allApps = pManager.queryIntentActivities(i, 0);
    
    // Step 1: Collect all data first (fast)
    List<AppData> appDataList = new ArrayList<>();
    for (ResolveInfo ri : allApps) {
      try {
        AppData appData = new AppData();
        appData.appName = ri.loadLabel(pManager);
        appData.packageName = ri.activityInfo.packageName;
        appData.icon = ri.activityInfo.loadIcon(pManager);
        appDataList.add(appData);
      } catch (Exception e) {
        // Skip corrupted app entries during collection
        Log.w("LauncherKitModule", "Skipping corrupted app entry", e);
      }
    }
    
    // Step 2: Try to build entire JSON array (fast path)
    try {
      JSONArray jsonArray = new JSONArray();
      for (AppData appData : appDataList) {
        JSONObject appJson = new JSONObject();
        appJson.put("appName", appData.appName != null ? appData.appName.toString() : "");
        appJson.put("packageName", appData.packageName != null ? appData.packageName : "");
        
        String encodedIcon = drawableToBase64(appData.icon);
        appJson.put("icon", encodedIcon != null ? encodedIcon : "");
        
        jsonArray.put(appJson);
      }
      return jsonArray.toString();
    } catch (Exception e) {
      // Step 3: Fallback - check each item individually (slower but safer)
      Log.w("LauncherKitModule", "Fast JSON build failed, falling back to individual checks", e);
      return buildJsonWithIndividualChecks(appDataList);
    }
  }
  
  // Helper class for collecting app data
  private static class AppData {
    CharSequence appName;
    String packageName;
    Drawable icon;
  }
  
  // Fallback method that checks each app individually
  private String buildJsonWithIndividualChecks(List<AppData> appDataList) {
    JSONArray jsonArray = new JSONArray();
    int successCount = 0;
    
    for (AppData appData : appDataList) {
      try {
        JSONObject appJson = new JSONObject();
        appJson.put("appName", appData.appName != null ? appData.appName.toString() : "");
        appJson.put("packageName", appData.packageName != null ? appData.packageName : "");
        
        // Handle icon conversion with individual error handling
        String encodedIcon = "";
        try {
          encodedIcon = drawableToBase64(appData.icon);
        } catch (Exception iconError) {
          Log.w("LauncherKitModule", "Failed to process icon for " + appData.packageName, iconError);
        }
        appJson.put("icon", encodedIcon);
        
        jsonArray.put(appJson);
        successCount++;
      } catch (Exception e) {
        Log.w("LauncherKitModule", "Failed to process app: " + appData.packageName, e);
        // Continue processing other apps
      }
    }
    
    Log.i("LauncherKitModule", "Processed " + successCount + " apps out of " + appDataList.size() + " total");
    return jsonArray.toString();
  }
  
  // Helper method to avoid duplicate bitmap processing code
  private String drawableToBase64(Drawable drawable) {
    try {
      Bitmap bitmap;
      if(drawable.getIntrinsicWidth() <= 0 || drawable.getIntrinsicHeight() <= 0) {
        bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888);
      } else {
        bitmap = Bitmap.createBitmap(drawable.getIntrinsicWidth(), drawable.getIntrinsicHeight(), Bitmap.Config.ARGB_8888);
      }
      
      Canvas canvas = new Canvas(bitmap);
      drawable.setBounds(0, 0, canvas.getWidth(), canvas.getHeight());
      drawable.draw(canvas);

      ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
      bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);
      byte[] byteArray = byteArrayOutputStream.toByteArray();
      return Base64.encodeToString(byteArray, Base64.NO_WRAP);
    } catch (Exception e) {
      return "";
    }
  }

  /**
   * New enhanced method for getting apps with additional features
   * Retrieves a list of installed apps on the device with optional version and accent color.
   *
   * @param includeVersion     Whether to include version info in the app details.
   * @param includeAccentColor Whether to calculate and include the accent color of the app icon.
   * @param promise            Promise to handle asynchronous operation result.
   */
  @ReactMethod
  public void getAppsEnhanced(boolean includeVersion, boolean includeAccentColor, Promise promise) {
    new Thread(() -> {
      Set<String> addedPackages = new HashSet<>();
      List<EnhancedAppDetail> apps = new ArrayList<>();
      PackageManager pManager = reactContext.getPackageManager();

      Intent intent = new Intent(Intent.ACTION_MAIN, null);
      intent.addCategory(Intent.CATEGORY_LAUNCHER);
      List<ResolveInfo> allApps = pManager.queryIntentActivities(intent, 0);

      for (ResolveInfo ri : allApps) {
        String packageName = ri.activityInfo.packageName;
        if (!addedPackages.contains(packageName)) {
          EnhancedAppDetail app = new EnhancedAppDetail(ri, pManager, reactContext, includeVersion, includeAccentColor);
          apps.add(app);
          addedPackages.add(packageName);
        }
      }
      
      // Try fast JSON build first, fallback to individual checks if needed
      try {
        JSONArray jsonArray = new JSONArray();
        for (EnhancedAppDetail app : apps) {
          JSONObject appJson = new JSONObject();
          appJson.put("label", app.label != null ? app.label.toString() : "");
          appJson.put("packageName", app.packageName != null ? app.packageName.toString() : "");
          appJson.put("icon", app.iconPath != null ? "file://" + app.iconPath : "");
          appJson.put("version", app.version != null ? app.version : "");
          appJson.put("accentColor", app.accentColor != null ? app.accentColor : "");
          jsonArray.put(appJson);
        }
        promise.resolve(jsonArray.toString());
      } catch (Exception e) {
        // Fallback: check each app individually
        Log.w("LauncherKitModule", "Fast JSON build failed for enhanced apps, falling back to individual checks", e);
        try {
          JSONArray jsonArray = new JSONArray();
          int successCount = 0;
          
          for (EnhancedAppDetail app : apps) {
            try {
              JSONObject appJson = new JSONObject();
              appJson.put("label", app.label != null ? app.label.toString() : "");
              appJson.put("packageName", app.packageName != null ? app.packageName.toString() : "");
              appJson.put("icon", app.iconPath != null ? "file://" + app.iconPath : "");
              appJson.put("version", app.version != null ? app.version : "");
              appJson.put("accentColor", app.accentColor != null ? app.accentColor : "");
              jsonArray.put(appJson);
              successCount++;
            } catch (Exception appError) {
              Log.w("LauncherKitModule", "Failed to process enhanced app: " + app.packageName, appError);
            }
          }
          
          Log.i("LauncherKitModule", "Enhanced: Processed " + successCount + " apps out of " + apps.size() + " total");
          promise.resolve(jsonArray.toString());
        } catch (Exception fallbackError) {
          Log.e("LauncherKitModule", "Both fast and fallback JSON creation failed", fallbackError);
          promise.reject("JSON_ERROR", "Failed to create JSON response", fallbackError);
        }
      }
    }).start();
  }

  private List<String> getAllApps() {
    List<PackageInfo> packages = this.reactContext
      .getPackageManager()
      .getInstalledPackages(0);

    List<String> ret = new ArrayList<>();
    for (final PackageInfo p: packages) {
      ret.add(p.packageName);
    }
    return ret;
  }

  private List<String> getNonSystemApps() {
    List<PackageInfo> packages = this.reactContext
      .getPackageManager()
      .getInstalledPackages(0);

    List<String> ret = new ArrayList<>();
    for (final PackageInfo p: packages) {
      if ((p.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
        ret.add(p.packageName);
      }
    }
    return ret;
  }

  private List<String> getSystemApps() {
    List<PackageInfo> packages = this.reactContext
      .getPackageManager()
      .getInstalledPackages(0);

    List<String> ret = new ArrayList<>();
    for (final PackageInfo p: packages) {
      if ((p.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 1) {
        ret.add(p.packageName);
      }
    }
    return ret;
  }

  // Keep existing simple launch method for backward compatibility
  @ReactMethod
  private void launchApplication(String packageName){
    Intent launchIntent = this.reactContext.getPackageManager().getLaunchIntentForPackage(packageName);
    if (launchIntent != null) {
      this.reactContext.startActivity(launchIntent);//null pointer check in case package name was not found
    }
  }

  /**
   * Enhanced launch application method with parameters and animations
   */
  @ReactMethod
  public void launchApplicationEnhanced(String packageName, @Nullable ReadableMap params) {
    PackageManager packageManager = this.reactContext.getPackageManager();
    Intent launchIntent = null;

    try {
      if (params != null) {
        // Get the action if specified, otherwise use MAIN
        String action = params.hasKey("action")
          ? params.getString("action")
          : Intent.ACTION_MAIN;

        launchIntent = new Intent(action);
        launchIntent.setPackage(packageName);

        // Handle URI data if provided
        if (params.hasKey("data")) {
          String data = params.getString("data");
          if (data.startsWith("geo:")) {
            // Handle Google Maps
            launchIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(data));
            launchIntent.setPackage(packageName);
          } else if (data.startsWith("file://")) {
            // Handle file-based intents
            launchIntent.setDataAndType(
              android.net.Uri.parse(data),
              params.hasKey("type") ? params.getString("type") : "*/*"
            );
            launchIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
          } else if (data.startsWith("http://") || data.startsWith("https://")) {
            // Handle URLs
            launchIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(data));
            launchIntent.setPackage(packageName);
          } else {
            // Generic data handling
            launchIntent.setData(android.net.Uri.parse(data));
          }
        }

        // Handle extras if provided
        if (params.hasKey("extras")) {
          ReadableMap extras = params.getMap("extras");
          ReadableMapKeySetIterator iterator = extras.keySetIterator();
          while (iterator.hasNextKey()) {
            String key = iterator.nextKey();
            String value = extras.getString(key);
            launchIntent.putExtra(key, value);
          }
        }

        // Add category if specified
        if (params.hasKey("category")) {
          launchIntent.addCategory(params.getString("category"));
        }
      } else {
        // Fallback to default launch intent
        launchIntent = packageManager.getLaunchIntentForPackage(packageName);
      }

      if (launchIntent != null) {
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        // Note: You'll need to add the animation resource to your res/anim folder
        // int enterAnimRes = R.anim.slide_up;
        // Bundle animBundle = ActivityOptions.makeCustomAnimation(this.reactContext, enterAnimRes, 0).toBundle();
        // this.reactContext.startActivity(launchIntent, animBundle);
        
        // For now, launch without animation
        this.reactContext.startActivity(launchIntent);
      } else {
        Log.e("ReactNative", "No launch intent available for package: " + packageName);
      }
    } catch (Exception e) {
      Log.e("ReactNative", "Error launching application: " + e.getMessage());
    }
  }

  @ReactMethod
  public void isPackageInstalled(String packageName, Callback cb) {
    PackageManager pm = this.reactContext.getPackageManager();
    try {
      pm.getPackageInfo(packageName, PackageManager.GET_ACTIVITIES);
      cb.invoke(true);
    } catch (Exception e) {
      cb.invoke(false);
    }
  }

  @ReactMethod
  public void getDefaultLauncherPackageName(Promise promise) {
    PackageManager pm = getReactApplicationContext().getPackageManager();

    // Get the intent that launches the home screen
    Intent intent = new Intent(Intent.ACTION_MAIN);
    intent.addCategory(Intent.CATEGORY_HOME);
    ResolveInfo resolveInfo = pm.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);

    if (resolveInfo != null && resolveInfo.activityInfo != null) {
      // Get the package name of the default launcher
      String packageName = resolveInfo.activityInfo.packageName;

      // Resolve the promise with the package name
      promise.resolve(packageName);
    } else {
      // Reject the promise with an error message
      promise.reject("ERROR", "Unable to get default launcher package name.");
    }
  }

  @ReactMethod
  public void setAsDefaultLauncher() {
    PackageManager localPackageManager = this.reactContext.getPackageManager();
    Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS);
    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    this.reactContext.startActivity(intent);
  }

  private PackageInfo getPackageInfo() throws Exception {
    return getReactApplicationContext().getPackageManager().getPackageInfo(getReactApplicationContext().getPackageName(), 0);
  }

  @Override
  public @Nullable Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>();
    String appVersion, buildNumber, appName;

    try {
      appVersion = getPackageInfo().versionName;
      buildNumber = Integer.toString(getPackageInfo().versionCode);
      appName = getReactApplicationContext().getApplicationInfo().loadLabel(getReactApplicationContext().getPackageManager()).toString();
    } catch (Exception e) {
      appVersion = "unknown";
      buildNumber = "unknown";
      appName = "unknown";
    }
    constants.put("allApps", getApps());
    constants.put("nonSystemApps", getNonSystemApps());
    constants.put("systemApps", getSystemApps());
    DeviceDetails device = new DeviceDetails();
    device.appName = appName;
    device.appVersion = appVersion;
    device.deviceId =  Build.BOARD;
    device.bundleId = getReactApplicationContext().getPackageName();
    device.systemName = "Android";
    device.systemVersion = Build.VERSION.RELEASE;
    device.buildNumber = buildNumber;
    device.brand = Build.BRAND;
    device.model = Build.MODEL;
    constants.put("DeviceDetails", device.toString());
    return constants;
  }

  @Override
  @NonNull
  public String getName() {
    return "LauncherKit";
  }


  @ReactMethod
  public void getBatteryStatus(Callback successCallback) {
    Intent batteryIntent = reactContext.registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
    int level = batteryIntent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
    int scale = batteryIntent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
    int status = batteryIntent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
    boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
      status == BatteryManager.BATTERY_STATUS_FULL;
    if(level == -1 || scale == -1) {
      level = 0;
    }
    successCallback.invoke(((float)level / (float)scale) * 100.0f, isCharging);
  }

  @ReactMethod
  public void goToSettings()
  {
    Intent intent = new Intent(Settings.ACTION_SETTINGS);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    getReactApplicationContext().startActivity(intent);
  }

  @ReactMethod
  public void openSetDefaultLauncher(Promise promise) {
    try {
      Context context = getReactApplicationContext().getBaseContext();
      Intent intent = new Intent(Settings.ACTION_HOME_SETTINGS);
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
      context.startActivity(intent);
      promise.resolve(true);
    } catch (Exception e) {
      promise.reject(e);
    }
  }

  /**
   * New method to open alarm app
   */
  @ReactMethod
  public void openAlarmApp() {
    try {
      Intent intent = new Intent(AlarmClock.ACTION_SHOW_ALARMS);
      intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      if (intent.resolveActivity(reactContext.getPackageManager()) != null) {
        reactContext.startActivity(intent);
      } else {
        Log.e("LauncherKitModule", "No activity found to handle SHOW_ALARMS intent");
      }
    } catch (ActivityNotFoundException e) {
      Log.e("LauncherKitModule", "Alarm app not found", e);
    } catch (Exception e) {
      Log.e("LauncherKitModule", "Failed to open alarm app", e);
    }
  }

  // App installation/removal listeners
  private BroadcastReceiver appInstallReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      new Thread(new Runnable() {
        @Override
        public void run() {
          String packageName = intent.getData().getSchemeSpecificPart();
          PackageManager pManager = context.getPackageManager();

          try {
            Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            if (launchIntent != null) {
              ResolveInfo resolveInfo = pManager.resolveActivity(launchIntent, 0);
              if (resolveInfo != null) {
                EnhancedAppDetail newApp = new EnhancedAppDetail(resolveInfo, pManager, reactContext, true, true);
                ReactContext reactContext = getReactApplicationContext();
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                  .emit("onAppInstalled", newApp.toString());
              }
            }
          } catch (Exception e) {
            e.printStackTrace();
          }
        }
      }).start();
    }
  };

  @ReactMethod
  public void startListeningForAppInstallations() {
    IntentFilter filter = new IntentFilter(Intent.ACTION_PACKAGE_ADDED);
    filter.addDataScheme("package");
    reactContext.registerReceiver(appInstallReceiver, filter);
  }

  @ReactMethod
  public void stopListeningForAppInstallations() {
    try {
      reactContext.unregisterReceiver(appInstallReceiver);
    } catch (IllegalArgumentException e) {
      e.printStackTrace();
    }
  }

  private BroadcastReceiver appRemovalReceiver = new BroadcastReceiver() {
    @Override
    public void onReceive(Context context, Intent intent) {
      new Thread(new Runnable() {
        @Override
        public void run() {
          String packageName = intent.getData().getSchemeSpecificPart();
          ReactContext reactContext = getReactApplicationContext();
          reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit("onAppRemoved", packageName);
        }
      }).start();
    }
  };

  @ReactMethod
  public void startListeningForAppRemovals() {
    IntentFilter filter = new IntentFilter(Intent.ACTION_PACKAGE_REMOVED);
    filter.addDataScheme("package");
    reactContext.registerReceiver(appRemovalReceiver, filter);
  }

  @ReactMethod
  public void stopListeningForAppRemovals() {
    try {
      reactContext.unregisterReceiver(appRemovalReceiver);
    } catch (IllegalArgumentException e) {
      e.printStackTrace();
    }
  }
}
