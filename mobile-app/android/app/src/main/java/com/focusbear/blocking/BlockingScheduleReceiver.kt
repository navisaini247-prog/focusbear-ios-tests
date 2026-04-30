package com.focusbear.blocking

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class BlockingScheduleReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val manager = BlockingScheduleManager.obtain(context)
        manager.initializeIfNeeded()

        when (intent.action) {
            ACTION_SCHEDULE_TRIGGER -> {
                val id = intent.getStringExtra(EXTRA_SCHEDULE_ID)
                val typeRaw = intent.getStringExtra(EXTRA_TRIGGER_TYPE)
                val type = BlockingScheduleAlarmScheduler.TriggerType.from(typeRaw)
                if (id.isNullOrBlank() || type == null) {
                    Log.i(TAG, "Schedule trigger missing data id=$id type=$typeRaw")
                    return
                }
                Log.i(
                    TAG,
                    "Schedule trigger received id=$id type=$typeRaw timestamp=${System.currentTimeMillis()}"
                )
                manager.onTrigger(id, type)
            }

            ACTION_RESUME_BLOCKING -> {
                Log.i(TAG, "Resume blocking received, resuming schedules")
                manager.resumePausedSchedulesIfExpired()
            }

            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_CHANGED,
            Intent.ACTION_TIMEZONE_CHANGED -> {
                Log.d(TAG, "System event ${intent.action} received, refreshing schedules")
                manager.refreshScheduling()
            }
        }
    }

    companion object {
        const val ACTION_SCHEDULE_TRIGGER = "com.focusbear.action.BLOCKING_SCHEDULE_TRIGGER"
        const val ACTION_RESUME_BLOCKING = "com.focusbear.action.RESUME_BLOCKING"
        const val EXTRA_SCHEDULE_ID = "extra_schedule_id"
        const val EXTRA_TRIGGER_TYPE = "extra_trigger_type"
        private const val TAG = "BlockingScheduleRecv"
    }
}

