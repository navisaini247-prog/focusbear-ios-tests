package com.focusbear;

import static android.content.Context.WINDOW_SERVICE;

import static com.focusbear.LocaleStrings.*;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.PixelFormat;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.RequiresApi;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import java.util.Random;
import com.facebook.react.ReactApplication;

/*
 Created by "Jayant Sharma" on 22/06/22.
*/
public class Window {

   // declaring required variables
   private Context context;
   private View mView;
   private WindowManager.LayoutParams mParams;
   private WindowManager mWindowManager;
   private LayoutInflater layoutInflater;
   private LocaleStrings localeStrings;
   public static Window window = null;

   private Window(){

   }

   public static Window getInstance(Context context){
      if (window == null) {
         window = new Window(context);
      }
      return window;
   }

   private Window(Context context){
      this.context = context;
      localeStrings = new LocaleStrings();

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
         // set the layout parameters of the window
         mParams = new WindowManager.LayoutParams(
                 // Shrink the window to wrap the content rather
                 
                 // than filling the screen
                 WindowManager.LayoutParams.MATCH_PARENT, WindowManager.LayoutParams.MATCH_PARENT,
                 // 100, 100,
                 // Display it on top of other application windows
                 WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                 // Don't let it grab the input focus
                 WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                 // Make the underlying application window visible
                 // through any transparent parts
                 PixelFormat.TRANSLUCENT);

      }
      // getting a LayoutInflater
       layoutInflater  = (LayoutInflater) context.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
      // inflating the view with the custom layout we created, selecting layout according to language
      if (localeStrings.getCurrentLocale().getLanguage().equals("es")) {
         mView = layoutInflater.inflate(R.layout.overlayview_es, null);
      }else{
         mView = layoutInflater.inflate(R.layout.overlayview, null);
      }
       
      // set onClickListener on the remove button, which removes
      // the view from the window
      mView.findViewById(R.id.window_close_alert).setOnClickListener(new View.OnClickListener() {
         @Override
         public void onClick(View view) {
            try {
               WritableMap params = Arguments.createMap();
               params.putBoolean("OPEN_APP", true);
               String jsonString = new org.json.JSONObject(params.toHashMap()).toString();
               
               OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
               if (overlayModule != null) {
                  overlayModule.sendOverlayEventToJS(jsonString);
               } else {
                  Log.w("Window", "No registered OverlayModule instance available, skipping event emission");
               }
            } catch (Exception e) {
               Log.e("Window", "Exception in sendOverlayEventToJS", e);
               e.printStackTrace();
            }
            openApp(context.getPackageName());
            close();
         }
      });

      mView.findViewById(R.id.window_close_btn).setOnClickListener(new View.OnClickListener() {
         @Override
         public void onClick(View v) {
           close();
         }
      });

      mView.findViewById(R.id.window_postpone_btn).setOnClickListener(new View.OnClickListener() {
         @Override
         public void onClick(View v) {
            try {
               WritableMap params = Arguments.createMap();
               params.putBoolean("POSTPONE_FLOW_FROM_DISTRACTION_ALERT_BOOL", true);
               String jsonString = new org.json.JSONObject(params.toHashMap()).toString();
               
               OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
               if (overlayModule != null) {
                  overlayModule.sendOverlayEventToJS(jsonString);
               } else {
                  Log.w("Window", "No registered OverlayModule instance available, skipping event emission");
               }
            } catch (Exception e) {
               Log.e("Window", "Exception in sendOverlayEventToJS", e);
               e.printStackTrace();
            }
            openApp(context.getPackageName());
            close();
         }
      });


