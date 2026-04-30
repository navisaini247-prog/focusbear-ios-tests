package com.focusbear;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import androidx.work.WorkRequest;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Calendar;
import java.util.concurrent.TimeUnit;

public class ScheduleTasksModule extends ReactContextBaseJavaModule {
    private static ReactApplicationContext reactContext;

    public ScheduleTasksModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;
    }
    @NonNull
    @Override
    public String getName() {
        return "ScheduleTasksModule";
    }

    @ReactMethod
    public void scheduleTask(String initialDelayinMinutes ){

        WorkRequest mywork =
                new OneTimeWorkRequest.Builder(MyWorker.class).setInitialDelay(Long.parseLong(initialDelayinMinutes), TimeUnit.MINUTES)
                        .build();
        WorkManager.getInstance(reactContext).enqueue(mywork);
        Log.d("WORKER_TAG","task scheduled successfully for "+ initialDelayinMinutes + "mins");
    }
}
