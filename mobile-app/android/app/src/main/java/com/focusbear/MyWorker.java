package com.focusbear;

import static android.content.Context.WINDOW_SERVICE;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.ReactApplication;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.Set;

/*
 Created by "Jayant Sharma" on 21/06/22.
*/
public class MyWorker extends Worker {
   private Context mContext=null;
   private ReactApplicationContext reactApplicationContext;

   public MyWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
      super(context, workerParams);
      mContext=context;
   }
   @RequiresApi(api = Build.VERSION_CODES.P)
   @NonNull
   @Override
   public Result doWork() {
      Log.d("WORKER_TAG","Task completed successfully called");


      // create an instance of Window class and display the content on screen along with foreground service

      SharedPreferences shared_preference = mContext.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
       String routine_name = shared_preference.getString(Constants.ROUTINE_NAME, "");//"No name defined" is the default value.
       String activity_name = shared_preference.getString(Constants.ACTIVITY_NAME, "");//"No name defined" is the default value.
     
      Set<String> allowed_apps = shared_preference.getStringSet(Constants.ALLOWED_APPS, null);

      OverlayControl.getInstance(mContext).addListener(routine_name,activity_name, allowed_apps);
      try {
         WritableMap params = Arguments.createMap();
         params.putBoolean("SERVICE_STARTED", true);
         String jsonString = new org.json.JSONObject(params.toHashMap()).toString();
         
         OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
         if (overlayModule != null) {
            overlayModule.sendOverlayEventToJS(jsonString);
         } else {
            Log.w("MyWorker", "No registered OverlayModule instance available, skipping event emission");
         }
      } catch (Exception e) {
         Log.e("MyWorker", "Exception in sendOverlayEventToJS", e);
         e.printStackTrace();
      }
      shared_preference.edit().clear().apply(); // commit changes

      return Result.success();
   }
}