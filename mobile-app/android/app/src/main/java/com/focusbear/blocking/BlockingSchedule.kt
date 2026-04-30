package com.focusbear.blocking

import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime

internal data class BlockingSchedule(
    val id: String,
    val name: String,
    val startHour: Int,
    val startMinute: Int,
    val endHour: Int,
    val endMinute: Int,
    val daysOfWeek: List<String>,
    val blockingMode: String = "gentle",
    val blockedPackages: List<String> = DEFAULT_BLOCKED_PACKAGES,
    val blockedUrls: List<String> = emptyList(),
    val type: String = "custom", // "habit" | "custom"
    val focusModeId: String? = null,
    val isAiBlockingEnabled: Boolean = false,
    val pauseFriction: String = "none",
) {

    val startTotalMinutes: Int = startHour * 60 + startMinute
    val endTotalMinutes: Int = endHour * 60 + endMinute
    val spansMidnight: Boolean = endTotalMinutes <= startTotalMinutes

    fun contains(time: ZonedDateTime): Boolean {
        val totalMinutes = time.hour * 60 + time.minute
        val currentDay = dayCode(time.dayOfWeek.value)
        val previousDay = dayCode(time.minusDays(1).dayOfWeek.value)
        val allowedDays = daysOfWeek.takeUnless { it.isEmpty() || it.contains("ALL") }?.toSet()

        return if (spansMidnight) {
            val onStartDay = allowedDays == null || allowedDays.contains(currentDay)
            val onEndDay = allowedDays == null || allowedDays.contains(previousDay)
            val inFirstSegment = onStartDay && totalMinutes >= startTotalMinutes
            val inSecondSegment = onEndDay && totalMinutes < endTotalMinutes
            inFirstSegment || inSecondSegment
        } else {
            val allowedToday = allowedDays == null || allowedDays.contains(currentDay)
            allowedToday && totalMinutes in startTotalMinutes until endTotalMinutes
        }
    }

    fun nextWindowAfter(time: ZonedDateTime, zone: ZoneId = time.zone): Pair<ZonedDateTime, ZonedDateTime>? {
        val searchRange = if (spansMidnight) 8 else 7
        for (offset in 0..searchRange) {
            val targetDate = time.toLocalDate().plusDays(offset.toLong())
            if (!isDayAllowed(targetDate)) continue

            val start = targetDate.atTime(LocalTime.of(startHour, startMinute)).atZone(zone)
            val endDate = if (spansMidnight) targetDate.plusDays(1) else targetDate
            val end = endDate.atTime(LocalTime.of(endHour, endMinute)).atZone(zone)

            if (end.isBefore(time)) continue
            return start to end
        }
        Log.w(TAG, "Unable to compute next window for schedule=$id after $time")
        return null
    }

    private fun isDayAllowed(date: LocalDate): Boolean {
        if (daysOfWeek.isEmpty() || daysOfWeek.contains("ALL")) return true
        return daysOfWeek.contains(dayCode(date.dayOfWeek.value))
    }

    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("name", name)
        put("startHour", startHour)
        put("startMinute", startMinute)
        put("endHour", endHour)
        put("endMinute", endMinute)
        put("daysOfWeek", JSONArray(daysOfWeek))
        put("blockingMode", blockingMode)
        put("blockedPackages", JSONArray(blockedPackages))
        put("blockedUrls", JSONArray(blockedUrls))
        put("type", type)
        if (focusModeId != null) {
            put("focusModeId", focusModeId)
        }
        put("isAiBlockingEnabled", isAiBlockingEnabled)
        put("pauseFriction", pauseFriction)
    }

    companion object {
        private const val TAG = "BlockingSchedule"
        private fun dayCode(value: Int): String = when (value) {
            1 -> "MON"
            2 -> "TUE"
            3 -> "WED"
            4 -> "THU"
            5 -> "FRI"
            6 -> "SAT"
            else -> "SUN"
        }

        val DEFAULT_BLOCKED_PACKAGES = emptyList<String>()

        fun fromJson(json: JSONObject): BlockingSchedule? = try {
            val scheduleId = json.getString("id")
            // If type is not specified, infer from ID: habit_* IDs are habit schedules
            val inferredType = if (scheduleId.startsWith("habit_")) "habit" else "custom"
            val scheduleType = json.optString("type", inferredType)
            
            BlockingSchedule(
                id = scheduleId,
                name = json.optString("name", "Schedule"),
                startHour = json.optInt("startHour"),
                startMinute = json.optInt("startMinute"),
                endHour = json.optInt("endHour"),
                endMinute = json.optInt("endMinute"),
                daysOfWeek = json.optJSONArray("daysOfWeek")?.let { array ->
                    buildList {
                        for (i in 0 until array.length()) {
                            val value = array.optString(i)
                            if (!value.isNullOrBlank()) add(value)
                        }
                    }
                } ?: emptyList(),
                blockingMode = json.optString("blockingMode", "gentle"),
                blockedPackages = json.optJSONArray("blockedPackages")?.let { array ->
                    buildList {
                        for (i in 0 until array.length()) {
                            val value = array.optString(i)
                            if (!value.isNullOrBlank()) add(value)
                        }
                    }
                }?.takeIf { it.isNotEmpty() } ?: DEFAULT_BLOCKED_PACKAGES,
                blockedUrls = json.optJSONArray("blockedUrls")?.let { array ->
                    buildList {
                        for (i in 0 until array.length()) {
                            val value = array.optString(i)
                            if (!value.isNullOrBlank()) add(value)
                        }
                    }
                } ?: emptyList(),
                type = scheduleType,
                focusModeId = json.optString("focusModeId").takeIf { !it.isNullOrBlank() },
                isAiBlockingEnabled = json.optBoolean("isAiBlockingEnabled", false),
                pauseFriction = json.optString("pauseFriction", "none"),
            )
        } catch (t: Throwable) {
            Log.e(TAG, "Failed to parse BlockingSchedule JSON: $json", t)
            null
        }
    }
}

