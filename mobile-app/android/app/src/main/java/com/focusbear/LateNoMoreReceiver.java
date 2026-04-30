package com.focusbear;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

public class LateNoMoreReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        try {
            String notificationId = intent.getStringExtra("notificationId");
            String meetingName = intent.getStringExtra("meetingName");
            int stage = intent.getIntExtra("stage", 1);

            Log.d("LateNoMoreReceiver", "Received alarm for notification: " + notificationId + ", stage: " + stage);

            // For now, just log the event. The React Native side will handle the actual
            // notification
            // when the app is opened or when the user interacts with the system
            // notification.
            Log.d("LateNoMoreReceiver", "Meeting: " + meetingName + ", Stage: " + stage);

        } catch (Exception e) {
            Log.e("LateNoMoreReceiver", "Error handling alarm", e);
        }
    }
}