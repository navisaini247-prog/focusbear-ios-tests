package com.focusbear;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Calendar;
import java.util.Date;

public class AlarmModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;
    private AlarmManager alarmManager;
    private PendingIntent alarmIntent;

    public AlarmModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }
    @NonNull
    @Override
    public String getName() {
        return "AlarmModule";
    }

    /**
     * Wakeup app with alarm at any schedule time.
     * @param promise
     */
    @ReactMethod
    public void scheduleWakeUp(Promise promise){
        alarmManager = (AlarmManager) reactContext.getSystemService(reactContext.ALARM_SERVICE);

        // Set the alarm to start at approximately 2:00 p.m.
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        // Here HOUR_OF_DAY represent 24 hr format,
        // 14 is time in 24 hrs format which is 2:00 pm
        calendar.set(Calendar.HOUR_OF_DAY, 14);
        calendar.set(Calendar.MINUTE, 10);

        Intent intent = new Intent(reactContext, AlarmReceiver.class);
        alarmIntent = PendingIntent.getBroadcast(reactContext, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
        alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), AlarmManager.INTERVAL_DAY, alarmIntent);
    }

    /**
     * Cancel alarm with this method
     */
    @ReactMethod
    public void cancelAlarm() {
        // If the alarm has been set, cancel it.
        if (alarmManager!= null) {
            alarmManager.cancel(alarmIntent);
        }
    }

    /**
     * Boot receiver to activate alarm again once phone is rebooted.
     * @param promise
     */
    @ReactMethod
    public void enableBootReceiver(Promise promise) {
        ComponentName receiver = new ComponentName(reactContext, BootReceiver.class);
        PackageManager pm = reactContext.getPackageManager();

        pm.setComponentEnabledSetting(receiver,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
                PackageManager.DONT_KILL_APP);
    }

    /**
     * Disable boot receiver for phone.
     */
    @ReactMethod
    public void disableBootReceiver() {
        ComponentName receiver = new ComponentName(reactContext, BootReceiver.class);
        PackageManager pm = reactContext.getPackageManager();

        pm.setComponentEnabledSetting(receiver,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP);
    }


}
