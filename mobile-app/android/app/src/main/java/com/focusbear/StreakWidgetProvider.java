package com.focusbear;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import android.content.SharedPreferences;
import android.content.Intent;
import android.app.PendingIntent;
import android.os.Build;
import android.os.Bundle;
import android.net.Uri;

import androidx.core.content.ContextCompat;

public class StreakWidgetProvider extends AppWidgetProvider {
    private static final int HEIGHT_THRESHOLD = 110;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        int minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 200);
        boolean isSmall = minHeight < HEIGHT_THRESHOLD;

        int layoutId = isSmall ? R.layout.streak_widget_layout_small : R.layout.streak_widget_layout;
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        SharedPreferences prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        String themeMode = prefs.getString(Constants.THEME_MODE, "dark");
        boolean isDark = WidgetThemeContext.isDarkTheme(themeMode);
        Context colorContext = WidgetThemeContext.wrap(context, isDark);

        // Read streak data
        int morningStreak = prefs.getInt(Constants.MORNING_STREAK, 0);
        int eveningStreak = prefs.getInt(Constants.EVENING_STREAK, 0);
        int focusStreak = prefs.getInt(Constants.FOCUS_STREAK, 0);
        boolean morningDone = prefs.getBoolean(Constants.MORNING_STREAK_DONE_TODAY, false);
        boolean eveningDone = prefs.getBoolean(Constants.EVENING_STREAK_DONE_TODAY, false);
        boolean focusDone = prefs.getBoolean(Constants.FOCUS_STREAK_DONE_TODAY, false);

        // Read localized labels from JS. Base English resources are only placeholders before the first JS sync.
        String labelMorning = prefs.getString(Constants.STREAK_LABEL_MORNING, context.getString(R.string.widget_streak_morning));
        String labelEvening = prefs.getString(Constants.STREAK_LABEL_EVENING, context.getString(R.string.widget_streak_evening));
        String labelFocus = prefs.getString(Constants.STREAK_LABEL_FOCUS, context.getString(R.string.widget_streak_focus));

        // Streak colors (resources respect light/dark theme)
        int morningColor = getStreakColor(colorContext, morningStreak, morningDone);
        int eveningColor = getStreakColor(colorContext, eveningStreak, eveningDone);
        int focusColor = getStreakColor(colorContext, focusStreak, focusDone);

        // Theme colors
        int textColor = ContextCompat.getColor(colorContext, R.color.widget_text);
        int dividerColor = ContextCompat.getColor(colorContext, R.color.widget_divider);

        // Set counts and colors (shared IDs across both layouts)
        views.setTextViewText(R.id.streak_morning_count, String.valueOf(morningStreak));
        views.setTextViewText(R.id.streak_evening_count, String.valueOf(eveningStreak));
        views.setTextViewText(R.id.streak_focus_count, String.valueOf(focusStreak));
        views.setTextColor(R.id.streak_morning_count, morningColor);
        views.setTextColor(R.id.streak_evening_count, eveningColor);
        views.setTextColor(R.id.streak_focus_count, focusColor);

        // Set labels
        views.setTextViewText(R.id.streak_morning_label, labelMorning);
        views.setTextViewText(R.id.streak_evening_label, labelEvening);
        views.setTextViewText(R.id.streak_focus_label, labelFocus);
        views.setTextColor(R.id.streak_morning_label, textColor);
        views.setTextColor(R.id.streak_evening_label, textColor);
        views.setTextColor(R.id.streak_focus_label, textColor);

        if (isSmall) {
            // Small layout: just root background
            if (isDark) {
                views.setInt(R.id.streak_widget_root, "setBackgroundResource", R.drawable.widget_background_dark);
            } else {
                views.setInt(R.id.streak_widget_root, "setBackgroundResource", R.drawable.widget_background);
            }
            views.setInt(R.id.streak_small_divider_one, "setBackgroundColor", dividerColor);
            views.setInt(R.id.streak_small_divider_two, "setBackgroundColor", dividerColor);
        } else {
            // Large layout: root + header backgrounds, plus day labels
            if (isDark) {
                views.setInt(R.id.streak_widget_root, "setBackgroundResource", R.drawable.widget_background_dark);
                views.setInt(R.id.streak_widget_header, "setBackgroundResource", R.drawable.widget_background_orange_dark);
            } else {
                views.setInt(R.id.streak_widget_root, "setBackgroundResource", R.drawable.widget_background);
                views.setInt(R.id.streak_widget_header, "setBackgroundResource", R.drawable.widget_background_orange);
            }

            String labelDay = prefs.getString(Constants.STREAK_LABEL_DAY, context.getString(R.string.widget_streak_days));
            String labelTitle = prefs.getString(Constants.STREAK_LABEL_TITLE, context.getString(R.string.widget_streak_title));
            int secondaryColor = ContextCompat.getColor(colorContext, R.color.widget_text_secondary);

            views.setTextViewText(R.id.streak_widget_title, labelTitle);
            views.setTextColor(R.id.streak_widget_title, ContextCompat.getColor(colorContext, R.color.widget_header_text));
            views.setTextViewText(R.id.streak_morning_days, labelDay);
            views.setTextViewText(R.id.streak_evening_days, labelDay);
            views.setTextViewText(R.id.streak_focus_days, labelDay);
            views.setTextColor(R.id.streak_morning_days, secondaryColor);
            views.setTextColor(R.id.streak_evening_days, secondaryColor);
            views.setTextColor(R.id.streak_focus_days, secondaryColor);
            views.setInt(R.id.streak_divider_one, "setBackgroundColor", dividerColor);
            views.setInt(R.id.streak_divider_two, "setBackgroundColor", dividerColor);
        }

        // Deep link
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("focusbear://home"));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, intent, flags);
        views.setOnClickPendingIntent(R.id.streak_widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static int getStreakColor(Context context, int count, boolean completedToday) {
        int resId;
        if (count == 0) {
            resId = R.color.widget_streak_inactive;
        } else if (completedToday) {
            resId = R.color.widget_streak_active;
        } else {
            resId = R.color.widget_streak_risk;
        }
        return ContextCompat.getColor(context, resId);
    }
}
