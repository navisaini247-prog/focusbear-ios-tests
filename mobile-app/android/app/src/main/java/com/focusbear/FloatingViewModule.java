package com.focusbear;

import android.content.Context;
import android.content.res.Resources;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.CountDownTimer;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

public class FloatingViewModule extends ReactContextBaseJavaModule {

    private static ReactApplicationContext reactContext;

    public FloatingViewModule(ReactApplicationContext context) {
        super(context);
        reactContext = context;

    }

    @NonNull
    @Override
    public String getName() {
        return "FloatingViewModule";
    }

    /**
     * React Method to show Floating Widget.
     */
    @RequiresApi(api = Build.VERSION_CODES.P)
    @ReactMethod
    public void runFloatingView(boolean isStarted, int time, String activityName, String completionRequirements, boolean isTimerPaused) {
        OverlayControl.getInstance(reactContext).saveActivityAndTimer(isStarted, time, activityName, completionRequirements, isTimerPaused);
    }

    /**
     * React Method to Remove Floating Widget.
     */
    @ReactMethod
    public void stopFloatingView(){
        OverlayControl.getInstance(reactContext).removeFloatingView();
    }

}
