package com.focusbear.blocking

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.TimeUnit

internal class BlockingScheduleAlarmScheduler(
    private val context: Context
) {

    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    fun ensureAlarmsFor(schedules: List<BlockingSchedule>) {
        val now = ZonedDateTime.now(ZoneId.systemDefault())
        schedules.forEach { schedule ->
            cancel(schedule.id, TriggerType.START)
            cancel(schedule.id, TriggerType.END)

            schedule.nextWindowAfter(now)?.let { (start, end) ->
                scheduleTrigger(schedule.id, TriggerType.START, start)
                scheduleTrigger(schedule.id, TriggerType.END, end)
            } ?: Log.d(TAG, "No upcoming window for ${schedule.id}")
        }
    }

    fun cancel(scheduleId: String) {
        cancel(scheduleId, TriggerType.START)
        cancel(scheduleId, TriggerType.END)
    }

    fun cancelAll(schedules: List<BlockingSchedule>) {
        schedules.forEach { cancel(it.id) }
    }

    fun scheduleResume(resumeAt: Long) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            !alarmManager.canScheduleExactAlarms()
        ) {
            Log.w(TAG, "Exact alarm permission missing, skipping resume schedule")
            return
        }

        val intent = Intent(context, BlockingScheduleReceiver::class.java).apply {
            action = BlockingScheduleReceiver.ACTION_RESUME_BLOCKING
        }
        val requestCode = "resume_blocking".hashCode().and(Int.MAX_VALUE)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val now = System.currentTimeMillis()
        val adjusted = resumeAt.coerceAtLeast(now + TimeUnit.SECONDS.toMillis(1))

        Log.d(TAG, "Scheduling resume at $adjusted")
        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            adjusted,
            pendingIntent
        )
    }

    fun cancelResume() {
        val intent = Intent(context, BlockingScheduleReceiver::class.java).apply {
            action = BlockingScheduleReceiver.ACTION_RESUME_BLOCKING
        }
        val requestCode = "resume_blocking".hashCode().and(Int.MAX_VALUE)
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pendingIntent)
        Log.d(TAG, "Cancelled resume alarm")
    }

    private fun scheduleTrigger(id: String, type: TriggerType, time: ZonedDateTime) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
            !alarmManager.canScheduleExactAlarms()
        ) {
            Log.w(TAG, "Exact alarm permission missing, skipping schedule $id")
            return
        }

        val now = System.currentTimeMillis()
        val triggerAt = time.toInstant().toEpochMilli()
        val adjusted = triggerAt.coerceAtLeast(now + TimeUnit.SECONDS.toMillis(1))
        val intent = pendingIntent(id, type)

        Log.d(TAG, "Scheduling $type for $id at $adjusted")

        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            adjusted,
            intent
        )
    }

    private fun cancel(id: String, type: TriggerType) {
        alarmManager.cancel(pendingIntent(id, type))
    }

    private fun pendingIntent(id: String, type: TriggerType): PendingIntent {
        val intent = Intent(context, BlockingScheduleReceiver::class.java).apply {
            action = BlockingScheduleReceiver.ACTION_SCHEDULE_TRIGGER
            putExtra(BlockingScheduleReceiver.EXTRA_SCHEDULE_ID, id)
            putExtra(BlockingScheduleReceiver.EXTRA_TRIGGER_TYPE, type.raw)
        }
        val requestCode = (id.hashCode() * 31 + type.raw.hashCode()).and(Int.MAX_VALUE)
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    enum class TriggerType(val raw: String) {
        START("start"),
        END("end");

        companion object {
            fun from(raw: String?): TriggerType? = values().firstOrNull { it.raw == raw }
        }
    }

    companion object {
        private const val TAG = "BlockingScheduleAlarm"
    }
}

