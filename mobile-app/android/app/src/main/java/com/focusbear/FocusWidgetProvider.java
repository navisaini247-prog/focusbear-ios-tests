package com.focusbear;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;
import android.content.SharedPreferences;
import com.focusbear.Constants;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.StyleSpan;
import android.graphics.Typeface;
import android.content.Intent;
import android.app.PendingIntent;
import android.os.Build;
import android.os.Bundle;
import android.net.Uri;
import androidx.core.content.ContextCompat;

public class FocusWidgetProvider extends AppWidgetProvider {
    private static final int HEIGHT_THRESHOLD = 100;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            refreshAndUpdate(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        refreshAndUpdate(context, appWidgetManager, appWidgetId);
    }

    static void refreshAndUpdate(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        String defaultRoutine = prefs.getString(Constants.DEFAULT_ROUTINE, context.getString(R.string.widget_default_routine));
        String noReasonProvided = prefs.getString(Constants.NO_REASON_PROVIDED, context.getString(R.string.widget_no_reason_provided));
        String noNextHabit = prefs.getString(Constants.NO_NEXT_HABIT, context.getString(R.string.widget_no_next_habit));
        updateAppWidget(context, appWidgetManager, appWidgetId,
            prefs.getString(Constants.ROUTINE_NAME, defaultRoutine),
            prefs.getString(Constants.BLOCKING_REASON, noReasonProvided),
            prefs.getString(Constants.NEXT_HABIT_NAME, noNextHabit));
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId, String routineName, String blockingReason, String nextHabitName) {
        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        int minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 200);
        boolean isSmall = minHeight < HEIGHT_THRESHOLD;

        int layoutId = isSmall ? R.layout.widget_layout_small : R.layout.widget_layout;
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        SharedPreferences prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        String themeMode = prefs.getString(Constants.THEME_MODE, "dark");
        boolean isDarkTheme = WidgetThemeContext.isDarkTheme(themeMode);
        Context colorContext = WidgetThemeContext.wrap(context, isDarkTheme);

        if (isSmall) {
            // Small: single orange bar
            if (isDarkTheme) {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_background_orange_dark);
            } else {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_background_orange);
            }
            views.setTextColor(R.id.widget_blocking_reason, ContextCompat.getColor(colorContext, R.color.widget_header_text));
            views.setTextViewText(R.id.widget_blocking_reason, blockingReason);
        } else {
            // Large: full layout
            if (isDarkTheme) {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_background_dark);
                views.setInt(R.id.widget_header, "setBackgroundResource", R.drawable.widget_background_orange_dark);
            } else {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_background);
                views.setInt(R.id.widget_header, "setBackgroundResource", R.drawable.widget_background_orange);
            }

            int textColor = ContextCompat.getColor(colorContext, R.color.widget_text);
            views.setTextColor(R.id.widget_blocking_reason, ContextCompat.getColor(colorContext, R.color.widget_header_text));
            views.setTextColor(R.id.widget_next_habit_name, textColor);
            views.setTextViewText(R.id.widget_blocking_reason, blockingReason);

            String fallbackWhatsNext = context.getString(R.string.widget_whats_next);
            String whatsNextPrefix = prefs.getString(Constants.WHATS_NEXT_PREFIX, fallbackWhatsNext);
            if (whatsNextPrefix == null || whatsNextPrefix.trim().isEmpty() || whatsNextPrefix.contains("widget.whatsNext")) {
                whatsNextPrefix = fallbackWhatsNext;
            }
            whatsNextPrefix = whatsNextPrefix.trim();

            String showNextHabitName = nextHabitName == null ? "" : nextHabitName.trim();
            String combinedText = whatsNextPrefix + " " + showNextHabitName;
            SpannableString spanString = new SpannableString(combinedText);
            spanString.setSpan(new StyleSpan(Typeface.BOLD), 0, whatsNextPrefix.length(), Spanned.SPAN_EXCLUSIVE_EXCLUSIVE);
            views.setTextViewText(R.id.widget_next_habit_name, spanString);
        }

        // Deep link
        String deepLink = determineDeepLink(context, blockingReason, nextHabitName);
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(deepLink));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static String determineDeepLink(Context context, String blockingReason, String nextHabitName) {
        SharedPreferences prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        // Primary: explicit target from JS (locale-aware, matches distraction-blocking state)
        String target = prefs.getString(Constants.WIDGET_DEEPLINK_TARGET, null);
        if (target != null) {
            switch (target) {
                case "permissions":
                    return "focusbear://permissions";
                case "focus":
                    return "focusbear://focus";
                case "home":
                default:
                    return "focusbear://home";
            }
        }

        if (blockingReason == null) {
            return "focusbear://home";
        }

        String reasonKey = prefs.getString(Constants.BLOCKING_REASON_KEY, null);

        if (reasonKey != null) {
            if ("permissionNotGranted".equals(reasonKey)) {
                return "focusbear://permissions";
            }

            if ("focusModeActivated".equals(reasonKey)) {
                return "focusbear://focus";
            }
        }

        String noNextHabitLocalized = prefs.getString(Constants.NO_NEXT_HABIT, context.getString(R.string.widget_no_next_habit));
        String nextHabitPlaceholderKey = prefs.getString(Constants.NEXT_HABIT_PLACEHOLDER_KEY, null);
        if (nextHabitName != null && !nextHabitName.equals(noNextHabitLocalized)) {
            if ("start_focus_session".equals(nextHabitPlaceholderKey) || "go_to_sleep".equals(nextHabitPlaceholderKey)) {
                return "focusbear://focus";
            }
            return "focusbear://home";
        }

        return "focusbear://focus";
    }
}
