package com.focusbear;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.PixelFormat;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.Looper;
import android.provider.Telephony;
import android.telecom.TelecomManager;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Button;
import android.provider.ContactsContract;
import android.provider.Settings;
import android.provider.AlarmClock;
import android.content.pm.ApplicationInfo;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.ReactApplication;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.SortedMap;
import java.util.Timer;
import java.util.TimerTask;
import java.util.TreeMap;
import org.json.JSONObject;

public class OverlayControl {
    private Context context;
    private static ReactApplicationContext reactApplicationContext;
    public static OverlayControl overlayControl = null;
    private Timer detectBlockedAppsTimer;
    TimerTask detectAndBlockAppsTask;
    private Boolean overlayEnabled = false;
    String runningApp;
    String defaultSMSPackageName = "vnd.android-dir/mms-sms";

    public static Set<String> allowedApps = new HashSet<>();
    public static Set<String> blockedApps = new HashSet<>();

    public static Set<String> DEFAULT_ALLOWED_APPS = new HashSet<>();
    public static Set<String> cachedInstalledAppPackageNames = new HashSet<>();

    public static LocaleStrings localeStrings;

    View viewRoot = null;
    WindowManager windowManager = null;
    WindowManager.LayoutParams rootParams = null;
    ImageView close;
    Button backButton;
    TextView textView, activityNameTextView;
    int width;
    private TextView textTimer;
    CountDownTimer timer;
    String NOVA_LAUNCHER_PACKAGE = "com.teslacoilsw.launcher";
    String DEFAULT_PERMISSION_CONTROLLER_PACKAGE = "com.google.android.permissioncontroller";
    private final static float CLICK_DRAG_TOLERANCE = 10; // Often, there will be a slight, unintentional, drag when the
                                                          // user taps the FAB, so we need to account for this.

    // Global Variables for storing the data of floatingActivity
    public static int floatingRemainingActivityTimer = 0;
    public static String floatingActivityName = "";
    public static Boolean isFloatingActivityStarted = false;
    public static String floatingActivityCompletionRequirements = "";

    private static final long FIFTEEN_MINUTES_IN_SECONDS = 15 * 60 * 1000;
    private static final int DETECT_AND_BLOCK_APP_TIMER_INTERVAL = 1000;
    public static Boolean isTimerPausedByUser = false;
    public static Boolean shouldPauseTimer = false;
    public static Set<String> activitySpecificAllowedAppsPackageName = new HashSet<>();
    public static Set<String> activitySpecificAllowedAppsName = new HashSet<>();
    public static Set<String> activitySpecificAllowedApps = new HashSet<>();

    // Soft block settings synced from JS
    private static boolean softBlockEasySkipEnabled = true;
    private static boolean softBlockIsInFocusMode = false;
    private static String softBlockCurrentScreen = "";
    private static String softBlockBypassPackageId = null;
    private static long softBlockBypassUntil = 0L;
    private static final String ROUTINE_DETAIL_SCREEN = "RoutineDetail";
    private static final String BREATHING_EXERCISE_SCREEN = "BreathingExercise";
    private static String softUnblockingReason = null;
    private static Boolean userClosedPauseBlockingLayout = false;
    private CountDownTimer pauseBlockingTimer;
    private String lastForegroundApp = null;

    private static long lastBreathingExerciseOpenedAt = 0L;
    private static final long BREATHING_EXERCISE_COOLDOWN_MS = 2000; // 3 second cooldown

    /**
     * Updates soft block settings from JS side.
     * Called whenever relevant Redux state changes.
     */
    public static void updateSoftBlockSettings(
            boolean easySkipEnabled,
            boolean isInFocusMode,
            String currentScreen,
            String bypassPackageId,
            long bypassUntil,
            String unblockingReason) {
        if (bypassPackageId != null && !bypassPackageId.equals(softBlockBypassPackageId)) {
            userClosedPauseBlockingLayout = false;
        }

        softBlockEasySkipEnabled = easySkipEnabled;
        softBlockIsInFocusMode = isInFocusMode;
        softBlockCurrentScreen = currentScreen != null ? currentScreen : "";
        softBlockBypassPackageId = bypassPackageId;
        softBlockBypassUntil = bypassUntil;
        softUnblockingReason = unblockingReason;

        // Reset breathing exercise cooldown when bypass is set (user completed
        // breathing exercise)
        // This allows the next blocked app access to trigger breathing exercise
        // immediately
        if (bypassPackageId != null && bypassUntil > System.currentTimeMillis()) {
            lastBreathingExerciseOpenedAt = 0L;
        }

    }

    /**
     * Checks if breathing exercise can be opened based on synced JS state.
     * Mirrors the logic in ServiceAndEvents.js blockApp().
     */
    private boolean canOpenBreathingExerciseNatively(
            String appPackageName,
            boolean isScheduleBlockingActive,
            String scheduleBlockingMode) {
        // Check if bypass is active for this package
        boolean isByPassActive = softBlockBypassUntil > System.currentTimeMillis();
        boolean isRunningByPassApp = appPackageName != null && softBlockBypassPackageId != null
                && softBlockBypassPackageId.equals(appPackageName);

        if (isByPassActive && isRunningByPassApp) {
            Log.d("OverlayControl", "[SOFT_BLOCK] bypass active for pkg=" + appPackageName);
            return false; // Don't open breathing exercise, bypass is active
        }

        boolean isScheduleStrict = isScheduleBlockingActive
                && ("strict".equalsIgnoreCase(scheduleBlockingMode)
                        || "super-strict".equalsIgnoreCase(scheduleBlockingMode));

        // If any active schedule is strict, always hard-block (no breathing exercise
        // soft-block),
        // regardless of easy-skip settings. This matches the expectation that strict
        // schedules
        // should not allow the breathing exercise bypass at all.
        if (isScheduleStrict) {
            Log.d("OverlayControl", "[SOFT_BLOCK] schedule is strict; forcing hard block (no breathing exercise)");
            boolean easySkipCondition = softBlockEasySkipEnabled
                    && !softBlockIsInFocusMode
                    && !ROUTINE_DETAIL_SCREEN.equals(softBlockCurrentScreen);

            return false;
        }

        // easySkipCondition = easySkipModeEnabled && !isInFocusMode &&
        // currentScreenName !== NAVIGATION.RoutineDetail
        boolean easySkipCondition = softBlockEasySkipEnabled
                && !softBlockIsInFocusMode
                && !ROUTINE_DETAIL_SCREEN.equals(softBlockCurrentScreen);

        // scheduleCondition = isScheduleBlockingActive && NOT strict
        boolean scheduleCondition = isScheduleBlockingActive;

        boolean canOpen = easySkipCondition || scheduleCondition;

        return canOpen;
    }

    // Debounce for GET_CURRENT_ACTIVITY events so we don't spam JS / UI
    // with duplicate blocking events for the same app / URL in a short window.
    private String lastGetCurrentActivityKey = null;
    private long lastGetCurrentActivityTimestamp = 0L;
    private static final long GET_CURRENT_ACTIVITY_DEBOUNCE_MS = 1000L;
    // Throttle high-frequency blocking decision logs to reduce file I/O churn.
    private String lastBlockingDecisionLogKey = null;
    private long lastBlockingDecisionLogTimestamp = 0L;
    private static final long BLOCKING_DECISION_LOG_COOLDOWN_MS = 10000L;

