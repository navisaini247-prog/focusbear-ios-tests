package com.focusbear;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.RequiresApi;
import androidx.core.app.NotificationCompat;
import android.text.TextUtils;
import com.focusbear.R;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

/*
 Created by "Jayant Sharma" on 22/06/22.
*/
public class ForegroundService extends Service {
   private static final String CHANNEL_ID = "LateNoMoreChannel";
   private Handler handler = new Handler(Looper.getMainLooper());
   private Runnable runnableCode;
   private static final int INTERVAL = 5 * 60 * 1000; // 5 minutes
   private static ForegroundService instance;

   public ForegroundService() {
   }

   public static void startService(Context context) {
      Intent serviceIntent = new Intent(context, ForegroundService.class);
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
         context.startForegroundService(serviceIntent);
      } else {
         context.startService(serviceIntent);
      }
   }

   public static void stopService(Context context) {
      Intent serviceIntent = new Intent(context, ForegroundService.class);
      context.stopService(serviceIntent);
   }

   @Override
   public IBinder onBind(Intent intent) {
      throw new UnsupportedOperationException("Not yet implemented");
   }

   @Override
   public void onCreate() {
      super.onCreate();
      instance = this;
      Log.e("WORKER_TAG","Foreground service started");


      // create the custom or default notification
      // based on the android version
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
         startMyOwnForeground();
      else
         startForeground(1, new Notification());

      // create an instance of Window class
      // and display the content on screen
      // Window.getInstance(this).open();

      runnableCode = new Runnable() {
         @Override
         public void run() {
            Intent serviceIntent = new Intent(getApplicationContext(), LateNoMoreTaskService.class);
            getApplicationContext().startService(serviceIntent);
            HeadlessJsTaskService.acquireWakeLockNow(getApplicationContext());
            handler.postDelayed(this, INTERVAL);
         }
      };
      handler.post(runnableCode);
   }

   @Override
   public int onStartCommand(Intent intent, int flags, int startId) {
      return START_STICKY; // This ensures the service stays running even if it's killed by the system
   }

   @Override
   public void onDestroy() {
      super.onDestroy();
      handler.removeCallbacks(runnableCode);
   }

   // for android version >=O we need to create
   // custom notification stating
   // foreground service is running
   @RequiresApi(Build.VERSION_CODES.O)
   private void startMyOwnForeground() {
      String NOTIFICATION_CHANNEL_ID = "example.permanence";
      String channelName = "Background Service";
      NotificationChannel chan = new NotificationChannel(NOTIFICATION_CHANNEL_ID, channelName,
            NotificationManager.IMPORTANCE_MIN);

      NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
      assert manager != null;
      manager.createNotificationChannel(chan);

      Notification notification = buildForegroundNotification(NOTIFICATION_CHANNEL_ID);
      startForeground(2, notification);
   }

   private Notification buildForegroundNotification(String channelId) {
      SharedPreferences sharedPreferences = getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
      Set<String> globalBlocked = sharedPreferences.getStringSet(Constants.BLOCKED_APPS_DATA, new HashSet<>());

      // Merge global blocked apps with schedule-specific blocked apps so the notification
      // reflects everything currently being blocked.
      Set<String> effectiveBlocked = new HashSet<>(globalBlocked);
      try {
         com.focusbear.blocking.BlockingScheduleManager manager =
             com.focusbear.blocking.BlockingScheduleManager.Companion.obtain(this);
         manager.ensureInitialized();
         java.util.Set<String> scheduleBlocked = manager.getAllActiveBlockedPackages();
         if (scheduleBlocked != null) {
            effectiveBlocked.addAll(scheduleBlocked);
         }
      } catch (Exception e) {
         Log.e("ForegroundService", "Failed to merge schedule blocked apps for notification", e);
      }

      List<String> blockedAppNames = resolveBlockedAppNames(effectiveBlocked);

      String contentTitle = buildNotificationTitle(blockedAppNames);
      String contentText = buildNotificationBody(blockedAppNames);

      NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, channelId);
      return notificationBuilder
              .setContentTitle(contentTitle)
              .setContentText(contentText)
              .setStyle(new NotificationCompat.BigTextStyle().bigText(contentText))
              // this is important, otherwise the notification will show the way
              // you want i.e. it will show some default notification
              .setSmallIcon(R.mipmap.ic_launcher_round)
              .setPriority(NotificationManager.IMPORTANCE_MIN)
              .setCategory(Notification.CATEGORY_SERVICE)
              .build();
   }

   // Called when the blocked apps set changes to refresh the foreground notification contents.
   public static void refreshNotificationIfRunning() {
      if (instance == null) {
         return;
      }
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
         // On pre-O, the notification is minimal and managed by startForeground(1, new Notification()).
         return;
      }
      String NOTIFICATION_CHANNEL_ID = "example.permanence";
      Notification notification = instance.buildForegroundNotification(NOTIFICATION_CHANNEL_ID);
      NotificationManager manager = (NotificationManager) instance.getSystemService(Context.NOTIFICATION_SERVICE);
      if (manager != null) {
         manager.notify(2, notification);
      }
   }

   private List<String> resolveBlockedAppNames(Set<String> blockedPackages) {
      if (blockedPackages == null || blockedPackages.isEmpty()) {
         return Collections.emptyList();
      }

      PackageManager packageManager = getPackageManager();
      List<String> appNames = new ArrayList<>();

      for (String packageName : blockedPackages) {
         if (TextUtils.isEmpty(packageName)) {
            continue;
         }
         try {
            ApplicationInfo info = packageManager.getApplicationInfo(packageName, 0);
            CharSequence label = packageManager.getApplicationLabel(info);
            if (label != null) {
               appNames.add(label.toString());
            } else {
               appNames.add(packageName);
            }
         } catch (PackageManager.NameNotFoundException e) {
            appNames.add(packageName);
         }
      }

      Collections.sort(appNames);
      return appNames;
   }

   private String buildNotificationTitle(List<String> blockedAppNames) {
      int count = blockedAppNames.size();
      if (count == 0) {
         return "Blocking distractions";
      }
      return String.format(Locale.getDefault(), "Blocking %d app%s", count, count == 1 ? "" : "s");
   }

   private String buildNotificationBody(List<String> blockedAppNames) {
      if (blockedAppNames.isEmpty()) {
         return "Focus Bear is actively blocking distractions.";
      }

      int displayCount = Math.min(3, blockedAppNames.size());
      List<String> displayNames = blockedAppNames.subList(0, displayCount);
      String body = TextUtils.join(", ", displayNames);

      int remaining = blockedAppNames.size() - displayCount;
      if (remaining > 0) {
         body += " +" + remaining + " more";
      }
      return body;
   }
}
