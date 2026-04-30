package com.focusbear.blocking

import android.content.Context
import android.util.Log
import com.focusbear.NativeBlockingLogger
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject
import java.time.ZoneId
import java.time.ZonedDateTime
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean

internal class BlockingScheduleManager private constructor(
    private val context: Context
) {

    private val storage = BlockingScheduleStorage(context)
    private val scheduler = BlockingScheduleAlarmScheduler(context)
    private val executor = Executors.newSingleThreadExecutor()
    private val initialized = AtomicBoolean(false)
    private val prefs = context.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE)

    @Volatile
    private var schedules: List<BlockingSchedule> = emptyList()
    @Volatile
    private var activeIds: Set<String> = emptySet()

    @Volatile
    private var eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter? = null

    fun initializeIfNeeded() {
        if (initialized.compareAndSet(false, true)) {
            executor.execute {
                schedules = storage.loadSchedules()
                activeIds = storage.loadActiveIds()
                scheduler.ensureAlarmsFor(schedules)
                BlockingScheduleOverlayController.primeDefaultBlockedApps(context)
                // On init, check if a timed pause has expired and resume if needed
                resumePausedSchedulesIfExpired()
                reconcileActiveIds()
            }
        }
    }

    fun attachReactContext(reactContext: ReactApplicationContext?) {
        eventEmitter = reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
    }

    fun setSchedules(payload: String, promise: PromiseAdapter) {
        executor.execute {
            try {
                // Ensure initialization before setting schedules (important after device restart)
                initializeIfNeeded()

                val incoming = parsePayload(JSONArray(payload))
                if (incoming.isEmpty()) {
                    promise.resolve(null)
                    return@execute
                }
                val merged = schedules.associateBy { it.id }.toMutableMap()
                incoming.forEach { merged[it.id] = it }
                schedules = merged.values.sortedBy { it.startHour * 60 + it.startMinute }
                storage.saveSchedules(schedules)
                scheduler.ensureAlarmsFor(schedules)
                reconcileActiveIds()
                promise.resolve(null)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to set schedules", t)
                promise.reject("schedule_error", t.message ?: "Failed to set schedules", t)
            }
        }
    }

    fun removeSchedule(id: String, promise: PromiseAdapter) {
        executor.execute {
            val updated = schedules.filterNot { it.id == id }
            if (updated.size == schedules.size) {
                promise.resolve(null)
                return@execute
            }
            schedules = updated
            storage.saveSchedules(updated)
            scheduler.cancel(id)
            activeIds = activeIds - id
            storage.saveActiveIds(activeIds)
            if (activeIds.isEmpty()) {
                BlockingScheduleOverlayController.stopBlocking(context)
                BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
            } else {
                // Recalculate blocked apps from remaining active schedules
                val remainingActiveSchedules = schedules.filter { activeIds.contains(it.id) }
                if (remainingActiveSchedules.isNotEmpty()) {
                    // Merge all active schedule packages with global blocked apps
                    val prefs = context.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, Context.MODE_PRIVATE)
                    val globalBlocked = prefs.getStringSet(com.focusbear.Constants.BLOCKED_APPS_DATA, emptySet())?.toMutableSet() ?: mutableSetOf()
                    val allSchedulePackages = remainingActiveSchedules.flatMap { it.blockedPackages }.toSet()
                    com.focusbear.OverlayControl.blockedApps.clear()
                    com.focusbear.OverlayControl.blockedApps.addAll(globalBlocked)
                    com.focusbear.OverlayControl.blockedApps.addAll(allSchedulePackages)
                    Log.i(TAG, "Recalculated blockedApps after schedule removal: ${com.focusbear.OverlayControl.blockedApps.size} apps from ${remainingActiveSchedules.size} active schedules")
                }
            }
            notifyStatusChanged()
            promise.resolve(null)
        }
    }

    fun clearSchedules(promise: PromiseAdapter) {
        executor.execute {
            scheduler.cancelAll(schedules)
            schedules = emptyList()
            activeIds = emptySet()
            storage.saveSchedules(emptyList())
            storage.saveActiveIds(emptySet())
            BlockingScheduleOverlayController.stopBlocking(context)
            BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
            notifyStatusChanged()
            promise.resolve(null)
        }
    }

    fun setScheduleBlockedPackages(id: String, packages: List<String>, promise: PromiseAdapter) {
        executor.execute {
            try {
                Log.i(TAG, "setScheduleBlockedPackages called id=$id packagesCount=${packages.size} packages=$packages")
                val updated = schedules.map { s ->
                    if (s.id == id) s.copy(blockedPackages = packages) else s
                }
                if (updated == schedules) {
                    Log.i(TAG, "No changes detected for schedule id=$id (blockedPackages unchanged)")
                    promise.resolve(null)
                    return@execute
                }
                schedules = updated
                storage.saveSchedules(updated)
                Log.i(TAG, "Persisted blockedPackages for id=$id; activeIds=$activeIds")
                if (activeIds.contains(id)) {
                    // Recalculate blocked apps from ALL active schedules, not just the updated one
                    val activeSchedules = schedules.filter { activeIds.contains(it.id) }
                    if (activeSchedules.isNotEmpty()) {
                        BlockingScheduleOverlayController.recalculateBlockedAppsFromAllActiveSchedules(activeSchedules, context)
                    } else {
                        BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
                    }
                }
                notifyStatusChanged()
                Log.i(TAG, "setScheduleBlockedPackages finished id=$id")
                promise.resolve(null)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to set blocked packages for $id", t)
                promise.reject("schedule_error", t.message ?: "Failed to set blocked packages", t)
            }
        }
    }

    fun setScheduleBlockedSelection(id: String, selection: JSONArray, promise: PromiseAdapter) {
        executor.execute {
            try {
                val packages = buildList {
                    for (i in 0 until selection.length()) {
                        val obj = selection.optJSONObject(i) ?: continue
                        val pkg = obj.optString("packageName")
                        if (!pkg.isNullOrBlank()) add(pkg)
                    }
                }
                Log.i(TAG, "setScheduleBlockedSelection id=$id items=${selection.length()} packagesCount=${packages.size}")
                val updated = schedules.map { s -> if (s.id == id) s.copy(blockedPackages = packages) else s }
                schedules = updated
                storage.saveSchedules(updated)
                saveBlockedAppInfos(id, selection)
                if (activeIds.contains(id)) {
                    // Recalculate blocked apps from ALL active schedules, not just the updated one
                    val activeSchedules = schedules.filter { activeIds.contains(it.id) }
                    if (activeSchedules.isNotEmpty()) {
                        BlockingScheduleOverlayController.recalculateBlockedAppsFromAllActiveSchedules(activeSchedules, context)
                    } else {
                        BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
                    }
                }
                notifyStatusChanged()
                promise.resolve(null)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to set blocked selection for $id", t)
                promise.reject("schedule_error", t.message ?: "Failed to set blocked selection", t)
            }
        }
    }

    fun setScheduleBlockedUrls(id: String, urls: List<String>, promise: PromiseAdapter) {
        executor.execute {
            try {
                Log.i(TAG, "setScheduleBlockedUrls called id=$id urlsCount=${urls.size} urls=$urls")
                val updated = schedules.map { s ->
                    if (s.id == id) s.copy(blockedUrls = urls) else s
                }
                if (updated == schedules) {
                    Log.i(TAG, "No changes detected for schedule id=$id (blockedUrls unchanged)")
                    promise.resolve(null)
                    return@execute
                }
                schedules = updated
                storage.saveSchedules(updated)
                Log.i(TAG, "Persisted blockedUrls for id=$id; activeIds=$activeIds")
                if (activeIds.contains(id)) {
                    // Recalculate blocked URLs from ALL active schedules
                    val activeSchedules = schedules.filter { activeIds.contains(it.id) }
                    if (activeSchedules.isNotEmpty()) {
                        BlockingScheduleOverlayController.recalculateBlockedUrlsFromAllActiveSchedules(activeSchedules, context)
                    } else {
                        BlockingScheduleOverlayController.resetToGlobalBlockedUrls(context)
                    }
                }
                notifyStatusChanged()
                Log.i(TAG, "setScheduleBlockedUrls finished id=$id")
                promise.resolve(null)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to set blocked URLs for $id", t)
                promise.reject("schedule_error", t.message ?: "Failed to set blocked URLs", t)
            }
        }
    }


    fun recalculateBlockedUrlsFromGlobalAndSchedules() {
        initializeIfNeeded()
        executor.execute {
            val activeSchedules = schedules.filter { activeIds.contains(it.id) }
            if (activeSchedules.isNotEmpty()) {
                BlockingScheduleOverlayController.recalculateBlockedUrlsFromAllActiveSchedules(activeSchedules, context)
            } else {
                BlockingScheduleOverlayController.resetToGlobalBlockedUrls(context)
            }
        }
    }

    private fun metaKey(id: String) = "schedule_blocked_app_infos_$id"
    private fun saveBlockedAppInfos(id: String, infos: JSONArray) {
        prefs.edit().putString(metaKey(id), infos.toString()).apply()
    }
    private fun loadBlockedAppInfos(id: String): JSONArray? {
        val raw = prefs.getString(metaKey(id), null) ?: return null
        return try {
            JSONArray(raw)
        } catch (_: Throwable) {
            null
        }
    }

    fun getSchedules(): WritableArray {
        val array = JSONArray()
        schedules.forEach { schedule ->
            val infos = loadBlockedAppInfos(schedule.id)
            array.put(JSONObject().apply {
                put("id", schedule.id)
                put("name", schedule.name)
                put("startHour", schedule.startHour)
                put("startMinute", schedule.startMinute)
                put("endHour", schedule.endHour)
                put("endMinute", schedule.endMinute)
                put("daysOfWeek", JSONArray(schedule.daysOfWeek))
                put("blockingMode", schedule.blockingMode)
                put("blockedPackages", JSONArray(schedule.blockedPackages))
                put("blockedUrls", JSONArray(schedule.blockedUrls))
                put("type", schedule.type)
                if (schedule.focusModeId != null) {
                    put("focusModeId", schedule.focusModeId)
                }
                put("isAiBlockingEnabled", schedule.isAiBlockingEnabled)
                put("pauseFriction", schedule.pauseFriction)
                if (infos != null) {
                    put("blockedAppInfos", infos)
                }
                put("isActive", activeIds.contains(schedule.id))
            })
        }
        return jsonArrayToWritable(array)
    }

    fun getStatus(): WritableMap = jsonToWritable(buildStatusSummary())

    fun getScheduleById(id: String): WritableMap? {
        val schedule = schedules.firstOrNull { it.id == id } ?: return null
        val obj = JSONObject().apply {
            put("id", schedule.id)
            put("name", schedule.name)
            put("startHour", schedule.startHour)
            put("startMinute", schedule.startMinute)
            put("endHour", schedule.endHour)
            put("endMinute", schedule.endMinute)
            put("daysOfWeek", JSONArray(schedule.daysOfWeek))
            put("blockingMode", schedule.blockingMode)
            put("blockedPackages", JSONArray(schedule.blockedPackages))
            put("blockedUrls", JSONArray(schedule.blockedUrls))
            put("type", schedule.type)
            if (schedule.focusModeId != null) {
                put("focusModeId", schedule.focusModeId)
            }
            put("isAiBlockingEnabled", schedule.isAiBlockingEnabled)
            put("pauseFriction", schedule.pauseFriction)
            loadBlockedAppInfos(schedule.id)?.let { put("blockedAppInfos", it) }
            put("isActive", activeIds.contains(schedule.id))
        }
        return jsonToWritable(obj)
    }

    fun onTrigger(id: String, type: BlockingScheduleAlarmScheduler.TriggerType) {
        executor.execute {
            when (type) {
                BlockingScheduleAlarmScheduler.TriggerType.START -> activate(id)
                BlockingScheduleAlarmScheduler.TriggerType.END -> deactivate(id)
            }
            reconcileActiveIds()
        }
    }

    fun refreshScheduling() {
        executor.execute {
            scheduler.ensureAlarmsFor(schedules)
        }
    }

    fun ensureInitialized() {
        initializeIfNeeded()
    }

    private fun parsePayload(array: JSONArray): List<BlockingSchedule> {
        val zone = ZoneId.systemDefault()
        return buildList {
            for (index in 0 until array.length()) {
                val json = array.optJSONObject(index) ?: continue
                val interval = json.optJSONObject("interval")
                val startHour = interval?.optInt("startHour") ?: json.optInt("startHour")
                val startMinute = interval?.optInt("startMinute") ?: json.optInt("startMinute")
                val endHour = interval?.optInt("endHour") ?: json.optInt("endHour")
                val endMinute = interval?.optInt("endMinute") ?: json.optInt("endMinute")
                val explicitPackages = json.optJSONArray("blockedPackages")?.let { arr ->
                    buildList {
                        for (i in 0 until arr.length()) {
                            val value = arr.optString(i)
                            if (!value.isNullOrBlank()) add(value)
                        }
                    }
                } ?: emptyList()

                val scheduleId = json.optString("id")
                val packagesFromMetadata = if (scheduleId.isNullOrBlank()) {
                    emptyList()
                } else {
                    loadBlockedAppInfos(scheduleId)?.let { infos ->
                        buildList {
                            for (i in 0 until infos.length()) {
                                val obj = infos.optJSONObject(i)
                                val pkg = obj?.optString("packageName")
                                if (!pkg.isNullOrBlank()) add(pkg)
                            }
                        }
                    } ?: emptyList()
                }

                val fallbackPackages = run {
                    val prefs = context.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
                    val set = prefs.getStringSet(com.focusbear.Constants.BLOCKED_APPS_DATA, emptySet())?.toList()
                    if (set != null && set.isNotEmpty()) set else BlockingSchedule.DEFAULT_BLOCKED_PACKAGES
                }

                val resolvedPackages = when {
                    explicitPackages.isNotEmpty() -> explicitPackages
                    packagesFromMetadata.isNotEmpty() -> packagesFromMetadata
                    else -> fallbackPackages
                }

                // If type is not specified, infer from ID: habit_* IDs are habit schedules
                val inferredType = if (scheduleId.startsWith("habit_")) "habit" else "custom"
                val scheduleType = json.optString("type", inferredType)
                
                // Parse blockedUrls from JSON, or preserve existing if not provided
                val existingSchedule = schedules.firstOrNull { it.id == scheduleId }
                val explicitUrls = json.optJSONArray("blockedUrls")?.let { arr ->
                    buildList {
                        for (i in 0 until arr.length()) {
                            val value = arr.optString(i)
                            if (!value.isNullOrBlank()) add(value)
                        }
                    }
                }
                // Use explicit URLs if provided, otherwise preserve existing URLs
                val resolvedUrls = explicitUrls ?: existingSchedule?.blockedUrls ?: emptyList()

                val schedule = BlockingSchedule(
                    id = scheduleId,
                    name = json.optString("name", "Schedule"),
                    startHour = startHour,
                    startMinute = startMinute,
                    endHour = endHour,
                    endMinute = endMinute,
                    daysOfWeek = json.optJSONArray("daysOfWeek")?.let { arr ->
                        buildList {
                            for (i in 0 until arr.length()) {
                                val value = arr.optString(i)
                                if (!value.isNullOrBlank()) add(value)
                            }
                        }
                    } ?: emptyList(),
                    blockingMode = json.optString("blockingMode", "gentle"),
                    blockedPackages = resolvedPackages,
                    blockedUrls = resolvedUrls,
                    type = scheduleType,
                    focusModeId = json.optString("focusModeId").takeIf { !it.isNullOrBlank() },
                    isAiBlockingEnabled = json.optBoolean("isAiBlockingEnabled", false),
                    pauseFriction = json.optString("pauseFriction", "none"),
                )
                add(schedule)
            }
        }
    }

    private fun activate(id: String) {
        if (activeIds.contains(id)) return
        val schedule = schedules.firstOrNull { it.id == id } ?: return
        val wasEmpty = activeIds.isEmpty()
        activeIds = activeIds + id
        storage.saveActiveIds(activeIds)
        Log.i(TAG, "Activating schedule=$id name=${schedule.name} blocked=${schedule.blockedPackages} blockedUrls=${schedule.blockedUrls}")
        val blockedAppsPreview = NativeBlockingLogger.formatBlockedPreviewLabels(
            context,
            schedule.blockedPackages.toSet(),
            NativeBlockingLogger.DEFAULT_BLOCKED_PREVIEW_MAX_PRIMARY
        )
        val blockedUrlsPreview = NativeBlockingLogger.formatStringPreview(
            schedule.blockedUrls,
            NativeBlockingLogger.DEFAULT_URL_PREVIEW_MAX_PRIMARY
        )
        NativeBlockingLogger.logBlockingEvent(
            context,
            "schedule_activate id=$id name=${schedule.name} type=${schedule.type} mode=${schedule.blockingMode} blockedApps=$blockedAppsPreview blockedUrls=$blockedUrlsPreview"
        )
        // Recalculate from all active schedules
        val activeSchedules = schedules.filter { activeIds.contains(it.id) }
        BlockingScheduleOverlayController.recalculateBlockedAppsFromAllActiveSchedules(activeSchedules, context)
        BlockingScheduleOverlayController.recalculateBlockedUrlsFromAllActiveSchedules(activeSchedules, context)
        if (wasEmpty) {
            BlockingScheduleOverlayController.startBlocking(schedule, context)
        }
        notifyStatusChanged()
    }

    private fun deactivate(id: String) {
        if (!activeIds.contains(id)) return
        val schedule = schedules.firstOrNull { it.id == id }
        activeIds = activeIds - id
        storage.saveActiveIds(activeIds)
        NativeBlockingLogger.logBlockingEvent(
            context,
            "schedule_deactivate id=$id name=${schedule?.name} remainingActive=${activeIds.size}"
        )
        if (activeIds.isEmpty()) {
            BlockingScheduleOverlayController.stopBlocking(context)
            BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
            BlockingScheduleOverlayController.resetToGlobalBlockedUrls(context)
        } else {
            // Recalculate from remaining active schedules
            val activeSchedules = schedules.filter { activeIds.contains(it.id) }
            BlockingScheduleOverlayController.recalculateBlockedAppsFromAllActiveSchedules(activeSchedules, context)
            BlockingScheduleOverlayController.recalculateBlockedUrlsFromAllActiveSchedules(activeSchedules, context)
        }
        notifyStatusChanged()
    }

    fun pauseBlockingWithResume(hours: Int, minutes: Int, reason: String, promise: PromiseAdapter) {
        executor.execute {
            try {
                val totalMinutes = hours * 60 + minutes
                val resumeAt = System.currentTimeMillis() + (totalMinutes * 60 * 1000L)
                
                // Check if global blocking was active before pausing
                val prefs = context.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
                val wasGlobalBlocking = prefs.getBoolean(com.focusbear.Constants.IS_GLOBAL_BLOCKING, false)
                
                // Force stop current blocking (regardless of other active sources)
                // When pause expires, schedules/blocking will resume automatically
                BlockingScheduleOverlayController.stopBlockingForce(context)
                
                // Cancel all schedule alarms to prevent them from triggering during pause
                scheduler.cancelAll(schedules)
                
                // Save pause state including global blocking state
                storage.savePauseState(resumeAt, reason, wasGlobalBlocking)
                
                // Schedule resume alarm
                scheduler.scheduleResume(resumeAt)
                
                // Clear active IDs
                activeIds = emptySet()
                storage.saveActiveIds(activeIds)
                
                Log.i(TAG, "Paused blocking until $resumeAt (${totalMinutes} minutes) reason=$reason wasGlobalBlocking=$wasGlobalBlocking, canceled all schedule alarms")
                NativeBlockingLogger.logBlockingEvent(
                    context,
                    "schedule_pause_until resumeAt=$resumeAt minutes=$totalMinutes reason=$reason wasGlobalBlocking=$wasGlobalBlocking"
                )
                notifyStatusChanged()
                promise.resolve(null)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to pause blocking", t)
                NativeBlockingLogger.logBlockingError(context, "schedule_pause_until_failed", t)
                promise.reject("pause_error", t.message ?: "Failed to pause blocking", t)
            }
        }
    }

    fun pauseSchedulesIndefinitely(promise: PromiseAdapter) {
        executor.execute {
            try {
                // Check if global blocking was active before pausing
                val prefs = context.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
                val wasGlobalBlocking = prefs.getBoolean(com.focusbear.Constants.IS_GLOBAL_BLOCKING, false)
                
                // Force stop current blocking (regardless of other active sources)
                // When manually resumed, schedules/blocking will resume automatically
                BlockingScheduleOverlayController.stopBlockingForce(context)
                
                // Cancel all schedule alarms to prevent them from triggering during pause
                scheduler.cancelAll(schedules)
                
                // Save pause state (indefinite = 0) including global blocking state
                storage.savePauseState(null, "indefinite", wasGlobalBlocking)
                
                // Cancel any existing resume alarm
                scheduler.cancelResume()
                
                // Clear active IDs
                activeIds = emptySet()
                storage.saveActiveIds(activeIds)
                
                Log.i(TAG, "Paused blocking indefinitely wasGlobalBlocking=$wasGlobalBlocking, canceled all schedule alarms")
                NativeBlockingLogger.logBlockingEvent(
                    context,
                    "schedule_pause_indefinite wasGlobalBlocking=$wasGlobalBlocking"
                )
                notifyStatusChanged()
                promise.resolve(null)
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to pause schedules indefinitely", t)
                NativeBlockingLogger.logBlockingError(context, "schedule_pause_indefinite_failed", t)
                promise.reject("pause_error", t.message ?: "Failed to pause schedules indefinitely", t)
            }
        }
    }

    private fun resumePausedSchedules(force: Boolean) {
        executor.execute {
            try {
                val pauseUntil = storage.loadPauseUntil()
                val now = System.currentTimeMillis()
                
                // If not forcing and pauseUntil is in the future, keep pause active
                if (!force && pauseUntil > 0 && pauseUntil > now) {
                    Log.d(TAG, "Pause not expired yet, pauseUntil=$pauseUntil now=$now (force=$force)")
                    return@execute
                }
                
                // Get global blocking state before clearing pause state
                val wasGlobalBlocking = storage.loadPauseWasGlobalBlocking()
                
                // Clear pause state
                storage.clearPauseState()
                scheduler.cancelResume()
                
                // Reconcile active IDs to reactivate schedules
                reconcileActiveIds()
                
                // Restore global blocking state if it was active before pause
                if (wasGlobalBlocking) {
                    val prefs = context.getSharedPreferences(com.focusbear.Constants.SHARED_PREFERENCE, android.content.Context.MODE_PRIVATE)
                    prefs.edit().putBoolean(com.focusbear.Constants.IS_GLOBAL_BLOCKING, true).apply()
                    
                    // Note: The JS side (use-enable-distraction-blocking hook) should detect that blocking
                    // should be enabled and restart the service. We emit a status change event to trigger
                    // the hook to re-evaluate.
                    Log.i(TAG, "Restored global blocking flag after manual resume, emitting status change event")
                }
                
                // Emit status change event to notify JS side that resume happened
                // This will trigger use-enable-distraction-blocking to re-evaluate and restart service if needed
                notifyStatusChanged()
                
                Log.i(TAG, "Resumed paused schedules wasGlobalBlocking=$wasGlobalBlocking force=$force")
                NativeBlockingLogger.logBlockingEvent(
                    context,
                    "schedule_resume wasGlobalBlocking=$wasGlobalBlocking force=$force activeIds=${activeIds.size}"
                )
            } catch (t: Throwable) {
                Log.e(TAG, "Failed to resume paused schedules", t)
                NativeBlockingLogger.logBlockingError(context, "schedule_resume_failed", t)
            }
        }
    }

    fun resumePausedSchedules() {
        resumePausedSchedules(force = true)
    }

    fun resumePausedSchedulesIfExpired() {
        resumePausedSchedules(force = false)
    }

    private fun reconcileActiveIds() {
        val now = ZonedDateTime.now(ZoneId.systemDefault())
        
        // Check if blocking is paused
        val pauseUntil = storage.loadPauseUntil()
        val isPaused = pauseUntil > 0 && pauseUntil > System.currentTimeMillis()
        
        // If paused, don't activate any schedules
        val expected = if (isPaused) {
            emptySet<String>()
        } else {
            schedules.filter { it.contains(now) }.map { it.id }.toSet()
        }
        
        if (expected != activeIds) {
            val newlyActive = expected - activeIds
            activeIds = expected
            storage.saveActiveIds(activeIds)
            Log.i(TAG, "Reconciled active ids -> $activeIds newlyActive=$newlyActive isPaused=$isPaused")
            
            // Recalculate blocked apps and URLs from all active schedules
            if (activeIds.isNotEmpty()) {
                val activeSchedules = schedules.filter { activeIds.contains(it.id) }
                BlockingScheduleOverlayController.recalculateBlockedAppsFromAllActiveSchedules(activeSchedules, context)
                BlockingScheduleOverlayController.recalculateBlockedUrlsFromAllActiveSchedules(activeSchedules, context)
            }

            if (activeIds.isEmpty()) {
                BlockingScheduleOverlayController.stopBlocking(context)
                BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
                BlockingScheduleOverlayController.resetToGlobalBlockedUrls(context)
            } else {
                newlyActive.firstOrNull()?.let { id ->
                    schedules.firstOrNull { it.id == id }?.let { BlockingScheduleOverlayController.startBlocking(it, context) }
                }
            }
            notifyStatusChanged()
        }
        scheduler.ensureAlarmsFor(schedules)
    }

    private fun notifyStatusChanged() {
        val status = buildStatusSummary()
        storage.saveStatus(status)
        eventEmitter?.emit(EVENT_STATUS_CHANGED, jsonToWritable(status))
    }

    private fun buildStatusSummary(): JSONObject {
        val active = schedules.filter { activeIds.contains(it.id) }
        val pauseUntil = storage.loadPauseUntil()
        val pauseReason = storage.loadPauseReason()
        val now = System.currentTimeMillis()
        val isPaused = pauseUntil > 0 && pauseUntil > now
        
        return JSONObject().apply {
            put("isScheduleBlocking", active.isNotEmpty() && !isPaused)
            put("activeScheduleIds", JSONArray(active.map { it.id }))
            put("activeScheduleNames", JSONArray(active.map { it.name }))
            put("activeScheduleCount", active.size)
            put("hasGlobalSelection", false)
            put("isPaused", isPaused)
            put("pauseState", if (isPaused) pauseReason else "none")
            put("pauseUntil", if (pauseUntil > 0) pauseUntil else JSONObject.NULL)
            put("totalApplications", active.flatMap { it.blockedPackages }.distinct().size)
        }
    }

    private fun jsonToWritable(json: JSONObject): WritableMap {
        val map = com.facebook.react.bridge.Arguments.createMap()
        val keys = json.keys()
        while (keys.hasNext()) {
            val key = keys.next()
            when (val value = json.get(key)) {
                is JSONObject -> map.putMap(key, jsonToWritable(value))
                is JSONArray -> map.putArray(key, jsonArrayToWritable(value))
                is Boolean -> map.putBoolean(key, value)
                is Int -> map.putInt(key, value)
                is Long -> map.putDouble(key, value.toDouble())
                is Double -> map.putDouble(key, value)
                is String -> map.putString(key, value)
                JSONObject.NULL -> map.putNull(key)
                else -> map.putString(key, value.toString())
            }
        }
        return map
    }

    private fun jsonArrayToWritable(array: JSONArray): WritableArray {
        val writable = com.facebook.react.bridge.Arguments.createArray()
        for (index in 0 until array.length()) {
            when (val value = array.get(index)) {
                is JSONObject -> writable.pushMap(jsonToWritable(value))
                is JSONArray -> writable.pushArray(jsonArrayToWritable(value))
                is Boolean -> writable.pushBoolean(value)
                is Int -> writable.pushInt(value)
                is Long -> writable.pushDouble(value.toDouble())
                is Double -> writable.pushDouble(value)
                is String -> writable.pushString(value)
                JSONObject.NULL -> writable.pushNull()
                else -> writable.pushString(value.toString())
            }
        }
        return writable
    }

    fun recalculateBlockedAppsAfterGlobalUpdate(context: Context) {
        initializeIfNeeded()
        executor.execute {
            if (activeIds.isNotEmpty()) {
                val activeSchedules = schedules.filter { activeIds.contains(it.id) }
                BlockingScheduleOverlayController.recalculateBlockedAppsFromAllActiveSchedules(activeSchedules, context)
            } else {
                // No active schedules, just use global blocked apps
                BlockingScheduleOverlayController.resetToGlobalBlockedApps(context)
            }
        }
    }

    fun getSchedulesInternal(): List<BlockingSchedule> {
        return schedules
    }

    fun getActiveCustomSchedules(): List<BlockingSchedule> {
        // Return only custom schedules (exclude habit schedules) that are in activeIds
        return schedules.filter { activeIds.contains(it.id) && it.type != "habit" }
    }

    /**
     * Returns the set of all package names that are currently blocked by active schedules.
     * This does NOT include the global blocked list from SharedPreferences; callers that
     * need the full effective set should merge this with the global list.
     */
    fun getAllActiveBlockedPackages(): Set<String> {
        val active = schedules.filter { activeIds.contains(it.id) }
        return active.flatMap { it.blockedPackages }.toSet()
    }

    companion object {
        private const val EVENT_STATUS_CHANGED = "onBlockingStatusChanged"
        private const val TAG = "BlockingScheduleMgr"

        @Volatile
        private var instance: BlockingScheduleManager? = null

        @JvmStatic
        fun obtain(context: Context): BlockingScheduleManager =
            instance ?: synchronized(this) {
                instance ?: BlockingScheduleManager(context.applicationContext).also {
                    instance = it
                }
            }
    }

    interface PromiseAdapter {
        fun resolve(value: Any?)
        fun reject(code: String, message: String, throwable: Throwable? = null)
    }
}