      // Define the position of the
      // window within the screen
      mParams.gravity = Gravity.CENTER;
      mWindowManager = (WindowManager)context.getSystemService(WINDOW_SERVICE);

   }

   public void open(String routine_name, String activity_name, Drawable blockedAppIcon, String blockedAppName, Boolean isFocusModeEnabled, Boolean isSuperStrictMode, String reason) { 
      Handler handler = new Handler(Looper.getMainLooper());
      handler.postDelayed(new Runnable() {
         @RequiresApi(api = Build.VERSION_CODES.P)
         @Override
         public void run() {
            try {
               Log.d("WindowFocusBearrr", "open() called with: routine_name=" + routine_name + ", activity_name=" + activity_name + ", blockedAppName=" + blockedAppName + ", isFocusModeEnabled=" + isFocusModeEnabled + ", isSuperStrictMode=" + isSuperStrictMode + ", reason=" + reason);

               // Check if mView is initialized
               if (mView != null && mView.getWindowToken() == null) {
                  if (mView.getParent() == null) {

                     // Blocked app Description TextView
                     TextView blockAppDesc = mView.findViewById(R.id.block_app_desc);

                     // Focus On activity TextView
                     TextView focusOn = mView.findViewById(R.id.window_close);

                     // Back to routine button
                     Button closeBtn = mView.findViewById(R.id.window_close_alert);

                     // Postpone button
                     Button postPoneBtn = mView.findViewById(R.id.window_postpone_btn);

                     String[] placeholderValPairs = new String[]{
                             "{appName}:" + blockedAppName
                     };

                           // Randomizing the "Blocked" message based on the locale (English/Spanish)
                     String[] messages = {
                        localeStrings.getStaticString("blockedMessage1"),
                        localeStrings.getStaticString("blockedMessage2"),
                        localeStrings.getStaticString("blockedMessage3")
                     };
                  
                     Random random = new Random();
                     String randomizedMessage = messages[random.nextInt(messages.length)];
                  
                     // Setting the randomized message to the TextView
                     TextView blockedMessageTextView = mView.findViewById(R.id.titleText);
                     blockedMessageTextView.setText(randomizedMessage);

                     if (isFocusModeEnabled) {
                        // Blocked App Description TextView
                        placeholderValPairs = new String[]{
                                "{appName}:" + blockedAppName};
                        String blockedMsg = localeStrings.getDynamicString("appIsBlockedInFocusMode", placeholderValPairs);

                        // Get motivational message (custom or random)
                        String motivationalMessage = getMotivationalMessage();
                        
                        // Combine the blocked message with the motivational message
                        blockAppDesc.setText(blockedMsg + "\n\n" + motivationalMessage);

                        
                        // Hides FocusOn Activity TextView
                        focusOn.setVisibility(View.GONE);
                        
                        // Hides Pause Blocking Button, when user enables Strict Mode
                        if (isSuperStrictMode != null && isSuperStrictMode) {
                           postPoneBtn.setVisibility(View.GONE);
                        }
                        
                        // Back to FocusMode TextView
                        closeBtn.setText(localeStrings.getStaticString("backToFocusMode"));
                     } else if (reason != null && !reason.isEmpty()) {
                        // Blocked App Description TextView
                        blockAppDesc.setText(reason);

                        // Focus on Activity TextView
                        focusOn.setVisibility(View.GONE);

                        // Back to routine Button
                        closeBtn.setText(localeStrings.getStaticString("backToFocusMode"));
                     } else {
                        // Blocked App Description TextView
                        blockAppDesc.setText(localeStrings.getDynamicString("appIsBlocked", placeholderValPairs));

                        // Focus on Activity TextView - Show motivational quote (custom or random)
                        String motivationalMessage = getMotivationalMessage();
                        focusOn.setVisibility(View.VISIBLE);
                        focusOn.setText(motivationalMessage);

                        // Back to routine Button
                        closeBtn.setText(localeStrings.getStaticString("backToFocusMode"));
                     }

                     // Set Restricted App icon
                     ImageView blockedAppImageView = mView.findViewById(R.id.blocked_app_icon);
                     blockedAppImageView.setImageDrawable(blockedAppIcon);
                     mWindowManager.addView(mView, mParams);

                     try {
                        WritableMap params = Arguments.createMap();
                        params.putBoolean("IS_DISTRACTION_ALERT_OPEN", true);
                        String jsonString = new org.json.JSONObject(params.toHashMap()).toString();
                        
                        OverlayModule overlayModule = OverlayModule.getRegisteredInstance();
                        if (overlayModule != null) {
                           overlayModule.sendOverlayEventToJS(jsonString);
                        } else {
                           Log.w("Window", "No registered OverlayModule instance available, skipping event emission");
                        }
                     } catch (Exception e) {
                        Log.e("Window", "Exception in sendOverlayEventToJS", e);
                        e.printStackTrace();
                     }
                  }
               }
            } catch (Exception e) {
               Log.d("Window open", "Error opening blocking window", e);
            }
         }
      }, 1000);
   }


   public void close() {
      try {
         if (context != null) {
            WindowManager windowManager = (WindowManager) context.getSystemService(WINDOW_SERVICE);
            if (windowManager != null && mView != null) {
               windowManager.removeView(mView);
               mView.invalidate();
               ((ViewGroup)mView.getParent()).removeAllViews();
            }
         }
      } catch (Exception e) {
         Log.d("Window close", "Error closing window", e);
      }
   }


   public void openApp(String packageId) {
      PackageManager packageManager = context.getPackageManager();
      try {
         Intent launchIntent = packageManager.getLaunchIntentForPackage(packageId);
         context.startActivity(launchIntent);
      } catch (Exception e) {
         Log.e("openApp", "package not found", e);
      }
   }

   /**
    * Gets the custom blocked message from SharedPreferences, or returns a random motivational message if not set.
    */
   private String getMotivationalMessage() {
      SharedPreferences sharedPreference = context.getSharedPreferences(Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE);
      String customMessage = sharedPreference.getString(Constants.CUSTOM_BLOCKED_MESSAGE, "");
      
      if (customMessage != null && !customMessage.isEmpty()) {
         return customMessage;
      }
      
      // Fall back to random motivational message
      String[] motivationalMessages = {
         localeStrings.getStaticString("motivationalMessage1"),
         localeStrings.getStaticString("motivationalMessage2"),
         localeStrings.getStaticString("motivationalMessage3"),
         localeStrings.getStaticString("motivationalMessage4"),
         localeStrings.getStaticString("motivationalMessage5")
      };
      return motivationalMessages[new Random().nextInt(motivationalMessages.length)];
   }

   public void openDeepLinkOverlay(String deepLinkUrl) {
      Handler handler = new Handler(Looper.getMainLooper());
      handler.postDelayed(new Runnable() {
         @RequiresApi(api = Build.VERSION_CODES.P)
         @Override
         public void run() {
            try {
               Log.d("WindowFocusBear", "openDeepLinkOverlay() called with: deepLinkUrl=" + deepLinkUrl);

               // Create a minimal view for deep linking
               View deepLinkView = new View(context);
               deepLinkView.setAlpha(0.0f); // Make it invisible
               
               // Set up window parameters for a minimal overlay
               WindowManager.LayoutParams deepLinkParams = new WindowManager.LayoutParams(
                   1, 1, // Minimal size
                   WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                   WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                   PixelFormat.TRANSLUCENT
               );
               
               // Position it at the top-left corner
               deepLinkParams.gravity = Gravity.TOP | Gravity.START;
               
               // Add the view to window manager
               mWindowManager.addView(deepLinkView, deepLinkParams);
               
               // Open the deep link
               Intent intent = new Intent(Intent.ACTION_VIEW);
               intent.setData(android.net.Uri.parse(deepLinkUrl));
               intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
               context.startActivity(intent);
               
               // Remove the view after a short delay
               new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                  @Override
                  public void run() {
                     try {
                        mWindowManager.removeView(deepLinkView);
                     } catch (Exception e) {
                        Log.d("DeepLinkOverlay", "Error removing view", e);
                     }
                  }
               }, 5000); // Remove after 100ms
               
            } catch (Exception e) {
               Log.d("DeepLinkOverlay", "Error opening deep link overlay", e);
            }
         }
      }, 100);
   }
}