    private boolean shouldSkipGetCurrentActivityEvent(String key) {
        long now = System.currentTimeMillis();
        if (key != null
                && key.equals(lastGetCurrentActivityKey)
                && (now - lastGetCurrentActivityTimestamp) < GET_CURRENT_ACTIVITY_DEBOUNCE_MS) {
            Log.d(
                    "OverlayControl",
                    "Skipping duplicate GET_CURRENT_ACTIVITY event within "
                            + GET_CURRENT_ACTIVITY_DEBOUNCE_MS + "ms for key=" + key);
            return true;
        }

        lastGetCurrentActivityKey = key;
        lastGetCurrentActivityTimestamp = now;
        return false;
    }

    private boolean shouldLogBlockingDecision(String logKey) {
        long now = System.currentTimeMillis();
        if (logKey != null
                && logKey.equals(lastBlockingDecisionLogKey)
                && (now - lastBlockingDecisionLogTimestamp) < BLOCKING_DECISION_LOG_COOLDOWN_MS) {
            return false;
        }
        lastBlockingDecisionLogKey = logKey;
        lastBlockingDecisionLogTimestamp = now;
        return true;
    }

    // Fade effect varaibles
    private Handler fadeHandler;
    private Runnable fadeRunnable;
    private static final long FADE_DELAY = 3000; // 3 seconds without touch
    private static final float FADE_OUT_ALPHA = 0.5f; // 50% opacity
    private static final int FADE_OUT_DURATION = 300; // milliseconds
    private static final int FADE_IN_DURATION = 200; // milliseconds

    public static Boolean isBlockList = false;

    private OverlayControl(Context context) {
        this.context = context;
    }

    public static void setReactContext(ReactApplicationContext reactContext) {
        reactApplicationContext = reactContext;
        // Keep the existing singleton in sync
        if (overlayControl != null) {
            overlayControl.context = reactContext;
        }
    }

    public static OverlayControl getInstance(Context context) {
        if (overlayControl == null) {
            Context preferredContext = reactApplicationContext != null ? reactApplicationContext : context;
            overlayControl = new OverlayControl(preferredContext);
        }
        return overlayControl;
    }

    /**
     * Method to Start Timer For ongoing activity
     */
    public void startTimer() {
        if (timer == null) {
            long activityTimer = floatingRemainingActivityTimer * 1000;
            long tick = 1000; // 1 second interval for timer
            timer = new CountDownTimer(activityTimer, tick) {

                public void onTick(long millisUntilFinished) {
                    long durationInSeconds = millisUntilFinished / 1000;
                    long remainedMinutes = durationInSeconds / 60;
                    long remainedSeconds = durationInSeconds % 60;

                    floatingRemainingActivityTimer = (int) durationInSeconds;

                    if (textTimer != null && activityNameTextView != null) {
                        activityNameTextView.setText(floatingActivityName);
                        String timerText = String.format("%02d:%02d", remainedMinutes, remainedSeconds);
                        textTimer.setText(timerText);
                    }
                }

                public void onFinish() {
                    if (textTimer != null && activityNameTextView != null) {
                        activityNameTextView.setText(floatingActivityName + " finished");
                        textTimer.setText("00:00");
                        isFloatingActivityStarted = false;
                    }
                    cancel();
                }

            }.start();
        }

    }

    public void timerPauseAndReset() {
        if (timer != null) {
            timer.cancel();
            timer = null; // Reset the timer instance
        }
    }

    public void configCountDownTimer(boolean pauseTimer) {
        localeStrings = new LocaleStrings();
        if (floatingActivityCompletionRequirements != null
                && !floatingActivityCompletionRequirements.trim().isEmpty()) {
            showCompletionRequirements();
        } else {
            if (!isTimerPausedByUser && !pauseTimer) {
                startTimer();
            } else {
                timerPauseAndReset();
                if (textTimer != null && activityNameTextView != null) {
                    String appNames = (activitySpecificAllowedAppsName != null
                            && !activitySpecificAllowedAppsName.isEmpty())
                                    ? String.join(", ", activitySpecificAllowedAppsName)
                                    : "Unknown App"; // Default value if empty
                    String[] activityNameText = new String[] { "{appName}:" + appNames };
                    activityNameTextView.setText(isTimerPausedByUser ? floatingActivityName
                            : localeStrings.getDynamicString("openAppToContinue", activityNameText));
                    textTimer.setText(localeStrings.getStaticString("timerPause"));
                }
            }
        }
    }

    public void showCompletionRequirements() {
        if (activityNameTextView != null && textTimer != null) {
            activityNameTextView.setText(floatingActivityName);
            textTimer.setText(floatingActivityCompletionRequirements);
        }
    }

    public static String getPackageName(Context context, Intent intent) {
        PackageManager packageManager = context.getPackageManager();

        ResolveInfo resolveInfo = packageManager.resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY);

