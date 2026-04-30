//
//  ShieldActionExtension.swift
//  FocusShieldAction
//
//  Created by itech on 10/09/24.
//

import DeviceActivity
import FamilyControls
import ManagedSettings
import UserNotifications

// This class handles custom shield actions in various contexts like applications, web domains, and activity categories.
class ShieldActionExtension: ShieldActionDelegate {

  private let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")

  // Handles actions for application tokens.
  override func handle(action: ShieldAction, for application: ApplicationToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleShieldAction(action, applicationToken: application, completionHandler: completionHandler)
  }

  // Handles actions for web domain tokens.
  override func handle(action: ShieldAction, for webDomain: WebDomainToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleShieldAction(action, applicationToken: nil, completionHandler: completionHandler)
  }

  // Handles actions for activity category tokens.
  override func handle(action: ShieldAction, for category: ActivityCategoryToken, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleShieldAction(action, applicationToken: nil, completionHandler: completionHandler)
  }

  // A common function to handle shield actions across different token types.
  // applicationToken is nil for web domains and categories, which fall back to the legacy global check.
  private func handleShieldAction(_ action: ShieldAction, applicationToken: ApplicationToken?, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    switch action {
    case .primaryButtonPressed:
      completionHandler(.close)

    case .secondaryButtonPressed:
      handleSoftUnlock(applicationToken: applicationToken, completionHandler: completionHandler)

    @unknown default:
      fatalError("Unknown action detected!")
    }
  }

  // Returns whether soft blocking (gentle mode) is enabled for the given app token.
  // For apps in an active schedule, uses that schedule's pauseFriction.
  // Falls back to the global activePauseFriction for web domains / categories (no token).
  private func isSoftBlockingEnabled(for token: ApplicationToken?) -> Bool {
    if let token,
       let source = SoftBlockingKeys.findBlockingSource(for: token, in: sharedDefaults) {
      switch source {
      case .schedule(_, let pauseFriction):
        return pauseFriction == SoftBlockingKeys.pauseFrictionNone
      case .global:
        break  // Global blocking defers to the legacy fallback below
      }
    }
    let pauseFriction = sharedDefaults?.string(forKey: SoftBlockingKeys.activePauseFriction)
      ?? SoftBlockingKeys.pauseFrictionNone
    return pauseFriction == SoftBlockingKeys.pauseFrictionNone
  }

  // Handle soft unlock with exponential delay
  private func handleSoftUnlock(applicationToken: ApplicationToken?, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    // If soft blocking is not enabled for this app (strict / password mode), just notify and defer
    guard isSoftBlockingEnabled(for: applicationToken) else {
      sendLocalNotification()
      completionHandler(.defer)
      return
    }

    // If we're already waiting for a previous unlock attempt, check for stale state first.
    // If the extension was killed mid-delay, isWaitingForUnlock can be stuck as true indefinitely.
    let isWaiting = sharedDefaults?.bool(forKey: SoftBlockingKeys.isWaitingForUnlock) ?? false
    if isWaiting {
      let waitEnd = sharedDefaults?.double(forKey: SoftBlockingKeys.unlockWaitEndTime) ?? 0
      if Date().timeIntervalSince1970 > waitEnd + 5 {
        // Stale flag — extension was killed before the delay fired. Clear and allow retry.
        sharedDefaults?.set(false, forKey: SoftBlockingKeys.isWaitingForUnlock)
        sharedDefaults?.removeObject(forKey: SoftBlockingKeys.unlockWaitEndTime)
        sharedDefaults?.synchronize()
      } else {
        completionHandler(.defer)
        return
      }
    }

    let delay = SoftBlockingKeys.currentUnlockDelay(using: sharedDefaults)
    let unlockTriggerTime = Date().addingTimeInterval(TimeInterval(delay))

    // Mark that we're waiting for the unlock to occur
    sharedDefaults?.set(true, forKey: SoftBlockingKeys.isWaitingForUnlock)
    sharedDefaults?.set(unlockTriggerTime.timeIntervalSince1970,
                        forKey: SoftBlockingKeys.unlockWaitEndTime)
    sharedDefaults?.synchronize()

    scheduleUnlockTrigger(afterSeconds: delay, triggerTime: unlockTriggerTime)

    completionHandler(.defer)

    // Send notification about the delay
    sendDelayNotification(delaySeconds: delay)
  }

  /**
    - DeviceActivitySchedule enforces a minimum interval duration (15 min) (iOS 17.4+)
    - To satisfy this, while keeping intervalEnd precise, we backward-anchor the window: intervalStart is set to
  **/
  private func scheduleUnlockTrigger(afterSeconds delay: Int, triggerTime: Date) {
    // Anchor intervalStart 15 min before triggerTime so the interval is valid and
    // intervalEnd still fires precisely at now + delay.
    let startTime = triggerTime.addingTimeInterval(-SoftBlockingKeys.softUnlockScheduleMinimumDuration)
    let schedule = DeviceActivitySchedule(
      intervalStart: DateComponents(
        hour: Calendar.current.component(.hour, from: startTime),
        minute: Calendar.current.component(.minute, from: startTime),
        second: Calendar.current.component(.second, from: startTime)
      ),
      intervalEnd: DateComponents(
        hour: Calendar.current.component(.hour, from: triggerTime),
        minute: Calendar.current.component(.minute, from: triggerTime),
        second: Calendar.current.component(.second, from: triggerTime)
      ),
      repeats: false
    )

    let center = DeviceActivityCenter()
    let activityName = DeviceActivityName("soft_unlock_trigger")

    try? center.stopMonitoring([activityName])

    do {
      try center.startMonitoring(activityName, during: schedule)
      print("[SoftBlocking] Scheduled unlock trigger: 15-min window ending in \(delay)s")
    } catch {
      // Fallback: if scheduling fails, clear the waiting flag so the user isn't locked out
      print("[SoftBlocking] Failed to schedule unlock trigger: \(error.localizedDescription). Clearing wait flag.")
      sharedDefaults?.set(false, forKey: SoftBlockingKeys.isWaitingForUnlock)
      sharedDefaults?.removeObject(forKey: SoftBlockingKeys.unlockWaitEndTime)
      sharedDefaults?.synchronize()
    }
  }

  private func sendDelayNotification(delaySeconds: Int) {
    let content = UNMutableNotificationContent()
    content.title = "waiting_to_unlock".localize
    content.body = String(format: "unlock_delay_message".localize, delaySeconds)
    content.sound = .default

    let request = UNNotificationRequest(
      identifier: "SoftBlockingDelay",
      content: content,
      trigger: nil
    )

    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        print("[SoftBlocking] Failed to send delay notification: \(error.localizedDescription)")
      }
    }
  }

  // Sends a local notification to the user with an action to open the FocusBear app.
  private func sendLocalNotification() {
    let content = UNMutableNotificationContent()
    content.title = String(format: "open_focusbear".localize )
    content.body =  String(format: "tap_to_return_app".localize )
    content.sound = .default
    content.userInfo = ["customData": "focusBearAppOpen"]

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)

    let request = UNNotificationRequest(identifier: "FocusBearNotification", content: content, trigger: trigger)
    UNUserNotificationCenter.current().add(request) { error in
      if let error = error {
        print("Failed to schedule notification: \(error.localizedDescription)")
      } else {
        print("Notification scheduled successfully")
      }
    }
  }
}
