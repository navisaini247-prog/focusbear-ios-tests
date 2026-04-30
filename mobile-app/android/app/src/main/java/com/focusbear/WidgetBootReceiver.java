package com.focusbear;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

/**
 * Refreshes all Focus Bear widgets after the device reboots.
 * Without this, widgets would display stale data until the app is opened.
 */
public class WidgetBootReceiver extends BroadcastReceiver {

    /**
     * Matches the static refresh entry point on each widget provider
     * (e.g. {@link FocusWidgetProvider#refreshAndUpdate} or {@link StreakWidgetProvider#updateAppWidget}).
     */
    @FunctionalInterface
    private interface WidgetRefreshAction {
        void refresh(Context context, AppWidgetManager appWidgetManager, int appWidgetId);
    }

    private static void refreshAllWidgetsOfProvider(
            Context context,
            AppWidgetManager appWidgetManager,
            Class<? extends AppWidgetProvider> providerClass,
            WidgetRefreshAction action) {
        int[] ids = appWidgetManager.getAppWidgetIds(new ComponentName(context, providerClass));
        for (int id : ids) {
            action.refresh(context, appWidgetManager, id);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            return;
        }

        Log.d("WidgetBootReceiver", "Boot completed — refreshing all widgets");

        try {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

            refreshAllWidgetsOfProvider(
                    context, appWidgetManager, FocusWidgetProvider.class, FocusWidgetProvider::refreshAndUpdate);
            refreshAllWidgetsOfProvider(
                    context, appWidgetManager, StreakWidgetProvider.class, StreakWidgetProvider::updateAppWidget);
            refreshAllWidgetsOfProvider(
                    context,
                    appWidgetManager,
                    BlockedMessageWidgetProvider.class,
                    BlockedMessageWidgetProvider::updateAppWidget);

            Log.d("WidgetBootReceiver", "All widgets refreshed after boot");
        } catch (Exception e) {
            Log.e("WidgetBootReceiver", "Error refreshing widgets after boot", e);
        }
    }
}
