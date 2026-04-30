//
//  SoftBlockingKeys.swift
//

import Foundation
import FamilyControls
import DeviceActivity
import ManagedSettings

// Identifies which blocking source is responsible for blocking a specific app.
// Schedules take priority over global blocking.
enum BlockingSource {
    case schedule(name: String, pauseFriction: String)
    case global
}

struct ScheduleShieldInfo: Codable {
    let id: String
    let name: String
    let pauseFriction: String
    let selectionData: Data
}

struct SoftBlockingKeys {
    static let unlockAttemptCount = "FocusBear_UnlockAttemptCount"
    static let lastUnlockAttemptDate = "FocusBear_LastUnlockAttemptDate"
    static let unlockDurationMinutes = "FocusBear_UnlockDurationMinutes"
    static let unlockDurationSeconds = "FocusBear_UnlockDurationSeconds"
    static let isWaitingForUnlock = "FocusBear_IsWaitingForUnlock"
    static let unlockWaitEndTime = "FocusBear_UnlockWaitEndTime"
    static let activePauseFriction = "FocusBear_ActivePauseFriction"
    static let scheduleShieldInfos = "FocusBear_ScheduleShieldInfos"
    static let temporaryUnlockEndTime = "FocusBear_TemporaryUnlockEndTime"
    static let reblockScheduleFailed = "FocusBear_ReblockScheduleFailed"
    static let superStrictMode = "FocusBear_IsFocusSuperStrictMode"

    static let pauseBaseDelaySeconds = "FocusBear_PauseBaseDelaySeconds"
    static let defaultUnlockDuration = 5 * 60 // seconds
    static let defaultPauseBaseDelaySeconds = 5
    static let pauseDelayStepCount = 5

    static let pauseFrictionNone = "none"
    static let pauseFrictionPassword = "password"

    static let softUnlockScheduleMinimumDuration: TimeInterval = 15 * 60

    /**
        base * 2^i for i in 0..<stepCount
    **/
    static func generateDelays(base: Int, stepCount: Int = pauseDelayStepCount) -> [Int] {
        (0..<stepCount).map { i in base * (1 << i) }  
    }

    static func currentUnlockDelay(using defaults: UserDefaults?) -> Int {
        let storedBase = defaults?.integer(forKey: pauseBaseDelaySeconds) ?? 0
        let base = storedBase > 0 ? storedBase : defaultPauseBaseDelaySeconds
        let delays = generateDelays(base: base)

        let attemptCount = defaults?.integer(forKey: unlockAttemptCount) ?? 0

        // Reset attempt count if it's a new day
        if let lastAttemptDate = defaults?.object(forKey: lastUnlockAttemptDate) as? Date,
           !Calendar.current.isDateInToday(lastAttemptDate) {
            defaults?.set(0, forKey: unlockAttemptCount)
            return delays[0]
        }

        let index = min(attemptCount, delays.count - 1)
        return delays[index]
    }


    /**
        - Determines which blocking source owns the given app token.
        - Active schedules take priority over global blocking.
        - When an app belongs to multiple active schedules the infos array order -> determines priority (BlockingScheduleManager sorts by id).
    **/
    static func findBlockingSource(for token: ApplicationToken, in defaults: UserDefaults?) -> BlockingSource? {
        // Check active schedules first
        if let data = defaults?.data(forKey: scheduleShieldInfos),
           let infos = try? JSONDecoder().decode([ScheduleShieldInfo].self, from: data) {
            for info in infos {
                if let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: info.selectionData),
                   selection.applicationTokens.contains(token) {
                    return .schedule(name: info.name, pauseFriction: info.pauseFriction)
                }
            }
        }

        // Fall back to global habit blocking
        let isGlobalEnabled: Bool
        if defaults?.object(forKey: "FocusBear_GlobalHabitBlockingEnabled") == nil {
            isGlobalEnabled = true
        } else {
            isGlobalEnabled = defaults?.bool(forKey: "FocusBear_GlobalHabitBlockingEnabled") ?? true
        }

        if isGlobalEnabled,
           let globalData = defaults?.data(forKey: "FocusBear_GlobalHabitBlockingSelection"),
           let globalSelection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: globalData),
           globalSelection.applicationTokens.contains(token) {
            return .global
        }

        return nil
    }
}