        if (resolveInfo != null && resolveInfo.activityInfo != null) {
            return resolveInfo.activityInfo.packageName;
        } else {
            return null;
        }
    }

    public Set<String> getExcludedPackageNames(Context context) {
        long currentTime = System.currentTimeMillis();
        SharedPreferences shared_preference = context.getSharedPreferences("SHARED_PREFERENCE", Context.MODE_PRIVATE);

        // Get cached data and last update time from SharedPreferences
        Set<String> defaultExcludedApps = shared_preference.getStringSet("default_excluded_apps", null);
        long lastCacheUpdateTime = shared_preference.getLong("default_apps_last_update_time", 0);

        // Check if the cache is still valid
        if (defaultExcludedApps != null && (currentTime - lastCacheUpdateTime) < FIFTEEN_MINUTES_IN_SECONDS) {
            // Return cached result if still valid
            return defaultExcludedApps;
        }

        Set<String> excludedPackageNames = new HashSet<>();

        String smsPackageName = Telephony.Sms.getDefaultSmsPackage(context);
        String phonePackageName = getPackageName(context, new Intent(Intent.ACTION_DIAL));
        String settingsPackageName = getPackageName(context, new Intent(Settings.ACTION_SETTINGS));
        String cameraPackageName = getPackageName(context, new Intent("android.media.action.IMAGE_CAPTURE"));
        String contactPackageName = getPackageName(context,
                new Intent(Intent.ACTION_INSERT, ContactsContract.Contacts.CONTENT_URI));
        String mapPackageName = getPackageName(context,
                new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_APP_MAPS));
        String clockPackageName = getPackageName(context, new Intent(AlarmClock.ACTION_SET_ALARM));
        String myFilesPackageName;

        Intent intent = new Intent("android.intent.action.MAIN");
        intent.addCategory("android.intent.category.HOME");
        String currentLauncherPackageName = getPackageName(context, intent);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            // Use standard package name for API level >= 29
            myFilesPackageName = getPackageName(context,
                    Intent.makeMainSelectorActivity(Intent.ACTION_MAIN, Intent.CATEGORY_APP_FILES));
        } else {
            // Use Samsung-specific package name for older versions
            myFilesPackageName = "com.sec.android.app.myfiles";
        }

        excludedPackageNames.add(phonePackageName);
        excludedPackageNames.add(smsPackageName);
        excludedPackageNames.add(settingsPackageName);
        excludedPackageNames.add(cameraPackageName);
        excludedPackageNames.add(contactPackageName);
        excludedPackageNames.add("com.focusbear");
        excludedPackageNames.add(mapPackageName);
        excludedPackageNames.add(myFilesPackageName);
        excludedPackageNames.add(clockPackageName);
        excludedPackageNames.add(currentLauncherPackageName);
        excludedPackageNames.add(DEFAULT_PERMISSION_CONTROLLER_PACKAGE);
        excludedPackageNames.add(NOVA_LAUNCHER_PACKAGE);

        // Cache excludedPackageNames in sharedPreference
        SharedPreferences.Editor editor = shared_preference.edit();
        editor.putStringSet("default_excluded_apps", excludedPackageNames);
        editor.putLong("default_apps_last_update_time", currentTime);
        editor.apply();

        return excludedPackageNames;
    }

    /**
     * Method to add Floating View in Window Manager
     */
    public void addFloatingView() {
        if (localeStrings == null) {
            localeStrings = new LocaleStrings();
        }

        DisplayMetrics metrics = context.getResources().getDisplayMetrics();
        width = metrics.widthPixels;

        if (windowManager == null) {

            if (rootParams == null) {
                int LAYOUT_FLAG;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    LAYOUT_FLAG = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
                } else {
                    LAYOUT_FLAG = WindowManager.LayoutParams.TYPE_PHONE;
                }
                rootParams = new WindowManager.LayoutParams(WindowManager.LayoutParams.WRAP_CONTENT,
                        WindowManager.LayoutParams.WRAP_CONTENT, LAYOUT_FLAG,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE, PixelFormat.TRANSLUCENT);
            }

            if (viewRoot == null) {

                viewRoot = LayoutInflater.from(context).inflate(R.layout.floating_layout, null);
                // Specify the view position
                rootParams.gravity = Gravity.TOP | Gravity.START;

                // Initially view will be added to top-right corner, you change x-y coordinates
                // according to your need
                int getTopRightXPosition = width - (int) metrics.xdpi; // Gets the x position of the top right corner in
                                                                       // Android

                rootParams.x = getTopRightXPosition;
                rootParams.y = 0;

                windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
                windowManager.addView(viewRoot, rootParams);

                activityNameTextView = viewRoot.findViewById(R.id.activityNameTextView);
                textTimer = viewRoot.findViewById(R.id.textView);
                close = viewRoot.findViewById(R.id.close);
                backButton = viewRoot.findViewById(R.id.window_close_alert);

                // Setup fade effect
                setupFadeEffect();

                // Add interaction listeners to all elements
                setupInteractionListeners();

                // whole popup touch listener
                viewRoot.findViewById(R.id.root).setOnTouchListener(new View.OnTouchListener() {
                    private int initialX;
                    private int initialY;
                    private int initialTouchX;
                    private int initialTouchY;

                    private float startX;
                    private float startY;

                    @Override
                    public boolean onTouch(View view, MotionEvent motionEvent) {
                        switch (motionEvent.getAction()) {
                            case MotionEvent.ACTION_DOWN:

                                initialX = rootParams.x;
                                initialY = rootParams.y;

                                initialTouchX = (int) motionEvent.getRawX();
                                initialTouchY = (int) motionEvent.getRawY();

                                startX = motionEvent.getX();
                                startY = motionEvent.getY();

                                // Fade in on touch
                                fadeIn();
                                resetFadeTimer();
                                return true;

                            case MotionEvent.ACTION_UP:

                                return false;

                            case MotionEvent.ACTION_MOVE:

                                rootParams.x = initialX + (int) (motionEvent.getRawX() - initialTouchX);
                                rootParams.y = initialY + (int) (motionEvent.getRawY() - initialTouchY);

                                windowManager.updateViewLayout(viewRoot, rootParams);

                                // Keep visible while dragging
                                fadeIn();
                                resetFadeTimer();
                                return true;
                        }

                        return false;
                    }
                });

                // back button listener - opens focusbear app
                backButton.setOnClickListener(view -> {
                    fadeIn();
                    resetFadeTimer();
                    Window.getInstance(context).openApp("com.focusbear");
                });

                // X button listener - closes popup when counter is zero
                close.setOnClickListener(view -> {
                    isFloatingActivityStarted = false;
                    removeFloatingView();

                    // Use new event emitter from OverlayModule
                    try {
                        WritableMap params = Arguments.createMap();
                        params.putBoolean("ON_PRESS_CLOSE_FLOATING_VIEW", true);
                        String jsonString = new JSONObject(params.toHashMap()).toString();
                        Log.d("OverlayControl", "Emitting overlay event: " + jsonString);

                        OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
                        if (overlayModule != null) {
                            overlayModule.sendOverlayEventToJS(jsonString);
                        } else {
                            Log.w("OverlayControl",
                                    "No registered OverlayModule instance available, skipping event emission");
                        }
                    } catch (Exception e) {
                        Log.e("OverlayControl", "Exception in sendOverlayEventToJS", e);
                        e.printStackTrace();
                    }
                });

                // Pause Blocking button listener - triggers postpone flow in React Native
                Button pauseBlockingBtn = viewRoot.findViewById(R.id.pause_blocking_btn);
                if (pauseBlockingBtn != null) {
                    pauseBlockingBtn.setText(localeStrings.getStaticString("pauseBlocking"));
                    pauseBlockingBtn.setOnClickListener(view -> {
                        fadeIn();
                        resetFadeTimer();

                        // Send event to JS to trigger postpone flow (same as Window.java postpone
                        // button)
                        try {
                            WritableMap params = Arguments.createMap();
                            params.putBoolean("POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL", true);
                            String jsonString = new JSONObject(params.toHashMap()).toString();
                            Log.d("OverlayControl", "Emitting postpone event from floating view: " + jsonString);

                            OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
                            if (overlayModule != null) {
                                overlayModule.sendOverlayEventToJS(jsonString);
                            } else {
                                Log.w("OverlayControl",
                                        "No registered OverlayModule instance available, skipping event emission");
                            }
                        } catch (Exception e) {
                            Log.e("OverlayControl", "Exception in sendOverlayEventToJS for pause blocking", e);
                            e.printStackTrace();
                        }

                        // Open FocusBear app to show the postpone modal
                        Window.getInstance(context).openApp("com.focusbear");
                    });
                }
            }
        }
    }

    // ===== FADE EFFECT METHODS =====

    // Setup automatic fade effect
    private void setupFadeEffect() {
        fadeHandler = new Handler(Looper.getMainLooper());

        fadeRunnable = new Runnable() {
            @Override
            public void run() {
                fadeOut();
            }
        };

        // Start the timer
        resetFadeTimer();
    }

    // Reset the fade timer
    private void resetFadeTimer() {
        if (fadeHandler != null && fadeRunnable != null) {
            fadeHandler.removeCallbacks(fadeRunnable);
            fadeHandler.postDelayed(fadeRunnable, FADE_DELAY);
        }
    }

    // Fade out (make transparent) the floating view
    private void fadeOut() {
        if (viewRoot != null) {
            View rootCard = viewRoot.findViewById(R.id.root);
            if (rootCard != null) {
                rootCard.animate()
                        .alpha(FADE_OUT_ALPHA)
                        .setDuration(FADE_OUT_DURATION)
                        .start();
            }
        }
    }

    // Fade in (restore opacity) the floating view
    private void fadeIn() {
        if (viewRoot != null) {
            View rootCard = viewRoot.findViewById(R.id.root);
            if (rootCard != null) {
                rootCard.animate()
                        .alpha(1.0f)
                        .setDuration(FADE_IN_DURATION)
                        .start();
            }
        }
    }

    // Setup listeners to detect interaction on all elements
    private void setupInteractionListeners() {
        // Generic listener for all interactive elements
        View.OnTouchListener interactionListener = new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                if (event.getAction() == MotionEvent.ACTION_DOWN) {
                    fadeIn();
                    resetFadeTimer();
                }
                return false; // Allow event to continue
            }
        };

        // Apply to all interactive elements
        if (close != null) {
            close.setOnTouchListener(interactionListener);
        }
        if (backButton != null) {
            backButton.setOnTouchListener(interactionListener);
        }
        if (activityNameTextView != null) {
            activityNameTextView.setOnTouchListener(interactionListener);
        }
        if (textTimer != null) {
            textTimer.setOnTouchListener(interactionListener);
        }
    }

    /**
     * Method to remove Floating View from Window Manager
     */
    public void removeFloatingView() {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                try {
                    // Clean up fade handler
                    if (fadeHandler != null && fadeRunnable != null) {
                        fadeHandler.removeCallbacks(fadeRunnable);
                        fadeHandler = null;
                        fadeRunnable = null;
                    }

                    if (windowManager != null) {
                        windowManager.removeViewImmediate(viewRoot);
                    }
                    windowManager = null;
                    viewRoot = null;
                    rootParams = null;

                    // Make shouldPauseTimer false and reset countdowntimer while removing the
                    // floating view from window
                    shouldPauseTimer = false;
                    timerPauseAndReset();

                    // Also cancel pauseBlockingTimer to prevent zombie timer writing to removed
                    // views
                    if (pauseBlockingTimer != null) {
                        pauseBlockingTimer.cancel();
                        pauseBlockingTimer = null;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });

    }

    /**
     * Method Which gets the activityName, timer and isActivityStarted Boolean
     * We are assigning above value to global variables for further usage.
     */
    public void saveActivityAndTimer(boolean isActivityStarted, int timer, String activityName,
            String completionRequirements, boolean isTimerPaused) {
        isFloatingActivityStarted = isActivityStarted;
        floatingRemainingActivityTimer = timer;
        floatingActivityName = activityName;
        floatingActivityCompletionRequirements = completionRequirements;
        isTimerPausedByUser = isTimerPaused;
    }

    /**
     * Floating View configuration
     * Adds floating view to the window
     * Configures CountDownTimer in the floatingView
     */
    public void configFloatingView() {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                if (isFloatingActivityStarted) {
                    addFloatingView();
                    if (windowManager != null && rootParams != null && viewRoot != null) {
                        configCountDownTimer(shouldPauseTimer);
                    }
                }
            }
        });
    }

    /**
     * This is the config method to start mount the floating view when users
     * pause soft/gentle blocking
     */
    public void configPauseBlockingFloatingView(String runningApp) {
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                long remainingMs = softBlockBypassUntil - System.currentTimeMillis();

                boolean hasForegroundApp = lastForegroundApp != null;
                boolean isNotByPassApp = hasForegroundApp && !lastForegroundApp.equals(softBlockBypassPackageId);

                if (userClosedPauseBlockingLayout && hasForegroundApp && isNotByPassApp) {
                    userClosedPauseBlockingLayout = false;
                }

                boolean isByPassActive = softBlockBypassUntil > System.currentTimeMillis();
                boolean isRunningByPassApp = runningApp != null && softBlockBypassPackageId != null
                        && softBlockBypassPackageId.equals(runningApp);
                boolean shouldShowFloatingView = isByPassActive && isRunningByPassApp && !userClosedPauseBlockingLayout;

                if (shouldShowFloatingView) {
                    timerPauseAndReset();
                    addFloatingView();
                    if (viewRoot != null) {
                        Button pauseBlockingBtn = viewRoot.findViewById(R.id.pause_blocking_btn);
                        if (pauseBlockingBtn != null) {
                            pauseBlockingBtn.setVisibility(View.GONE);
                        }

                        if (pauseBlockingTimer == null) {
                            pauseBlockingTimer = new CountDownTimer(remainingMs, 1000) {

                                @Override
                                public void onTick(long millisUntilFinished) {
                                    long durationInSeconds = millisUntilFinished / 1000;
                                    long remainedMinutes = durationInSeconds / 60;
                                    long remainedSeconds = durationInSeconds % 60;

                                    if (textTimer != null && activityNameTextView != null) {
                                        activityNameTextView.setText(softUnblockingReason);
                                        String timerText = String.format("%02d:%02d", remainedMinutes, remainedSeconds);
                                        textTimer.setText(timerText);
                                    }
                                }

                                @Override
                                public void onFinish() {
                                    if (textTimer != null) {
                                        textTimer.setText("00:00");
                                    }
                                    pauseBlockingTimer = null;
                                }

                            }.start();
                        }

                        close.setOnClickListener(view -> {
                            userClosedPauseBlockingLayout = true;
                            if (pauseBlockingTimer != null) {
                                pauseBlockingTimer.cancel();
                                pauseBlockingTimer = null;
                            }
                            removeFloatingView();
                        });
                    }
                } else {
                    removeFloatingView();
                }
                lastForegroundApp = runningApp;
            }
        });
    }

    /**
     * Listener which run after some time interval to call foreground app method
     * and to decide whether to show overlay popup or we have to hide that.
     */
    @RequiresApi(api = Build.VERSION_CODES.P)
    public void addListener(String routine_name, String activity_name, Set allowed_apps) {
        // Log when addListener is called to track multiple calls
        Log.d("OverlayControl", "addListener called: routine=" + routine_name + ", activity=" + activity_name +
                ", allowedApps size=" + (allowed_apps != null ? allowed_apps.size() : 0));

        SharedPreferences shared_preference = context.getSharedPreferences(Constants.SHARED_PREFERENCE,
                Context.MODE_PRIVATE);

        cachedInstalledAppPackageNames = shared_preference.getStringSet(Constants.INSTALLED_PACKAGE_NAMES, null);

        if (overlayEnabled) {
            stopService(false);
        }

        String defaultLauncher = isDefaultLauncher();

        if (detectBlockedAppsTimer == null) {
            detectBlockedAppsTimer = new Timer();
        } else {
            // Cancel the previous TimerTask if it exists
            detectAndBlockAppsTask.cancel();
        }

        detectAndBlockAppsTask = new TimerTask() {
            @RequiresApi(api = Build.VERSION_CODES.P)
            @Override
            public void run() {
                String runningApp = getForegroundApp();

                if (runningApp != null && runningApp.equals("com.focusbear")) {
                    return;
                }

                Set<String> blockedAppsData = shared_preference.getStringSet(Constants.BLOCKED_APPS_DATA, null);
                blockedApps.clear();
                if (blockedAppsData != null && !blockedAppsData.isEmpty()) {
                    blockedApps.addAll(blockedAppsData);
                }

                Set<String> allowedAppsData = shared_preference.getStringSet(Constants.ALLOWED_APPS_DATA, null);
                allowedApps.clear();
                if (allowedAppsData != null && !allowedAppsData.isEmpty()) {
                    allowedApps.addAll(allowedAppsData);
                }

                String restrictedAppListType = shared_preference.getString(Constants.RESTRICTED_APP_LIST_TYPE,
                        Constants.BLOCK_LIST);

                if (Constants.BLOCK_LIST.equals(restrictedAppListType)) {
                    isBlockList = true;
                } else if (Constants.ALLOW_LIST.equals(restrictedAppListType)) {
                    isBlockList = false;
                }
                long lastUpdateTime = shared_preference.getLong(Constants.LAST_UPDATE_TIME, 0);

                // Check if data needs to be updated (current time - last update time > 15
                // minutes)
                long currentTime = System.currentTimeMillis();
                if (lastUpdateTime == 0 || (currentTime - lastUpdateTime) > (FIFTEEN_MINUTES_IN_SECONDS)) {
                    // Data needs to be updated, call cacheInstalledApps method
                    cacheInstalledApps();

                    // Retrieve the updated data
                    cachedInstalledAppPackageNames = shared_preference.getStringSet(Constants.INSTALLED_PACKAGE_NAMES,
                            null);
                }

                if (activitySpecificAllowedApps == null || activitySpecificAllowedApps.isEmpty()) {
                    activitySpecificAllowedAppsPackageName.clear();
                    activitySpecificAllowedAppsName.clear();
                } else {
                    Map<String, List<String>> result = getPackageNamesAndAppNames(activitySpecificAllowedApps,
                            cachedInstalledAppPackageNames);
                    List<String> appNames = result.get("appNames");
                    List<String> appPackageNames = result.get("appPackageNames");

                    // Add list of AppNames/PackageNames from activity based allowed_apps
                    activitySpecificAllowedAppsName.addAll(appNames);
                    activitySpecificAllowedAppsPackageName.addAll(appPackageNames);
                }

                runningApp = getForegroundApp();

                if (runningApp == null || "NULL".equals(runningApp) || runningApp.isEmpty()) {
                    return;
                }

                boolean isByPassActive = softBlockBypassUntil > System.currentTimeMillis();
                boolean isRunningByPassApp = runningApp != null && softBlockBypassPackageId != null
                        && softBlockBypassPackageId.equals(runningApp);

                if (isByPassActive && isRunningByPassApp) {
                    configPauseBlockingFloatingView(runningApp);
                    return;
                } else if (pauseBlockingTimer != null) {
                    new Handler(Looper.getMainLooper()).post(() -> {
                        if (pauseBlockingTimer != null) {
                            pauseBlockingTimer.cancel();
                            pauseBlockingTimer = null;
                        }
                        removeFloatingView();
                    });
                }

                Drawable blockedAppIcon = getRunningAppIcon(runningApp);
                Set<String> excludedPackageNames = getExcludedPackageNames(context);

                // Determine which apps to actually block based on isGlobalBlocking flag and
                // schedules
                // Handle overlap: if both global blocking and schedule blocking are active,
                // merge both lists
                boolean isGlobalBlocking = shared_preference.getBoolean(Constants.IS_GLOBAL_BLOCKING, false);
                boolean isGlobalHabitBlockingEnabled = shared_preference
                        .getBoolean(Constants.GLOBAL_HABIT_BLOCKING_ENABLED, true); // Default to true
                Set<String> effectiveBlockedApps = new HashSet<>();

                // Check if schedule blocking is active (has active custom schedules)
                // Use activeIds from BlockingScheduleManager which already accounts for pause
                // state
                java.util.List<com.focusbear.blocking.BlockingSchedule> activeCustomSchedules = new java.util.ArrayList<>();
                boolean hasActiveScheduleBlocking = false;
                String activeScheduleBlockingMode = null;
                String activeScheduleName = null;
                try {
                    com.focusbear.blocking.BlockingScheduleManager manager = com.focusbear.blocking.BlockingScheduleManager.Companion
                            .obtain(context);
                    manager.ensureInitialized();

                    // Get active custom schedules from activeIds (already accounts for pause state)
                    activeCustomSchedules = manager.getActiveCustomSchedules();

                    Log.d("OverlayControl", "activeCustomSchedules: " + activeCustomSchedules);

                    hasActiveScheduleBlocking = !activeCustomSchedules.isEmpty();
                    if (hasActiveScheduleBlocking) {
                        activeScheduleBlockingMode = determineScheduleBlockingMode(activeCustomSchedules);

                        Log.d("OverlayControl", "activeScheduleBlockingMode: " + activeScheduleBlockingMode);

                        activeScheduleName = getActiveScheduleName(activeCustomSchedules);
                        Log.d("OverlayControl", "activeScheduleName: " + activeScheduleName);
                    }
                } catch (Exception e) {
                    Log.e("OverlayControl", "Failed to get active schedules", e);
                }

                // Merge blocked apps based on what's active
                // Only use global blocked apps if global blocking is active AND global habit
                // blocking is enabled
                if (isGlobalBlocking && isGlobalHabitBlockingEnabled) {
                    // Add global blocked apps
                    effectiveBlockedApps.addAll(blockedApps);
                }

                if (hasActiveScheduleBlocking) {
                    // Add custom schedule packages
                    for (com.focusbear.blocking.BlockingSchedule schedule : activeCustomSchedules) {
                        java.util.List<String> schedulePackages = schedule.getBlockedPackages();
                        if (schedulePackages != null) {
                            effectiveBlockedApps.addAll(schedulePackages);
                        }
                    }
                }

                int blockedAppsHash = effectiveBlockedApps.hashCode();
                String blockingDecisionLogKey = runningApp + "|"
                        + isBlockList + "|"
                        + effectiveBlockedApps.contains(runningApp) + "|"
                        + isGlobalBlocking + "|"
                        + isGlobalHabitBlockingEnabled + "|"
                        + hasActiveScheduleBlocking + "|"
                        + activeScheduleBlockingMode + "|"
                        + activeScheduleName + "|"
                        + blockedAppsHash;
                if (shouldLogBlockingDecision(blockingDecisionLogKey)) {
                    String blockedPreview = NativeBlockingLogger.formatBlockedPreviewLabels(
                            context,
                            effectiveBlockedApps,
                            NativeBlockingLogger.DEFAULT_BLOCKED_PREVIEW_MAX_PRIMARY);
                    NativeBlockingLogger.logBlockingEvent(context,
                            "blocking_decision_check pkg=" + runningApp
                                    + " appName=" + getAppNames(runningApp)
                                    + " isBlockList=" + isBlockList
                                    + " inEffectiveBlocked=" + effectiveBlockedApps.contains(runningApp)
                                    + " isGlobalBlocking=" + isGlobalBlocking
                                    + " isGlobalHabitBlockingEnabled=" + isGlobalHabitBlockingEnabled
                                    + " hasActiveScheduleBlocking=" + hasActiveScheduleBlocking
                                    + " scheduleMode=" + activeScheduleBlockingMode
                                    + " scheduleName=" + activeScheduleName
                                    + " blockedPreview=" + blockedPreview);
                }

                if (!excludedPackageNames.contains(runningApp)) {
                    boolean hasAllowedApps = allowedApps != null && !allowedApps.isEmpty();
                    boolean hasBlockedApps = !effectiveBlockedApps.isEmpty();
                    boolean hasActivitySpecificAllowedApps = activitySpecificAllowedAppsPackageName != null
                            && !activitySpecificAllowedAppsPackageName.isEmpty();

                    if (hasAllowedApps || hasBlockedApps || hasActivitySpecificAllowedApps) {
                        boolean isBlockListEnabled = isBlockList && effectiveBlockedApps.contains(runningApp);
                        boolean isAllowListEnabled = !isBlockList && !allowedApps.contains(runningApp);
                        if (isBlockListEnabled || isAllowListEnabled) {
                            if (cachedInstalledAppPackageNames != null
                                    && !cachedInstalledAppPackageNames.contains(runningApp)) {
                                return;
                            }
                            if (!activitySpecificAllowedAppsPackageName.contains(runningApp)) {
                                shouldPauseTimer = true;
                                String appName = getAppNames(runningApp);
                                hideAppAndStartMethod(
                                        routine_name,
                                        activity_name,
                                        blockedAppIcon,
                                        runningApp,
                                        appName,
                                        hasActiveScheduleBlocking,
                                        activeScheduleBlockingMode,
                                        activeScheduleName);
                            } else {
                                shouldPauseTimer = false;
                                configFloatingView();
                            }
                        } else {
                            if (!activitySpecificAllowedAppsPackageName.isEmpty()
                                    && !activitySpecificAllowedAppsPackageName.contains(runningApp)) {
                                shouldPauseTimer = true;
                            } else {
                                shouldPauseTimer = false;
                            }

                            configFloatingView();
                            stopMethod();
                        }
                    }
                } else {
                    if (overlayEnabled && !runningApp.equals(defaultLauncher)) {
                        stopMethod();
                    }
                }
            }
        };
        /**
         * Use of scheduleAtFixedRate is strongly discouraged because it can lead to
         * unexpected behavior
         * when Android processes become cached (tasks may unexpectedly execute hundreds
         * or thousands of times
         * in quick succession when a process changes from cached to uncached); prefer
         * using schedule
         */
        detectBlockedAppsTimer.schedule(detectAndBlockAppsTask, 0, DETECT_AND_BLOCK_APP_TIMER_INTERVAL); // put here
                                                                                                         // time 1000
                                                                                                         // milliseconds=1
                                                                                                         // second
    }

    @RequiresApi(api = Build.VERSION_CODES.P)
    public void startMethod(String routine_name, String activity_name, Boolean isFocusModeEnabled,
            Boolean isSuperStrictMode, String reason, Boolean shouldHideApp, String blockedUrl) {
        runningApp = getForegroundApp();
        Set<String> excludedPackageNames = getExcludedPackageNames(context);
        if (runningApp != null && !excludedPackageNames.contains(runningApp)) {
            String runningAppName = getAppNames(runningApp);
            Drawable blockedAppIcon = getRunningAppIcon(runningApp);
            if (shouldHideApp) {
                hideApp();
            }
            Window.getInstance(context).open(
                    routine_name,
                    activity_name,
                    blockedAppIcon,
                    (blockedUrl != null && !blockedUrl.isEmpty()) ? blockedUrl : runningAppName,
                    isFocusModeEnabled,
                    isSuperStrictMode,
                    reason);
        }
    }

    public void sendEventToGetCurrentActivity(
            String appPackageName,
            String appName,
            boolean isScheduleBlockingActive,
            String scheduleBlockingMode,
            String scheduleName,
            String routineName,
            String activityName,
            Drawable blockedAppIcon) {
        String eventKey = appPackageName != null ? appPackageName : "";

        if (shouldSkipGetCurrentActivityEvent(eventKey)) {
            return;
        }

        WritableMap params = Arguments.createMap();
        params.putBoolean("GET_CURRENT_ACTIVITY", true);
        params.putString("BLOCK_APP_PACKAGE_NAME", appPackageName);
        params.putString("BLOCK_APP_NAME", appName);
        params.putBoolean("IS_SCHEDULE_BLOCKING_ACTIVE", isScheduleBlockingActive);
        params.putString("SCHEDULE_BLOCKING_MODE", scheduleBlockingMode);
        params.putString("ACTIVE_SCHEDULE_NAME", scheduleName);
        Log.d("OverlayControl", "Sending event OVERLAY_SERVICE with params: " + params.toString());
        try {
            String jsonString = new JSONObject(params.toHashMap()).toString();
            Log.d("OverlayControl", "About to call sendOverlayEventToJS with: " + jsonString);
            OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
            if (overlayModule != null) {
                Log.d("OverlayControl", "Sending event OVERLAY_SERVICE with params: " + jsonString);
                overlayModule.sendOverlayEventToJS(jsonString);
            } else {
                Log.w("OverlayControl",
                        "No registered OverlayModule instance available, skipping event emission, falling back to native overlay");
                try {
                    hideApp();
                    Window.getInstance(context).open(
                            routineName,
                            activityName,
                            blockedAppIcon,
                            appName,
                            false, // isFocusModeEnabled
                            false, // isSuperStrictMode
                            null // reason
                    );
                } catch (Exception e) {
                    Log.e("OverlayControl", "Fallback open() failed", e);
                }
            }
        } catch (Exception e) {
            Log.e("OverlayControl", "Exception in sendOverlayEventToJS", e);
            e.printStackTrace();
        }
    }

    public void sendEventToTriggerUrlBlocking(String blockedUrl, boolean shouldHideApp) {
        String eventKey = blockedUrl != null ? blockedUrl : "";
        if (shouldSkipGetCurrentActivityEvent(eventKey)) {
            return;
        }

        NativeBlockingLogger.logBlockingEvent(
                context,
                "url_block_triggered url=" + blockedUrl
                        + " shouldHideApp=" + shouldHideApp
        );

        WritableMap params = Arguments.createMap();
        params.putBoolean("GET_CURRENT_ACTIVITY", true);
        params.putString("BLOCKED_URL", blockedUrl);
        params.putBoolean("SHOULD_HIDE_APP", shouldHideApp);
        Log.d("OverlayControl", "Sending event OVERLAY_SERVICE with params: " + params.toString());
        try {
            String jsonString = new JSONObject(params.toHashMap()).toString();
            Log.d("OverlayControl", "About to call sendOverlayEventToJS with: " + jsonString);
            OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
            if (overlayModule != null) {
                overlayModule.sendOverlayEventToJS(jsonString);
            } else {
                Log.w("OverlayControl", "No registered OverlayModule instance available, skipping event emission");
            }
        } catch (Exception e) {
            Log.e("OverlayControl", "Exception in sendOverlayEventToJS", e);
            e.printStackTrace();
        }
    }

    public void stopMethod() {
        if (overlayEnabled) {
            stopService(false);
        }
    }

    private String determineScheduleBlockingMode(
            java.util.List<com.focusbear.blocking.BlockingSchedule> activeSchedules) {
        if (activeSchedules == null || activeSchedules.isEmpty()) {
            return null;
        }
        for (com.focusbear.blocking.BlockingSchedule schedule : activeSchedules) {
            try {
                String mode = schedule.getBlockingMode();
                if ("strict".equalsIgnoreCase(mode) || "super-strict".equalsIgnoreCase(mode)) {
                    return "strict";
                }
            } catch (Exception e) {
                Log.w("OverlayControl", "Failed to read schedule blocking mode", e);
            }
        }
        return "gentle";
    }

    private String getActiveScheduleName(java.util.List<com.focusbear.blocking.BlockingSchedule> activeSchedules) {
        if (activeSchedules == null || activeSchedules.isEmpty()) {
            return null;
        }
        // Return the name of the first active schedule
        try {
            com.focusbear.blocking.BlockingSchedule firstSchedule = activeSchedules.get(0);
            return firstSchedule.getName();
        } catch (Exception e) {
            Log.w("OverlayControl", "Failed to read schedule name", e);
        }
        return null;
    }

    /**
     * Hides/Minimize the restricted app and Start method to show overlay
     * distraction window alert
     */
    @RequiresApi(api = Build.VERSION_CODES.P)
    public void hideAppAndStartMethod(
            String routine_name,
            String activity_name,
            Drawable blockedAppIcon,
            String appPackageName,
            String appName,
            boolean isScheduleBlockingActive,
            String scheduleBlockingMode,
            String scheduleName) {
        overlayEnabled = false;

        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                removeFloatingView();
            }
        });

        // Try to notify JS first; if OverlayModule is unavailable, fall back to native
        // overlay
        OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
        if (overlayModule == null) {
            Log.w("OverlayControl", "OverlayModule not registered; falling back to native overlay window");
            try {
                // Hide the blocked app first
                hideApp();
                Window.getInstance(context).open(
                        routine_name,
                        activity_name,
                        blockedAppIcon,
                        appName,
                        false, // isFocusModeEnabled
                        false, // isSuperStrictMode
                        null // reason
                );
            } catch (Exception e) {
                Log.e("OverlayControl", "Fallback open() failed", e);
            }
        } else {
            // JS bridge is available - check if we can open breathing exercise natively
            // (soft block)
            boolean canOpenBreathingExercise = canOpenBreathingExerciseNatively(
                    appPackageName,
                    isScheduleBlockingActive,
                    scheduleBlockingMode);

            if (canOpenBreathingExercise) {
                long now = System.currentTimeMillis();
                if (now - lastBreathingExerciseOpenedAt < BREATHING_EXERCISE_COOLDOWN_MS) {
                    Log.d("OverlayControl", "[SOFT_BLOCK] Skipping breathing exercise - cooldown active (last opened "
                            + (now - lastBreathingExerciseOpenedAt) + "ms ago)");
                    return;
                }
                lastBreathingExerciseOpenedAt = now;

                // Open breathing exercise directly via deep link from native context
                // This works even when accessibility is disabled because we're launching from
                // the overlay context
                Log.d("OverlayControl", "[SOFT_BLOCK] Opening breathing exercise natively for pkg=" + appPackageName);
                NativeBlockingLogger.logBlockingEvent(context,
                        "soft_block_open_breathing_exercise pkg=" + appPackageName
                                + " appName=" + appName
                                + " source="
                                + (isScheduleBlockingActive ? "schedule" : "global")
                                + " scheduleMode=" + scheduleBlockingMode
                                + " scheduleName=" + scheduleName);

                String deepLinkUrl = "focusbear://breathing-exercise/" + appName + "/" + appPackageName;
                Window.getInstance(context).openDeepLinkOverlay(deepLinkUrl);
            } else {
                NativeBlockingLogger.logBlockingEvent(context,
                        "hard_block_send_to_js pkg=" + appPackageName
                                + " appName=" + appName
                                + " source="
                                + (isScheduleBlockingActive ? "schedule" : "global")
                                + " scheduleMode=" + scheduleBlockingMode
                                + " scheduleName=" + scheduleName
                                + " routine=" + routine_name
                                + " activity=" + activity_name);
                sendEventToGetCurrentActivity(
                        appPackageName,
                        appName,
                        isScheduleBlockingActive,
                        scheduleBlockingMode,
                        scheduleName,
                        routine_name,
                        activity_name,
                        blockedAppIcon);
            }
        }
    }

    /**
     * Get App Icon of the restricted app and Start method to show overlay
     * distraction window alert
     *
     * @return Drawable
     */
    public Drawable getRunningAppIcon(String runningApp) {
        try {
            Drawable blockedAppIcon = context.getPackageManager().getApplicationIcon(runningApp);
            return blockedAppIcon;
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return null;
    }

    /**
     * Hides/Minimize the current opened app
     */
    public void hideApp() {
        Intent startMain = new Intent(Intent.ACTION_MAIN);
        startMain.addCategory(Intent.CATEGORY_HOME);
        startMain.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        context.startActivity(startMain);
    }

    public String getAppNames(String currentAppPackage) {
        PackageManager packageManager = context.getPackageManager();
        String appName = "";
        try {
            appName = (String) packageManager.getApplicationLabel(
                    packageManager.getApplicationInfo(currentAppPackage, PackageManager.GET_META_DATA));
        } catch (PackageManager.NameNotFoundException e) {
            e.printStackTrace();
        }
        return appName;
    }

    /**
     * Returns the name of the app packageName currently in foreground.
     * Also Supports Android 14 / API 34
     * Returns null if usage stats permission is not granted or on
     * SecurityException.
     */
    public String getForegroundApp() {
        if (!PermissionUtils.hasUsageStatsPermission(context)) {
            return null;
        }
        try {
            String foregroundApp = null;
            UsageStatsManager usageStatsManager = (UsageStatsManager) context
                    .getSystemService(Context.USAGE_STATS_SERVICE);
            if (usageStatsManager == null)
                return null;
            long currentTime = System.currentTimeMillis();
            UsageEvents usageEvents = usageStatsManager.queryEvents(currentTime - 6000, currentTime);
            UsageEvents.Event event = new UsageEvents.Event();

            while (usageEvents.hasNextEvent()) {
                usageEvents.getNextEvent(event);
                // MOVE_TO_FOREGROUND is deprecated since Android Q (API 29) in favor of
                // ACTIVITY_RESUMED:
                // https://developer.android.com/reference/android/app/usage/UsageEvents.Event#MOVE_TO_FOREGROUND
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    if (event.getEventType() == UsageEvents.Event.ACTIVITY_RESUMED) {
                        foregroundApp = event.getPackageName();
                    }
                } else { // Else we use MOVE_TO_FOREGROUND.
                    if (event.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                        foregroundApp = event.getPackageName();
                    }
                }
            }

            // It Will fetch the packageName of the app which is already in foreground using
            // queryUsageStats
            if (foregroundApp == null) {
                List<UsageStats> appList = usageStatsManager.queryUsageStats(UsageStatsManager.INTERVAL_DAILY,
                        currentTime - 6000, currentTime);
                if (appList != null && !appList.isEmpty()) {
                    SortedMap<Long, UsageStats> usageStatsMap = new TreeMap<>();
                    for (UsageStats usageStats : appList) {
                        usageStatsMap.put(usageStats.getLastTimeUsed(), usageStats);
                    }

                    if (!usageStatsMap.isEmpty()) {
                        foregroundApp = usageStatsMap.get(usageStatsMap.lastKey()).getPackageName();
                    }
                }
            }

            return foregroundApp;
        } catch (SecurityException e) {
            Log.w("OverlayControl", "Usage stats access not granted: " + e.getMessage());
            return null;
        }
    }

    /**
     * Returns the list of packageName/appName based on return type
     * It will find the app details in installed apps list based on the activity
     * based allowed_apps and then it will return the List
     *
     * @return
     */
    public Map<String, List<String>> getPackageNamesAndAppNames(Set<String> searchAppNames,
            Set<String> installedAppPackageNames) {
        activitySpecificAllowedAppsPackageName.clear();
        activitySpecificAllowedAppsName.clear();
        List<String> packageNames = new ArrayList<>();
        List<String> appNames = new ArrayList<>();
        PackageManager pm = context.getPackageManager();

        // 1) For search terms that look like package names (e.g.
        // "com.google.android.youtube"),
        // resolve them directly so we don't depend on the cache containing that
        // package.
        for (String searchAppName : searchAppNames) {
            if (searchAppName == null || searchAppName.isEmpty())
                continue;
            if (searchAppName.contains(".")) {
                try {
                    ApplicationInfo appInfo = pm.getApplicationInfo(searchAppName, 0);
                    if (appInfo != null) {
                        String appName = (String) pm.getApplicationLabel(appInfo);
                        if (appName != null)
                            appName = appName.trim();
                        if (!packageNames.contains(searchAppName)) {
                            packageNames.add(searchAppName);
                            appNames.add(appName != null ? appName : searchAppName);
                        }
                    }
                } catch (PackageManager.NameNotFoundException ignored) {
                    // Not installed or invalid package, skip
                }
            }
        }

        // 2) Match from cached installed apps (by app name or by package name)
        if (installedAppPackageNames != null) {
            for (String packageName : installedAppPackageNames) {
                if (packageNames.contains(packageName))
                    continue; // already added above
                ApplicationInfo appInfo = null;
                try {
                    appInfo = pm.getApplicationInfo(packageName, 0);
                } catch (PackageManager.NameNotFoundException e) {
                    continue;
                }
                if (appInfo != null) {
                    String appName = ((String) appInfo.loadLabel(pm)).trim();
                    String lowercaseAppName = appName.toLowerCase();
                    String lowercasePackageName = packageName.toLowerCase();

                    for (String searchAppName : searchAppNames) {
                        String lowercaseSearchAppName = searchAppName.toLowerCase();
                        boolean matchesAppName = lowercaseAppName.contains(lowercaseSearchAppName)
                                || lowercaseAppName.equals(lowercaseSearchAppName);
                        boolean matchesPackageName = lowercasePackageName.equals(lowercaseSearchAppName)
                                || lowercasePackageName.contains(lowercaseSearchAppName);
                        if (matchesAppName || matchesPackageName) {
                            packageNames.add(packageName);
                            appNames.add(appName);
                            break;
                        }
                    }
                }
            }
        }

        Map<String, List<String>> result = new HashMap<>();
        result.put("appNames", appNames);
        result.put("appPackageNames", packageNames);
        return result;
    }

    public Map<String, List<String>> getInstalledApps() {
        PackageManager pm = context.getPackageManager();
        List<String> packageNames = new ArrayList<>();
        List<String> appNames = new ArrayList<>();
        Set<String> packageNameSet = new HashSet<>();
        Intent launcherIntent = new Intent(Intent.ACTION_MAIN, null);
        launcherIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        List<ResolveInfo> resolveInfoList;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            resolveInfoList = pm.queryIntentActivities(launcherIntent,
                    PackageManager.ResolveInfoFlags.of(PackageManager.MATCH_ALL));
        } else {
            resolveInfoList = pm.queryIntentActivities(launcherIntent, 0);
        }

        Set<String> excludedPackageNames = getExcludedPackageNames(context);

        for (ResolveInfo resolveInfo : resolveInfoList) {
            String packageName = resolveInfo.activityInfo.packageName;
            if (!excludedPackageNames.contains(packageName)) {
                packageNameSet.add(packageName);
            }
        }
        for (String packageName : packageNameSet) {
            ApplicationInfo appInfo = null;
            try {
                appInfo = pm.getApplicationInfo(packageName, 0);
            } catch (PackageManager.NameNotFoundException e) {
                throw new RuntimeException(e);
            }
            if (appInfo != null) {
                String appName = ((String) appInfo.loadLabel(pm)).trim();
                appNames.add(appName);
                packageNames.add(packageName);
            }
        }

        Map<String, List<String>> result = new HashMap<>();
        result.put("appNames", appNames);
        result.put("appPackageNames", packageNames);
        return result;
    }

    /**
     * This method will cache the installed apps PackageNames/AppNames in
     * SharedPreference.
     */
    public void cacheInstalledApps() {
        Map<String, List<String>> result = getInstalledApps();
        if (result == null || result.isEmpty()) {
            return;
        }

        List<String> appNames = result.get("appNames");
        List<String> appPackageNames = result.get("appPackageNames");
        if (appNames == null || appPackageNames == null) {
            return;
        }
        Set<String> appNamesSet = new HashSet<>(appNames);
        Set<String> appPackageNamesSet = new HashSet<>(appPackageNames);
        long currentTime = System.currentTimeMillis();

        SharedPreferences shared_preference = context.getSharedPreferences(Constants.SHARED_PREFERENCE,
                Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = shared_preference.edit();
        editor.putStringSet(Constants.INSTALLED_APP_NAMES, appNamesSet);
        editor.putStringSet(Constants.INSTALLED_PACKAGE_NAMES, appPackageNamesSet);
        editor.putLong(Constants.LAST_UPDATE_TIME, currentTime);
        editor.apply();
    }

    /**
     * Returns the package name of Default dialer of mobile.
     *
     * @return
     */
    public String isDefaultDialer() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            TelecomManager manager = (TelecomManager) context.getSystemService(Context.TELECOM_SERVICE);
            return manager.getDefaultDialerPackage();
        }
        return null;// Change it based on your requirement.
    }

    /**
     * Returns package name of default messaging app of mobile.
     *
     * @return
     */
    public String isDefaultMessageApp() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            String defaultSmsPackageName = Telephony.Sms.getDefaultSmsPackage(context);
            if (defaultSmsPackageName != null) {
                return defaultSmsPackageName;
            }
        }
        return defaultSMSPackageName;
    }

    /**
     * Returns package name of launcher/home in mobile phone.
     *
     * @return
     */
    public String isDefaultLauncher() {
        PackageManager localPackageManager = context.getPackageManager();
        Intent intent = new Intent("android.intent.action.MAIN");
        intent.addCategory("android.intent.category.HOME");
        return Objects.requireNonNull(localPackageManager.resolveActivity(intent,
                PackageManager.MATCH_DEFAULT_ONLY)).activityInfo.packageName;
    }

    /**
     * Returns package name of camera in mobile phone.
     *
     * @return
     */
    public String isDefaultCamera() {
        final PackageManager packageManager = context.getPackageManager();
        final Intent intent = new Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE);

        List<ResolveInfo> listCam = packageManager.queryIntentActivities(intent, 0);
        for (ResolveInfo res : listCam) {
            return res.activityInfo.packageName;
        }
        return null;
    }

    /**
     * React Method called from android also to stop overlay functionality.
     *
     * @param permanent It's boolean value on the basis of which
     *                  we decide to permanent hide overlay or for some time.
     */
    public void stopService(boolean permanent) {
        if (detectBlockedAppsTimer != null) {
            detectBlockedAppsTimer.cancel();
            detectBlockedAppsTimer.purge();
            detectBlockedAppsTimer = null;
        }
        if (overlayEnabled) {
            overlayEnabled = false;
        }
        Window.getInstance(context).close();
    }
}