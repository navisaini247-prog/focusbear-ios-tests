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
import java.util.concurrent.ThreadLocalRandom;
import androidx.core.content.ContextCompat;

public class BlockedMessageWidgetProvider extends AppWidgetProvider {
    private static final int HEIGHT_THRESHOLD = 80;

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

        int layoutId = isSmall ? R.layout.blocked_message_widget_layout_small : R.layout.blocked_message_widget_layout;
        RemoteViews views = new RemoteViews(context.getPackageName(), layoutId);

        SharedPreferences prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
        String themeMode = prefs.getString(Constants.THEME_MODE, "dark");
        boolean isDark = WidgetThemeContext.isDarkTheme(themeMode);
        Context colorContext = WidgetThemeContext.wrap(context, isDark);

        // Apply theme backgrounds
        if (isDark) {
            views.setInt(R.id.blocked_msg_widget_root, "setBackgroundResource", R.drawable.widget_background_dark);
        } else {
            views.setInt(R.id.blocked_msg_widget_root, "setBackgroundResource", R.drawable.widget_background);
        }

        // Apply theme text color
        int textColor = ContextCompat.getColor(colorContext, R.color.widget_text);
        views.setTextColor(R.id.blocked_msg_widget_text, textColor);

        // Read the message pushed by JS (custom or randomly-picked localized quote).
        // If JS has never populated the widget yet, choose a random native fallback quote instead.
        String storedMessage = prefs.getString(Constants.CUSTOM_BLOCKED_MESSAGE, "");
        String displayMessage = (storedMessage != null && !storedMessage.isEmpty())
            ? storedMessage
            : getRandomFallbackMessage(context);

        views.setTextViewText(R.id.blocked_msg_widget_text, displayMessage);

        // Deep link to custom blocked message settings
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("focusbear://settings/custom-blocked-message"));
        intent.setPackage(context.getPackageName());
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, appWidgetId, intent, flags);
        views.setOnClickPendingIntent(R.id.blocked_msg_widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static String getRandomFallbackMessage(Context context) {
        String[] fallbackQuotes = context.getResources().getStringArray(R.array.default_blocked_message_quotes);
        if (fallbackQuotes.length == 0) {
            return context.getString(R.string.default_blocked_message);
        }
        int randomIndex = ThreadLocalRandom.current().nextInt(fallbackQuotes.length);
        return fallbackQuotes[randomIndex];
    }
}
