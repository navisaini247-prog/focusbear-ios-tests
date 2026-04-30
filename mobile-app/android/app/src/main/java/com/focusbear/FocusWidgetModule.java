package com.focusbear;

import android.appwidget.AppWidgetManager;
import android.content.SharedPreferences;
import android.content.ComponentName;
import android.content.Context;
import com.focusbear.Constants;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import androidx.annotation.NonNull;
import android.util.Log;


public class FocusWidgetModule extends ReactContextBaseJavaModule {
    private String getSafeWhatsNextPrefix(String prefix) {
        String fallback = getReactApplicationContext().getString(R.string.widget_whats_next);
        if (prefix == null) return fallback;
        String trimmed = prefix.trim();
        if (trimmed.isEmpty() || trimmed.contains("widget.whatsNext")) {
            return fallback;
        }
        return trimmed;
    }

    public FocusWidgetModule(ReactApplicationContext context) {
        super(context);
    }

    @NonNull
    @Override
    public String getName() {
        return "FocusWidgetModule";
    }

    @ReactMethod
    public void updateWidget(String currentRoutineName, String blockingReason, String nextHabitName, String blockingReasonKey, String whatsNextPrefix, String defaultRoutine, String noReasonProvided, String noNextHabit, String themeMode, String deepLinkTarget, String nextHabitPlaceholderKey) {
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putString(Constants.ROUTINE_NAME, currentRoutineName);
        editor.putString(Constants.BLOCKING_REASON, blockingReason);
        editor.putString(Constants.NEXT_HABIT_NAME, nextHabitName);
        if (nextHabitPlaceholderKey != null && !nextHabitPlaceholderKey.trim().isEmpty()) {
            editor.putString(Constants.NEXT_HABIT_PLACEHOLDER_KEY, nextHabitPlaceholderKey.trim());
        } else {
            editor.remove(Constants.NEXT_HABIT_PLACEHOLDER_KEY);
        }
        if (blockingReasonKey != null) {
            editor.putString(Constants.BLOCKING_REASON_KEY, blockingReasonKey);
        } else {
            editor.remove(Constants.BLOCKING_REASON_KEY);
        }
        editor.putString(Constants.WHATS_NEXT_PREFIX, getSafeWhatsNextPrefix(whatsNextPrefix));
        if (defaultRoutine != null) editor.putString(Constants.DEFAULT_ROUTINE, defaultRoutine);
        if (noReasonProvided != null) editor.putString(Constants.NO_REASON_PROVIDED, noReasonProvided);
        if (noNextHabit != null) editor.putString(Constants.NO_NEXT_HABIT, noNextHabit);
        if (themeMode != null) editor.putString(Constants.THEME_MODE, themeMode);
        if (deepLinkTarget != null && !deepLinkTarget.trim().isEmpty()) {
            editor.putString(Constants.WIDGET_DEEPLINK_TARGET, deepLinkTarget.trim());
        } else {
            editor.remove(Constants.WIDGET_DEEPLINK_TARGET);
        }
        editor.apply();

        refreshWidget();
    }

    @ReactMethod
    public void updateStreakWidget(int morningStreak, int eveningStreak, int focusStreak, boolean morningDone, boolean eveningDone, boolean focusDone, String labelTitle, String labelMorning, String labelEvening, String labelFocus, String labelDay, String themeMode) {
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        editor.putInt(Constants.MORNING_STREAK, morningStreak);
        editor.putInt(Constants.EVENING_STREAK, eveningStreak);
        editor.putInt(Constants.FOCUS_STREAK, focusStreak);
        editor.putBoolean(Constants.MORNING_STREAK_DONE_TODAY, morningDone);
        editor.putBoolean(Constants.EVENING_STREAK_DONE_TODAY, eveningDone);
        editor.putBoolean(Constants.FOCUS_STREAK_DONE_TODAY, focusDone);
        if (labelTitle != null) editor.putString(Constants.STREAK_LABEL_TITLE, labelTitle);
        if (labelMorning != null) editor.putString(Constants.STREAK_LABEL_MORNING, labelMorning);
        if (labelEvening != null) editor.putString(Constants.STREAK_LABEL_EVENING, labelEvening);
        if (labelFocus != null) editor.putString(Constants.STREAK_LABEL_FOCUS, labelFocus);
        if (labelDay != null) editor.putString(Constants.STREAK_LABEL_DAY, labelDay);
        if (themeMode != null) editor.putString(Constants.THEME_MODE, themeMode);
        editor.apply();

        refreshStreakWidget();
    }

    @ReactMethod
    public void updateBlockedMessageWidget(String message, String themeMode) {
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        if (message != null) editor.putString(Constants.CUSTOM_BLOCKED_MESSAGE, message);
        if (themeMode != null) editor.putString(Constants.THEME_MODE, themeMode);
        editor.apply();

        refreshBlockedMessageWidget();
    }

    private void refreshWidget() {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(getReactApplicationContext());
            ComponentName componentName = new ComponentName(getReactApplicationContext(), FocusWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

            Log.d("FocusWidgetModule", "refreshWidget called, found " + appWidgetIds.length + " widget(s)");

            for (int appWidgetId : appWidgetIds) {
                FocusWidgetProvider.refreshAndUpdate(getReactApplicationContext(), appWidgetManager, appWidgetId);
            }
        } catch (Exception e) {
            Log.e("FocusWidgetModule", "Error refreshing widget", e);
        }
    }

    private void refreshStreakWidget() {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(getReactApplicationContext());
            ComponentName componentName = new ComponentName(getReactApplicationContext(), StreakWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

            Log.d("FocusWidgetModule", "refreshStreakWidget called, found " + appWidgetIds.length + " widget(s)");

            for (int appWidgetId : appWidgetIds) {
                StreakWidgetProvider.updateAppWidget(getReactApplicationContext(), appWidgetManager, appWidgetId);
            }
        } catch (Exception e) {
            Log.e("FocusWidgetModule", "Error refreshing streak widget", e);
        }
    }

    private void refreshBlockedMessageWidget() {
        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(getReactApplicationContext());
            ComponentName componentName = new ComponentName(getReactApplicationContext(), BlockedMessageWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(componentName);

            Log.d("FocusWidgetModule", "refreshBlockedMessageWidget called, found " + appWidgetIds.length + " widget(s)");

            for (int appWidgetId : appWidgetIds) {
                BlockedMessageWidgetProvider.updateAppWidget(getReactApplicationContext(), appWidgetManager, appWidgetId);
            }
        } catch (Exception e) {
            Log.e("FocusWidgetModule", "Error refreshing blocked message widget", e);
        }
    }

    @ReactMethod
    public void refreshAllWidgets() {
        refreshWidget();
        refreshStreakWidget();
        refreshBlockedMessageWidget();
    }

    /** Persist in-app theme for home-screen widgets and redraw (e.g. user toggles theme outside Home). */
    @ReactMethod
    public void syncAppThemeForWidgets(String themeMode) {
        SharedPreferences sharedPreferences = getReactApplicationContext().getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = sharedPreferences.edit();
        if (themeMode != null && !themeMode.trim().isEmpty()) {
            editor.putString(Constants.THEME_MODE, themeMode.trim().toLowerCase());
        }
        editor.apply();
        refreshWidget();
        refreshStreakWidget();
        refreshBlockedMessageWidget();
    }
}
