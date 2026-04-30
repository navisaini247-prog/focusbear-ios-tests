package com.focusbear.blocking

import android.os.Handler
import android.os.Looper
import android.util.Log
import com.focusbear.Constants
import com.focusbear.OverlayControl
import com.focusbear.OverlayModule

internal object BlockingScheduleOverlayController {

    private val mainHandler = Handler(Looper.getMainLooper())

    fun startBlocking(schedule: BlockingSchedule, context: android.content.Context) {
        mainHandler.post {
            try {
                primeDefaultBlockedApps(context)
                
                // Start foreground service to keep blocking active even when app is terminated
                val serviceIntent = android.content.Intent(context, com.focusbear.ForegroundService::class.java)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
                
                val overlay = OverlayControl.getInstance(context)
                // Ensure default blocked app is present for the schedule window
                applyBlockedPackages(schedule, context)
                OverlayModule.isServiceRunning = true

                overlay.addListener(
                    /* routine_name = */ "Schedule",
                    /* activity_name = */ schedule.name,
                    /* allowed_apps = */ emptySet<String>()
                )
                Log.d(TAG, "Overlay blocking started for schedule ${schedule.id}, foreground service started")
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to start overlay blocking for ${schedule.id}", t)
            }
        }
    }

    fun applyBlockedPackages(schedule: BlockingSchedule, context: android.content.Context) {
        // Note: This method is kept for compatibility but no longer modifies OverlayControl.blockedApps.
        // OverlayControl.blockedApps stores only global blocked apps.
        // Schedule-specific blocking is handled dynamically in OverlayControl.detectAndBlockAppsTask.
        val prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
        prefs.edit().putString(Constants.RESTRICTED_APP_LIST_TYPE, Constants.BLOCK_LIST).apply()
        Log.d(TAG, "Schedule ${schedule.id} blockedPackages: ${schedule.blockedPackages}")
        // Note: OverlayControl.blockedApps is now always loaded from SharedPreferences in addListener()
    }

    fun recalculateBlockedAppsFromAllActiveSchedules(activeSchedules: List<BlockingSchedule>, context: android.content.Context) {
        // Note: OverlayControl.blockedApps now stores only global blocked apps.
        // The effective blocked apps (global + schedule packages) are calculated dynamically
        // in OverlayControl.detectAndBlockAppsTask based on isGlobalBlocking flag.
        // This method is kept for compatibility but no longer modifies OverlayControl.blockedApps.
        val prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
        val globalBlocked = prefs.getStringSet(Constants.BLOCKED_APPS_DATA, emptySet())?.toMutableSet() ?: mutableSetOf()
        val allSchedulePackages = activeSchedules.flatMap { it.blockedPackages }.toSet()

        Log.d(TAG, "Active schedules: ${activeSchedules.size}, global blocked: ${globalBlocked.size}, schedule packages: ${allSchedulePackages.size}")
    }

    fun recalculateBlockedUrlsFromAllActiveSchedules(activeSchedules: List<BlockingSchedule>, context: android.content.Context) {
        mainHandler.post {
            try {
                val prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
                val globalBlockedUrlsJson = prefs.getString(Constants.RESTRICTED_ADDRESSES_DATA, "[]") ?: "[]"
                val globalBlockedUrls = try {
                    val jsonArray = org.json.JSONArray(globalBlockedUrlsJson)
                    (0 until jsonArray.length()).map { jsonArray.getString(it) }.toMutableSet()
                } catch (e: Exception) {
                    mutableSetOf<String>()
                }
                val allScheduleUrls = activeSchedules.flatMap { it.blockedUrls }.toSet()
                val combinedUrls = (globalBlockedUrls + allScheduleUrls).toList()

                Log.d(TAG, "Recalculating blocked URLs: global=${globalBlockedUrls.size}, schedule=${allScheduleUrls.size}, combined=${combinedUrls.size}")
                com.focusbear.AccessibilityUtils.getInstance().setRestrictedAddresses(combinedUrls)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to recalculate blocked URLs", t)
            }
        }
    }

    fun resetToGlobalBlockedUrls(context: android.content.Context) {
        mainHandler.post {
            try {
                val prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
                val globalBlockedUrlsJson = prefs.getString(Constants.RESTRICTED_ADDRESSES_DATA, "[]") ?: "[]"
                val globalBlockedUrls = try {
                    val jsonArray = org.json.JSONArray(globalBlockedUrlsJson)
                    (0 until jsonArray.length()).map { jsonArray.getString(it) }
                } catch (e: Exception) {
                    emptyList<String>()
                }

                Log.d(TAG, "Resetting to global blocked URLs: count=${globalBlockedUrls.size}")
                com.focusbear.AccessibilityUtils.getInstance().setRestrictedAddresses(globalBlockedUrls)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to reset to global blocked URLs", t)
            }
        }
    }

    fun stopBlocking(context: android.content.Context) {
        mainHandler.post {
            try {
                // Delegate to OverlayModule's consolidated stop logic
                val stopped = com.focusbear.OverlayModule.stopOverlayServiceIfSafe(context)
                if (stopped) {
                    Log.d(TAG, "Overlay blocking stopped")
                } else {
                    Log.d(TAG, "Overlay blocking kept running due to other active blocking sources")
                }
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to stop overlay blocking", t)
            }
        }
    }

    fun stopBlockingForce(context: android.content.Context) {
        mainHandler.post {
            try {
                // Force stop regardless of other active blocking sources (used for pause)
                com.focusbear.OverlayModule.stopOverlayServiceForce(context)
                Log.d(TAG, "Overlay blocking force stopped (pause)")
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to force stop overlay blocking", t)
            }
        }
    }

    fun resetToGlobalBlockedApps(context: android.content.Context) {
        // Note: OverlayControl.blockedApps is now always loaded from SharedPreferences in addListener(),
        // so this method is kept for compatibility but no longer needs to modify OverlayControl.blockedApps.
        val prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
        val globalBlocked = prefs.getStringSet(Constants.BLOCKED_APPS_DATA, emptySet())?.toMutableSet() ?: mutableSetOf()
        Log.d(TAG, "Global blocked apps count: ${globalBlocked.size}")
    }

    fun primeDefaultBlockedApps(context: android.content.Context) {
        // Ensure default blocked apps are saved to SharedPreferences
        val prefs = context.getSharedPreferences(Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
        val existing = prefs.getStringSet(Constants.BLOCKED_APPS_DATA, emptySet())?.toMutableSet() ?: mutableSetOf()
        if (existing.addAll(BlockingSchedule.DEFAULT_BLOCKED_PACKAGES)) {
            prefs.edit().putStringSet(Constants.BLOCKED_APPS_DATA, existing).apply()
        }
        prefs.edit().putString(Constants.RESTRICTED_APP_LIST_TYPE, Constants.BLOCK_LIST).apply()
        // Note: OverlayControl.blockedApps will be loaded from SharedPreferences in addListener()
    }

    private const val TAG = "ScheduleOverlayCtrl"
}

