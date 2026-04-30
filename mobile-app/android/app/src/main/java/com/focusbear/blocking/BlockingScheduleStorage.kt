package com.focusbear.blocking

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

internal class BlockingScheduleStorage(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE)

    fun loadSchedules(): List<BlockingSchedule> {
        val raw = prefs.getString(KEY_SCHEDULES, null) ?: return emptyList()
        return runCatching {
            val array = JSONArray(raw)
            buildList {
                for (index in 0 until array.length()) {
                    val json = array.optJSONObject(index) ?: continue
                    BlockingSchedule.fromJson(json)?.let { add(it) }
                }
            }
        }.getOrElse {
            Log.e(TAG, "Failed to load schedules", it)
            emptyList()
        }
    }

    fun saveSchedules(schedules: List<BlockingSchedule>) {
        val json = JSONArray().apply {
            schedules.forEach { put(it.toJson()) }
        }.toString()
        prefs.edit().putString(KEY_SCHEDULES, json).apply()
    }

    fun loadActiveIds(): Set<String> =
        prefs.getStringSet(KEY_ACTIVE_IDS, emptySet()) ?: emptySet()

    fun saveActiveIds(ids: Set<String>) {
        prefs.edit().putStringSet(KEY_ACTIVE_IDS, ids).apply()
    }

    fun saveStatus(status: JSONObject) {
        prefs.edit().putString(KEY_LAST_STATUS, status.toString()).apply()
    }

    fun loadLastStatus(): JSONObject? {
        val raw = prefs.getString(KEY_LAST_STATUS, null) ?: return null
        return runCatching { JSONObject(raw) }.getOrNull()
    }

    fun saveLastScheduleRefresh(timestamp: Long) {
        prefs.edit().putLong(KEY_LAST_REFRESH, timestamp).apply()
    }

    fun lastScheduleRefresh(): Long = prefs.getLong(KEY_LAST_REFRESH, 0L)

    fun savePauseState(pauseUntil: Long?, reason: String, wasGlobalBlocking: Boolean) {
        prefs.edit()
            .putLong(KEY_PAUSE_UNTIL, pauseUntil ?: 0L)
            .putString(KEY_PAUSE_REASON, reason)
            .putBoolean(KEY_PAUSE_WAS_GLOBAL_BLOCKING, wasGlobalBlocking)
            .apply()
    }

    fun loadPauseUntil(): Long = prefs.getLong(KEY_PAUSE_UNTIL, 0L)
    fun loadPauseReason(): String = prefs.getString(KEY_PAUSE_REASON, "") ?: ""
    fun loadPauseWasGlobalBlocking(): Boolean = prefs.getBoolean(KEY_PAUSE_WAS_GLOBAL_BLOCKING, false)

    fun clearPauseState() {
        prefs.edit()
            .remove(KEY_PAUSE_UNTIL)
            .remove(KEY_PAUSE_REASON)
            .remove(KEY_PAUSE_WAS_GLOBAL_BLOCKING)
            .apply()
    }

    companion object {
        private const val TAG = "BlockingScheduleStore"
        private const val PREF_NAME = "blocking_schedule_store"
        private const val KEY_SCHEDULES = "schedules"
        private const val KEY_ACTIVE_IDS = "active_ids"
        private const val KEY_LAST_STATUS = "last_status"
        private const val KEY_LAST_REFRESH = "last_refresh"
        private const val KEY_PAUSE_UNTIL = "pause_until"
        private const val KEY_PAUSE_REASON = "pause_reason"
        private const val KEY_PAUSE_WAS_GLOBAL_BLOCKING = "pause_was_global_blocking"
    }
}

