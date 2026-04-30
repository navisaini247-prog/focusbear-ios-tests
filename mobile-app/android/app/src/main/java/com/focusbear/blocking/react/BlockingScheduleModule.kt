package com.focusbear.blocking.react

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.focusbear.NativeBlockingScheduleModuleSpec
import com.focusbear.blocking.BlockingScheduleManager

class BlockingScheduleModule(
    reactContext: ReactApplicationContext
) : NativeBlockingScheduleModuleSpec(reactContext), TurboModule {

    private val manager = BlockingScheduleManager.obtain(reactContext)
    private val reactCtx = reactContext

    init {
        manager.ensureInitialized()
    }

    override fun initialize() {
        super.initialize()
        manager.attachReactContext(reactApplicationContext)
    }

    override fun invalidate() {
        manager.attachReactContext(null)
        super.invalidate()
    }

    override fun setBlockingSchedules(payload: String, promise: Promise) {
        manager.setSchedules(payload, PromiseWrapper(promise))
    }

    override fun removeBlockingSchedule(id: String, promise: Promise) {
        manager.removeSchedule(id, PromiseWrapper(promise))
    }

    override fun clearAllBlockingSchedules(promise: Promise) {
        manager.clearSchedules(PromiseWrapper(promise))
    }

    override fun getBlockingSchedules(promise: Promise) {
        try {
            promise.resolve(manager.getSchedules())
        } catch (t: Throwable) {
            promise.reject("schedule_error", t.message ?: "Unable to load schedules", t)
        }
    }

    override fun getScheduleBlockingStatus(promise: Promise) {
        try {
            promise.resolve(manager.getStatus())
        } catch (t: Throwable) {
            promise.reject("schedule_error", t.message ?: "Unable to load status", t)
        }
    }

    // Permissions: Exact Alarms (Android 12+)
    override fun canScheduleExactAlarms(promise: Promise) {
        try {
            val alarmManager = reactCtx.getSystemService(android.content.Context.ALARM_SERVICE) as? android.app.AlarmManager
            val granted = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                alarmManager?.canScheduleExactAlarms() == true
            } else {
                true
            }
            promise.resolve(granted)
        } catch (t: Throwable) {
            promise.reject("permission_error", t.message ?: "Unable to check exact alarm permission", t)
        }
    }

    override fun openExactAlarmSettings(promise: Promise) {
        try {
            val intent = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
                android.content.Intent(android.provider.Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = android.net.Uri.parse("package:${reactCtx.packageName}")
                    addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = android.net.Uri.parse("package:${reactCtx.packageName}")
                    addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
            reactCtx.startActivity(intent)
            promise.resolve(null)
        } catch (t: Throwable) {
            promise.reject("permission_error", t.message ?: "Unable to open exact alarm settings", t)
        }
    }

    override fun setScheduleBlockedPackages(id: String, packages: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        val list = mutableListOf<String>()
        for (i in 0 until packages.size()) {
            val v = packages.getString(i)
            if (v != null && v.isNotBlank()) list.add(v)
        }
        manager.setScheduleBlockedPackages(id, list, PromiseWrapper(promise))
    }

    override fun setScheduleBlockedUrls(id: String, urls: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        val list = mutableListOf<String>()
        for (i in 0 until urls.size()) {
            val v = urls.getString(i)
            if (v != null && v.isNotBlank()) list.add(v)
        }
        manager.setScheduleBlockedUrls(id, list, PromiseWrapper(promise))
    }

    override fun setScheduleBlockedSelection(id: String, selection: com.facebook.react.bridge.ReadableArray, promise: Promise) {
        val json = org.json.JSONArray()
        for (i in 0 until selection.size()) {
            val item = selection.getMap(i)
            if (item != null) {
                val obj = org.json.JSONObject()
                obj.put("packageName", item.getString("packageName"))
                obj.put("appName", item.getString("appName"))
                obj.put("icon", item.getString("icon"))
                json.put(obj)
            }
        }
        manager.setScheduleBlockedSelection(id, json, PromiseWrapper(promise))
    }

    override fun getScheduleById(id: String, promise: Promise) {
        try {
            val result = manager.getScheduleById(id)
            if (result == null) {
                promise.resolve(null)
            } else {
                promise.resolve(result)
            }
        } catch (t: Throwable) {
            promise.reject("schedule_error", t.message ?: "Unable to load schedule", t)
        }
    }

    override fun getGlobalHabitBlockingEnabled(promise: Promise) {
        try {
            val prefs = reactCtx.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
            val enabled = prefs.getBoolean(com.focusbear.Constants.GLOBAL_HABIT_BLOCKING_ENABLED, true) // Default to true
            promise.resolve(enabled)
        } catch (t: Throwable) {
            promise.reject("schedule_error", t.message ?: "Unable to get global habit blocking enabled", t)
        }
    }

    override fun setGlobalHabitBlockingEnabled(enabled: Boolean, promise: Promise) {
        try {
            val prefs = reactCtx.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
            prefs.edit().putBoolean(com.focusbear.Constants.GLOBAL_HABIT_BLOCKING_ENABLED, enabled).apply()
            promise.resolve(null)
        } catch (t: Throwable) {
            promise.reject("schedule_error", t.message ?: "Unable to set global habit blocking enabled", t)
        }
    }

    override fun pauseBlockingWithResume(hours: Double, minutes: Double, reason: String, promise: Promise) {
        manager.pauseBlockingWithResume(hours.toInt(), minutes.toInt(), reason, PromiseWrapper(promise))
    }

    override fun pauseSchedulesIndefinitely(promise: Promise) {
        manager.pauseSchedulesIndefinitely(PromiseWrapper(promise))
    }

    override fun resumeScheduleBlocking(promise: Promise) {
        manager.resumePausedSchedules()
        promise.resolve(null)
    }

    private class PromiseWrapper(private val promise: Promise) : BlockingScheduleManager.PromiseAdapter {
        override fun resolve(value: Any?) {
            promise.resolve(value)
        }

        override fun reject(code: String, message: String, throwable: Throwable?) {
            promise.reject(code, message, throwable)
        }
    }
}

