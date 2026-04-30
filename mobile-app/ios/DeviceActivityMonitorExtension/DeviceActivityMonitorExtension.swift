//
//  DeviceActivityMonitorExtension.swift
//  DeviceActivityMonitorExtension
//
//  Created by o9tech on 09/10/2025.
//

import DeviceActivity
import Foundation
import ManagedSettings

// Optionally override any of the functions below.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class DeviceActivityMonitorExtension: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        // Handle the start of the interval.
        print("Monitoring — Started for activity: \(activity.rawValue)")
        BlockingScheduleManager.shared.activateSchedule(for: activity)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        print("Monitoring — ends for activity: \(activity.rawValue)")

        // SPECIAL CASE: soft_unlock_trigger: the delay before the user is allowed to unlock has
        // elapsed. Perform the temporary unlock now (from the monitor extension, which has a longer
        // lifetime than the shield action extension).
        if activity.rawValue == "soft_unlock_trigger" {
            print("[SoftBlocking] Unlock delay elapsed, performing temporary unlock...")
            performDelayedUnlock()
            return
        }

        // SPECIAL CASE: Check if this is a soft unlock activity schedule (temporary unlock period ended)
        if activity.rawValue == "soft_unlock_reblock" {
            print("Soft unlock period ended, resuming blocking...")
            resumeBlockingAfterSoftUnlock()
            return
        }

        // Handle the end of the interval.
        BlockingScheduleManager.shared.deactivateSchedule(for: activity)

        // Check if this is a pause resume activity
        if activity.rawValue.hasPrefix("pause_resume_") {
            print("Pause resume activity ended, resuming blocking...")
            resumeBlockingAfterPause()
        }
    }

    private func performDelayedUnlock() {
        let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")

        // Increment attempt count (was deferred from the shield action extension)
        let currentCount = sharedDefaults?.integer(forKey: SoftBlockingKeys.unlockAttemptCount) ?? 0
        sharedDefaults?.set(currentCount + 1, forKey: SoftBlockingKeys.unlockAttemptCount)
        sharedDefaults?.set(Date(), forKey: SoftBlockingKeys.lastUnlockAttemptDate)

        // Clear the waiting flag
        sharedDefaults?.set(false, forKey: SoftBlockingKeys.isWaitingForUnlock)
        sharedDefaults?.removeObject(forKey: SoftBlockingKeys.unlockWaitEndTime)
        sharedDefaults?.synchronize()

        BlockingScheduleManager.shared.performTemporaryUnlock()

        // NSNotificationCenter is process-local and won't cross the extension boundary.
        CFNotificationCenterPostNotification(
            CFNotificationCenterGetDarwinNotifyCenter(),
            CFNotificationName("com.FocusBear.softUnlockDidStart" as CFString),
            nil, nil, true
        )
    }

    private func resumeBlockingAfterPause() {
        // Get the stored focus duration from UserDefaults
        let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")
        let storedHours = sharedDefaults?.integer(forKey: "stored_focus_hours") ?? 0
        let storedMinutes = sharedDefaults?.integer(forKey: "stored_focus_minutes") ?? 0

        print("Resuming blocking with stored duration: \(storedHours)h \(storedMinutes)m")

        DispatchQueue.main.async {
            ControlModel.isBlockingEnabled = true
            let model = ActivityController.shared.model
            // No need to call initializeBlockingDataSync - initiateMonitoring now handles stored selection directly
            model.initiateMonitoring(hours: storedHours, minutes: storedMinutes)
            BlockingScheduleManager.shared.reload()
            BlockingScheduleManager.shared.resumePausedSchedules()
        }
    }
    
    private func resumeBlockingAfterSoftUnlock() {
        let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")

        // Clear the temporary unlock timestamp
        sharedDefaults?.removeObject(forKey: SoftBlockingKeys.temporaryUnlockEndTime)
        sharedDefaults?.synchronize()

        print("[SoftBlocking] Cleared unlock timestamp, reapplying shields")

        // Reapply current shields through BlockingScheduleManager
        DispatchQueue.main.async {
            print("Resuming blocking after soft unlock, reapplying shields...")
            ControlModel.isBlockingEnabled = true
            BlockingScheduleManager.shared.reload()
            BlockingScheduleManager.shared.clearAndReapplyShields()
        }

        // NSNotificationCenter is process-local and won't cross the extension boundary.
        CFNotificationCenterPostNotification(
            CFNotificationCenterGetDarwinNotifyCenter(),
            CFNotificationName("com.FocusBear.softUnlockDidEnd" as CFString),
            nil, nil, true
        )
    }

    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name, activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)
        // Handle the event reaching its threshold.
    }

    override func intervalWillStartWarning(for activity: DeviceActivityName) {
        super.intervalWillStartWarning(for: activity)
        // Handle the warning before the interval starts.
    }

    override func intervalWillEndWarning(for activity: DeviceActivityName) {
        super.intervalWillEndWarning(for: activity)
        // Handle the warning before the interval ends.
    }

    override func eventWillReachThresholdWarning(
        _ event: DeviceActivityEvent.Name, activity: DeviceActivityName
    ) {
        super.eventWillReachThresholdWarning(event, activity: activity)
        // Handle the warning before the event reaches its threshold.
    }
}
