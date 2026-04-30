//
//  BlockingScheduleManager.swift
//  FocusBear
//
//  Central coordinator that persists blocking schedules, registers
//  DeviceActivity monitoring, and keeps ManagedSettings shields in sync with
//  the currently active set of schedules.
//

import DeviceActivity
import FamilyControls
import Foundation
import UserNotifications

extension Notification.Name {
    static let blockingScheduleStatusDidChange = Notification.Name(
        "BlockingScheduleStatusDidChange")
}

struct BlockingSchedule: Codable, Equatable {
    struct Interval: Codable, Equatable {
        var startHour: Int
        var startMinute: Int
        var endHour: Int
        var endMinute: Int

        var starts: DateComponents {
            DateComponents(hour: startHour, minute: startMinute)
        }

        var ends: DateComponents {
            DateComponents(hour: endHour, minute: endMinute)
        }

        private var startTotalMinutes: Int {
            startHour * 60 + startMinute
        }

        private var endTotalMinutes: Int {
            endHour * 60 + endMinute
        }

        var spansMidnight: Bool {
            endTotalMinutes <= startTotalMinutes
        }

        func contains(
            _ date: Date, calendar: Calendar = Calendar.current, allowedDays: [String] = []
        ) -> Bool {
            // If daysOfWeek is empty or contains "ALL", allow all days
            // Otherwise, check if the date's weekday is in the allowed days
            if !allowedDays.isEmpty && !allowedDays.contains("ALL") {
                let weekday = calendar.component(.weekday, from: date)
                let dayMapping: [Int: String] = [
                    1: "SUN", 2: "MON", 3: "TUE", 4: "WED", 5: "THU", 6: "FRI", 7: "SAT",
                ]
                guard let dayCode = dayMapping[weekday], allowedDays.contains(dayCode) else {
                    return false
                }
            }

            let components = calendar.dateComponents([.hour, .minute], from: date)
            guard let hour = components.hour, let minute = components.minute else {
                return false
            }

            let totalMinutes = hour * 60 + minute

            if spansMidnight {
                return totalMinutes >= startTotalMinutes || totalMinutes < endTotalMinutes
            }

            return totalMinutes >= startTotalMinutes && totalMinutes < endTotalMinutes
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case interval
        case selectionData
        case daysOfWeek
        case blockingMode
        case type
        case focusModeId
        case isAiBlockingEnabled
        case pauseFriction
    }

    let id: String
    var name: String
    var interval: Interval
    var selectionData: Data?
    var daysOfWeek: [String]  // Array of day codes: ["MON", "TUE", "WED", etc.] or [] for all days
    var blockingMode: String?  // "gentle" (default) | "strict"
    var type: String?  // "habit" | "custom" (legacy schedules default to nil)
    var focusModeId: String?
    var isAiBlockingEnabled: Bool
    var pauseFriction: String

    var activityName: DeviceActivityName {
        DeviceActivityName("blocking_schedule_\(id)")
    }

    func deviceActivitySchedule() -> DeviceActivitySchedule {
        // DeviceActivitySchedule repeats daily, but we filter by daysOfWeek in contains()
        // This ensures the schedule is monitored every day, but only applies on selected days
        return DeviceActivitySchedule(
            intervalStart: interval.starts,
            intervalEnd: interval.ends,
            repeats: true
        )
    }

    func decodedSelection() -> FamilyActivitySelection? {
        guard let selectionData else { return nil }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: selectionData)
    }
}

extension BlockingSchedule {
    struct Payload: Codable {
        struct IntervalPayload: Codable {
            var startHour: Int
            var startMinute: Int
            var endHour: Int
            var endMinute: Int
        }

        var id: String
        var name: String
        var interval: IntervalPayload
        var selectionData: Data?
        var daysOfWeek: [String]?
        var blockingMode: String?
        var type: String?
        var focusModeId: String?
        var isAiBlockingEnabled: Bool?
        var pauseFriction: String?

        func toSchedule() -> BlockingSchedule {
            BlockingSchedule(
                id: id,
                name: name,
                interval: BlockingSchedule.Interval(
                    startHour: interval.startHour,
                    startMinute: interval.startMinute,
                    endHour: interval.endHour,
                    endMinute: interval.endMinute
                ),
                selectionData: selectionData,
                daysOfWeek: daysOfWeek ?? [],
                blockingMode: blockingMode,
                type: type,
                focusModeId: focusModeId,
                isAiBlockingEnabled: isAiBlockingEnabled ?? false,
                pauseFriction: pauseFriction ?? "none"
            )
        }
    }
}

enum BlockingScheduleError: Error {
    case scheduleNotFound
    case invalidPayload
}

final class BlockingScheduleManager {
    static let shared = BlockingScheduleManager()

    private let defaults = UserDefaults(suiteName: "group.com.FocusBear")
    private let storageKey = "FocusBear_BlockingSchedules"
    private let globalHabitBlockingKey = "FocusBear_GlobalHabitBlockingSelection"
    private let pauseUntilKey = "FocusBear_BlockingSchedulesPauseUntil"
    private let pauseIndefiniteKey = "FocusBear_BlockingSchedulesPauseIndefinite"
    private let useGlobalBlockListKey = "FocusBear_UseGlobalBlockList"
    private let workQueue = DispatchQueue(label: "com.focusbear.blockingschedule.manager")
    private var schedules: [String: BlockingSchedule] = [:]
    private var activeScheduleIDs: Set<String> = []
    private let controlModel = ControlModel.shared
    private var lastStatusSignature = BlockingStatusSignature()

    private enum PauseState: CustomStringConvertible, Equatable {
        case none
        case until(Date)
        case indefinite

        var description: String {
            switch self {
            case .none:
                return "none"
            case .until(let date):
                return "until \(date)"
            case .indefinite:
                return "indefinite"
            }
        }
    }

    private var pausedUntilTimestamp: TimeInterval? {
        get {
            guard let defaults, defaults.object(forKey: pauseUntilKey) != nil else { return nil }
            return defaults.double(forKey: pauseUntilKey)
        }
        set {
            if let value = newValue {
                defaults?.set(value, forKey: pauseUntilKey)
            } else {
                defaults?.removeObject(forKey: pauseUntilKey)
            }
        }
    }

    private var isPausedIndefinitely: Bool {
        get { defaults?.bool(forKey: pauseIndefiniteKey) ?? false }
        set { defaults?.set(newValue, forKey: pauseIndefiniteKey) }
    }

    private struct BlockingStatusSignature: Equatable {
        var activeScheduleIDs: Set<String> = []
        var pauseState: PauseState = .none
        var hasGlobalSelection: Bool = false
        var isInSoftUnlockPeriod: Bool = false
    }

    private struct BlockingStatusSummary {
        var isScheduleBlocking: Bool
        var activeScheduleIDs: Set<String>
        var activeScheduleNames: [String]
        var pauseState: PauseState
        var hasGlobalSelection: Bool
        var pauseUntil: Date?
        var totalApplications: Int
        var temporaryUnlockEndTime: Double?

        func toDictionary() -> [String: Any] {
            var dictionary: [String: Any] = [
                "isScheduleBlocking": isScheduleBlocking,
                "activeScheduleIds": Array(activeScheduleIDs),
                "activeScheduleNames": activeScheduleNames,
                "activeScheduleCount": activeScheduleNames.count,
                "hasGlobalSelection": hasGlobalSelection,
                "totalApplications": totalApplications,
                "temporaryUnlockEndTime": temporaryUnlockEndTime.map { NSNumber(value: $0) } ?? NSNull(),
            ]

            switch pauseState {
            case .none:
                dictionary["isPaused"] = false
                dictionary["pauseState"] = "none"
                dictionary["pauseUntil"] = NSNull()
            case .until(let date):
                dictionary["isPaused"] = true
                dictionary["pauseState"] = "until"
                dictionary["pauseUntil"] = date.timeIntervalSince1970
            case .indefinite:
                dictionary["isPaused"] = true
                dictionary["pauseState"] = "indefinite"
                dictionary["pauseUntil"] = NSNull()
            }

            return dictionary
        }
    }

    struct HabitWindowDefinition {
        var id: String
        var name: String
        var interval: BlockingSchedule.Interval
        var daysOfWeek: [String]
        var blockingMode: String?
    }

    private func pauseStateLocked(referenceDate: Date = Date()) -> PauseState {
        if isPausedIndefinitely {
            return .indefinite
        }

        if let timestamp = pausedUntilTimestamp {
            let date = Date(timeIntervalSince1970: timestamp)
            if referenceDate < date {
                return .until(date)
            }
            pausedUntilTimestamp = nil
        }

        return .none
    }

    private func setPauseStateLocked(until date: Date?) {
        if let date {
            pausedUntilTimestamp = date.timeIntervalSince1970
            isPausedIndefinitely = false
        } else {
            pausedUntilTimestamp = nil
            isPausedIndefinitely = true
        }
    }

    private func clearPauseLocked() {
        pausedUntilTimestamp = nil
        isPausedIndefinitely = false
    }

    private func currentBlockingStatusSummaryLocked() -> BlockingStatusSummary {
        let pauseState = pauseStateLocked()
        let globalSelection = getGlobalHabitBlockingSelection()
        let hasGlobalSelection = isGlobalHabitBlockingEnabled && (globalSelection != nil)

        // Compute effective active IDs based on current time, not just stored activeScheduleIDs
        // This ensures we get accurate status even if DeviceActivity callbacks haven't fired yet
        let now = Date()
        let (effectiveIDs, _) = computeEffectiveIDsLocked(referenceDate: now)

        let activeSchedules = effectiveIDs.compactMap { schedules[$0] }
        let selections = selectionsLocked(for: effectiveIDs, includeGlobalWhenNoSchedule: false)
        let totalApps = selections.reduce(0) { $0 + $1.applicationTokens.count }

        let isBlocking = !activeSchedules.isEmpty && pauseState == .none
        let pauseUntil: Date?
        if case .until(let date) = pauseState {
            pauseUntil = date
        } else {
            pauseUntil = nil
        }

        let rawUnlockEndTime = defaults?.object(forKey: SoftBlockingKeys.temporaryUnlockEndTime) as? Double
        let activeUnlockEndTime: Double? = rawUnlockEndTime.flatMap { $0 > now.timeIntervalSince1970 ? $0 : nil }

        return BlockingStatusSummary(
            isScheduleBlocking: isBlocking,
            activeScheduleIDs: effectiveIDs,
            activeScheduleNames: activeSchedules.map { $0.name },
            pauseState: pauseState,
            hasGlobalSelection: hasGlobalSelection,
            pauseUntil: pauseUntil,
            totalApplications: totalApps,
            temporaryUnlockEndTime: activeUnlockEndTime
        )
    }

    func currentBlockingStatusSummary() -> [String: Any] {
        workQueue.sync {
            currentBlockingStatusSummaryLocked().toDictionary()
        }
    }

    func notifyBlockingStatusChanged() {
        workQueue.sync {
            notifyBlockingStatusChangedLocked()
        }
    }

    private func notifyBlockingStatusChangedLocked(force: Bool = false) {
        let summary = currentBlockingStatusSummaryLocked()
        let signature = BlockingStatusSignature(
            activeScheduleIDs: summary.activeScheduleIDs,
            pauseState: summary.pauseState,
            hasGlobalSelection: summary.hasGlobalSelection,
            isInSoftUnlockPeriod: summary.temporaryUnlockEndTime != nil
        )

        if !force, signature == lastStatusSignature {
            return
        }

        lastStatusSignature = signature

        NotificationCenter.default.post(
            name: .blockingScheduleStatusDidChange,
            object: nil,
            userInfo: ["summary": summary.toDictionary()]
        )
    }

    // Global habit blocking selection (applies to all habit blocks)
    private var globalHabitBlockingSelection: Data? {
        get {
            defaults?.data(forKey: globalHabitBlockingKey)
        }
        set {
            defaults?.set(newValue, forKey: globalHabitBlockingKey)
        }
    }

    var isGlobalHabitBlockingEnabled: Bool {
        get {
            // Default enabled if not set (UserDefaults bool(forKey:) returns false when missing)
            if defaults?.object(forKey: "FocusBear_GlobalHabitBlockingEnabled") == nil {
                return true
            }
            return defaults?.bool(forKey: "FocusBear_GlobalHabitBlockingEnabled") ?? true
        }
        set {
            defaults?.set(newValue, forKey: "FocusBear_GlobalHabitBlockingEnabled")
            // Reapply shields when enabling or disabling to reflect the change
            applyCurrentShieldsLocked()
        }
    }

    func setCurrentUseGlobalBlockList(_ useGlobal: Bool) {
        print("[BlockingSchedule] setCurrentUseGlobalBlockList called with useGlobal: \(useGlobal)")
        defaults?.set(useGlobal, forKey: useGlobalBlockListKey)
    }

    private init() {
        loadPersistedSchedules()
    }

    // MARK: - Public API

    func reload() {
        workQueue.sync {
            loadPersistedSchedules()
        }
    }

    func addOrUpdateSchedules(_ newSchedules: [BlockingSchedule]) throws {
        guard !newSchedules.isEmpty else { return }

        try workQueue.sync {
            let center = DeviceActivityCenter()
            let now = Date()
            var shouldReapplyShields = false

            print(
                "[BlockingSchedule] addOrUpdateSchedules incoming IDs: \(newSchedules.map { $0.id })"
            )

            for schedule in newSchedules {
                if let existing = schedules[schedule.id] {
                    print("[BlockingSchedule] Updating existing schedule \(schedule.id)")
                    do {
                        try center.stopMonitoring([existing.activityName])
                    } catch {
                        print(
                            "[BlockingSchedule] Failed to stop monitoring \(existing.id): \(error)"
                        )
                    }
                }

                // Preserve existing selectionData when updating a schedule
                // The payload doesn't include selectionData, so we need to keep the existing one
                var scheduleToStore = schedule
                if let existing = schedules[schedule.id],
                    let existingSelectionData = existing.selectionData
                {
                    if schedule.selectionData == nil {
                        print(
                            "[BlockingSchedule] Preserving existing selectionData for schedule \(schedule.id)"
                        )
                        scheduleToStore.selectionData = existingSelectionData
                    } else {
                        print(
                            "[BlockingSchedule] New schedule has selectionData, using it for schedule \(schedule.id)"
                        )
                    }
                }

                schedules[schedule.id] = scheduleToStore

                do {
                    try center.startMonitoring(
                        schedule.activityName, during: schedule.deviceActivitySchedule())
                    print(
                        "[BlockingSchedule] Registered/updated schedule \(schedule.id) → \(schedule.interval)"
                    )
                } catch {
                    print(
                        "[BlockingSchedule] Failed to start monitoring \(schedule.id): \(error)"
                    )
                    throw error
                }

                if schedule.interval.contains(now, allowedDays: schedule.daysOfWeek) {
                    print(
                        "[BlockingSchedule] Schedule \(schedule.id) active at current time – marking active"
                    )
                    activeScheduleIDs.insert(schedule.id)
                    shouldReapplyShields = true
                } else if activeScheduleIDs.remove(schedule.id) != nil {
                    print(
                        "[BlockingSchedule] Schedule \(schedule.id) removed from active set (no longer current)"
                    )
                    shouldReapplyShields = true
                }
            }

            persistSchedules()

            if shouldReapplyShields {
                print("[BlockingSchedule] Reapplying shields after schedule update")
                applyCurrentShieldsLocked()
            } else {
                notifyBlockingStatusChangedLocked(force: true)
            }
        }
    }

    func upsertHabitSchedules(_ windows: [HabitWindowDefinition]) throws {
        let newSchedules: [BlockingSchedule] = windows.map { window in
            BlockingSchedule(
                id: window.id,
                name: window.name,
                interval: window.interval,
                selectionData: nil,
                daysOfWeek: window.daysOfWeek,
                blockingMode: window.blockingMode ?? "strict",
                type: "habit",
                focusModeId: nil,
                isAiBlockingEnabled: false,
                pauseFriction: "none"
            )
        }

        let newIDs = Set(newSchedules.map { $0.id })
        let existingHabitIDs = workQueue.sync {
            Set(schedules.filter { $0.value.type == "habit" }.map { $0.key })
        }

        let idsToRemove = existingHabitIDs.subtracting(newIDs)

        if !idsToRemove.isEmpty {
            try workQueue.sync {
                let center = DeviceActivityCenter()
                var shouldReapply = false
                for id in idsToRemove {
                    if let schedule = schedules[id] {
                        do {
                            try center.stopMonitoring([schedule.activityName])
                            print("[BlockingSchedule] Removed habit schedule monitoring for \(id)")
                        } catch {
                            print(
                                "[BlockingSchedule] Failed to stop monitoring habit schedule \(id): \(error)"
                            )
                        }
                        schedules.removeValue(forKey: id)
                        if activeScheduleIDs.remove(id) != nil {
                            shouldReapply = true
                        }
                    }
                }
                persistSchedules()
                if shouldReapply {
                    applyCurrentShieldsLocked()
                } else {
                    notifyBlockingStatusChangedLocked(force: true)
                }
            }
        }

        if !newSchedules.isEmpty {
            try addOrUpdateSchedules(newSchedules)
        } else if idsToRemove.isEmpty {
            workQueue.sync {
                notifyBlockingStatusChangedLocked(force: true)
            }
        }
    }

    func assignSelectionData(_ data: Data, to scheduleId: String) throws {
        try workQueue.sync {
            guard var schedule = schedules[scheduleId] else {
                print(
                    "[BlockingSchedule] ERROR: Schedule \(scheduleId) not found in schedules dictionary"
                )
                print(
                    "[BlockingSchedule] Available schedule IDs: \(schedules.keys.joined(separator: ", "))"
                )
                throw BlockingScheduleError.scheduleNotFound
            }

            print(
                "[BlockingSchedule] Assigning selection data to schedule \(scheduleId), data size: \(data.count) bytes"
            )
            schedule.selectionData = data
            schedules[scheduleId] = schedule
            persistSchedules()

            // Verify the selection was decoded correctly
            if let decoded = schedule.decodedSelection() {
                print(
                    "[BlockingSchedule] Decoded selection: apps=\(decoded.applicationTokens.count), categories=\(decoded.categoryTokens.count), webDomains=\(decoded.webDomainTokens.count)"
                )
            } else {
                print(
                    "[BlockingSchedule] WARNING: Could not decode selection data for schedule \(scheduleId)"
                )
            }

            if activeScheduleIDs.contains(scheduleId) {
                let count = schedule.decodedSelection()?.applicationTokens.count ?? 0
                print(
                    "[BlockingSchedule] Updated selection for active schedule \(scheduleId); app tokens: \(count)"
                )
                applyCurrentShieldsLocked()
            } else {
                print("[BlockingSchedule] Stored selection for inactive schedule \(scheduleId)")
            }
        }
    }

    func startScheduleNow(scheduleId: String) throws {
        try workQueue.sync {
            guard schedules[scheduleId] != nil else {
                throw BlockingScheduleError.scheduleNotFound
            }

            print("[BlockingSchedule] startScheduleNow forcing schedule \(scheduleId) active")
            activeScheduleIDs.insert(scheduleId)
            applyCurrentShieldsLocked()
        }
    }

    func pauseActiveSchedules(until date: Date?, reason: String? = nil) {
        workQueue.sync {
            setPauseStateLocked(until: date)
            ControlModel.isBlockingEnabled = false

            if let pauseDate = date {
                print(
                    "[BlockingSchedule] Pausing schedule blocking until \(pauseDate) (reason: \(reason ?? "none"))"
                )
            } else {
                print(
                    "[BlockingSchedule] Pausing schedule blocking indefinitely (reason: \(reason ?? "none"))"
                )
            }

            controlModel.store.clearAllSettings()
            notifyBlockingStatusChangedLocked(force: true)
        }
    }

    func resumePausedSchedules() {
        workQueue.sync {
            let state = pauseStateLocked()
            var shouldEnableBlocking = true

            switch state {
            case .none:
                print("[BlockingSchedule] resumePausedSchedules called with no active pause state")
                shouldEnableBlocking = false
            case .until(let date):
                print("[BlockingSchedule] Resuming schedule blocking; previous pause until \(date)")
                clearPauseLocked()
            case .indefinite:
                print("[BlockingSchedule] Resuming schedule blocking from indefinite pause")
                clearPauseLocked()
            }

            if shouldEnableBlocking {
                ControlModel.isBlockingEnabled = true
            }
            applyCurrentShieldsLocked()
        }
    }

    func allSchedules() -> [[String: Any]] {
        workQueue.sync {
            schedules.values.map { schedule in
                let startLabel = String(
                    format: "%02d:%02d", schedule.interval.startHour,
                    schedule.interval.startMinute)
                let endLabel = String(
                    format: "%02d:%02d", schedule.interval.endHour, schedule.interval.endMinute)
                let selection = schedule.decodedSelection()
                let applicationsCount = selection?.applicationTokens.count ?? 0
                let categoriesCount = selection?.categoryTokens.count ?? 0
                let webDomainsCount = selection?.webDomainTokens.count ?? 0
                var result: [String: Any] = [
                    "id": schedule.id,
                    "name": schedule.name,
                    "startHour": schedule.interval.startHour,
                    "startMinute": schedule.interval.startMinute,
                    "endHour": schedule.interval.endHour,
                    "endMinute": schedule.interval.endMinute,
                    "startLabel": startLabel,
                    "endLabel": endLabel,
                    "isActive": activeScheduleIDs.contains(schedule.id),
                    "hasSelection": schedule.selectionData != nil,
                    "selectedApplicationsCount": applicationsCount,
                    "selectedCategoriesCount": categoriesCount,
                    "selectedWebDomainsCount": webDomainsCount,
                    "daysOfWeek": schedule.daysOfWeek,
                    "blockingMode": schedule.blockingMode ?? "gentle",
                    "type": schedule.type ?? NSNull(),
                    "isAiBlockingEnabled": schedule.isAiBlockingEnabled,
                    "pauseFriction": schedule.pauseFriction,
                ]
                if let focusModeId = schedule.focusModeId {
                    result["focusModeId"] = focusModeId
                }
                return result
            }
        }
    }

    func activateSchedule(for activityName: DeviceActivityName) {
        workQueue.sync {
            guard let scheduleId = scheduleId(for: activityName) else { return }
            print("[BlockingSchedule] Activating schedule: \(scheduleId)")
            if let schedule = schedules[scheduleId] {
                NativeBlockingLogger.info(
                    "schedule_activate id=\(scheduleId) name=\(schedule.name) type=\(schedule.type ?? "unknown") mode=\(schedule.blockingMode ?? "gentle")"
                )
            }
            activeScheduleIDs.insert(scheduleId)
            applyCurrentShieldsLocked()
        }
    }

    func selectionForSchedule(scheduleId: String) -> FamilyActivitySelection? {
        workQueue.sync {
            schedules[scheduleId]?.decodedSelection()
        }
    }

    func deactivateSchedule(for activityName: DeviceActivityName) {
        workQueue.sync {
            guard let scheduleId = scheduleId(for: activityName) else { return }
            print("[BlockingSchedule] Deactivating schedule: \(scheduleId)")
            NativeBlockingLogger.info("schedule_deactivate id=\(scheduleId)")
            activeScheduleIDs.remove(scheduleId)
            applyCurrentShieldsLocked()
        }
    }

    func clearAllSchedules() {
        workQueue.sync {
            let center = DeviceActivityCenter()

            // Stop monitoring all schedules
            for schedule in schedules.values {
                do {
                    try center.stopMonitoring([schedule.activityName])
                    print("[BlockingSchedule] Stopped monitoring schedule: \(schedule.id)")
                } catch {
                    print(
                        "[BlockingSchedule] Failed to stop monitoring \(schedule.id): \(error)")
                }
            }

            // Clear all data
            schedules.removeAll()
            activeScheduleIDs.removeAll()

            // Clear persisted data
            defaults?.removeObject(forKey: storageKey)
            defaults?.synchronize()

            // Clear shields
            controlModel.store.clearAllSettings()

            print("[BlockingSchedule] All schedules cleared")
            notifyBlockingStatusChangedLocked(force: true)
        }
    }

    func removeSchedule(withId id: String) throws {
        try workQueue.sync {
            guard let schedule = schedules[id] else {
                throw BlockingScheduleError.scheduleNotFound
            }

            let center = DeviceActivityCenter()
            do {
                try center.stopMonitoring([schedule.activityName])
            } catch {
                print(
                    "[BlockingSchedule] Failed to stop monitoring during removal for \(id): \(error)"
                )
            }

            schedules.removeValue(forKey: id)
            activeScheduleIDs.remove(id)
            persistSchedules()
            applyCurrentShieldsLocked()
            print("[BlockingSchedule] Removed schedule: \(id)")
        }
    }

    // MARK: - Helpers

    private func scheduleId(for activityName: DeviceActivityName) -> String? {
        let raw = activityName.rawValue
        let prefix = "blocking_schedule_"
        guard raw.hasPrefix(prefix) else { return nil }
        return String(raw.dropFirst(prefix.count))
    }

    private func loadPersistedSchedules() {
        guard let data = defaults?.data(forKey: storageKey) else {
            schedules = [:]
            return
        }

        do {
            let decoded = try JSONDecoder().decode([BlockingSchedule].self, from: data)
            schedules = Dictionary(uniqueKeysWithValues: decoded.map { ($0.id, $0) })
            print("[BlockingSchedule] Loaded \(schedules.count) persisted schedules")
        } catch {
            print("[BlockingSchedule] Failed to decode persisted schedules: \(error)")
            schedules = [:]
        }
    }

    private func persistSchedules() {
        do {
            let data = try JSONEncoder().encode(Array(schedules.values))
            defaults?.set(data, forKey: storageKey)
        } catch {
            print("[BlockingSchedule] Failed to persist schedules: \(error)")
        }
    }

    private func computeEffectiveIDsLocked(referenceDate: Date = Date()) -> (Set<String>, [String])
    {
        print("[BlockingSchedule] Computing effective active schedule IDs at \(referenceDate)")
        // Compute which schedules are actually active based on current time
        let timeBasedIDs = schedules.values.filter {
            $0.interval.contains(referenceDate, allowedDays: $0.daysOfWeek)
        }.map { $0.id }
        let timeBasedIDSet = Set(timeBasedIDs)

        // Update activeScheduleIDs to match time-based reality
        // This ensures the stored set stays in sync even if DeviceActivity callbacks are delayed
        let previousActiveIDs = activeScheduleIDs
        activeScheduleIDs = timeBasedIDSet

        print(
            "[BlockingSchedule] Schedules active based on time check: \(timeBasedIDs) (total: \(timeBasedIDs.count))"
        )
        print(
            "[BlockingSchedule] Previous activeScheduleIDs before sync: \(previousActiveIDs) (total: \(previousActiveIDs.count))"
        )
        print("[BlockingSchedule] Updated activeScheduleIDs after time check: \(activeScheduleIDs)")

        // Log sync changes
        let removedIDs = previousActiveIDs.subtracting(timeBasedIDSet)
        let addedIDs = timeBasedIDSet.subtracting(previousActiveIDs)
        if !removedIDs.isEmpty {
            print(
                "[BlockingSchedule] Syncing activeScheduleIDs: removed \(removedIDs.count) schedule(s) that are no longer active: \(removedIDs)"
            )
        }
        if !addedIDs.isEmpty {
            print(
                "[BlockingSchedule] Syncing activeScheduleIDs: added \(addedIDs.count) schedule(s) that are now active: \(addedIDs)"
            )
        }
        print(
            "[BlockingSchedule] Effective active schedule IDs after time check: \(activeScheduleIDs) (total: \(activeScheduleIDs.count))"
        )
        return (activeScheduleIDs, timeBasedIDs)
    }

    private func selectionsLocked(
        for effectiveIDs: Set<String>,
        includeGlobalWhenNoSchedule: Bool
    ) -> [FamilyActivitySelection] {
        var selections = effectiveIDs.compactMap { schedules[$0]?.decodedSelection() }

        let pauseState = pauseStateLocked()
        if case .none = pauseState {
            // keep selections as-is
        } else {
            if !selections.isEmpty {
                print(
                    "[BlockingSchedule] Schedule blocking paused (state: \(pauseState)) – ignoring \(selections.count) active schedule selection(s)"
                )
            }
            selections.removeAll()
        }

        let useGlobalBlockList = defaults?.bool(forKey: useGlobalBlockListKey) ?? false
        let shouldIncludeGlobal =
            isGlobalHabitBlockingEnabled
            && (
                useGlobalBlockList
                || (ControlModel.isBlockingEnabled && effectiveIDs.isEmpty && includeGlobalWhenNoSchedule)
            )

        print(
            "[BlockingSchedule] shouldIncludeGlobal check: isGlobalHabitBlockingEnabled=\(isGlobalHabitBlockingEnabled), useGlobalBlockList=\(useGlobalBlockList), effectiveIDs.isEmpty=\(effectiveIDs.isEmpty), includeGlobalWhenNoSchedule=\(includeGlobalWhenNoSchedule), ControlModel.isBlockingEnabled=\(ControlModel.isBlockingEnabled), shouldIncludeGlobal=\(shouldIncludeGlobal)"
        )

        NativeBlockingLogger.info(
            "shield_source_decision activeScheduleCount=\(effectiveIDs.count) includeGlobal=\(shouldIncludeGlobal) globalEnabled=\(isGlobalHabitBlockingEnabled) blockingEnabled=\(ControlModel.isBlockingEnabled) useGlobalBlockList=\(useGlobalBlockList)"
        )

        if shouldIncludeGlobal,
            let globalSelection = getGlobalHabitBlockingSelection(),
            !globalSelection.applicationTokens.isEmpty
                || !globalSelection.categoryTokens.isEmpty
                || !globalSelection.webDomainTokens.isEmpty
        {
            print(
                "[BlockingSchedule] Including global habit selection; apps: \(globalSelection.applicationTokens.count)"
            )
            selections.append(globalSelection)
        }

        return selections
    }

    private func aggregateSelections(_ selections: [FamilyActivitySelection])
        -> FamilyActivitySelection?
    {
        guard !selections.isEmpty else { return nil }

        var aggregated = FamilyActivitySelection()
        selections.forEach { selection in
            aggregated.applicationTokens.formUnion(selection.applicationTokens)
            aggregated.categoryTokens.formUnion(selection.categoryTokens)
            aggregated.webDomainTokens.formUnion(selection.webDomainTokens)
        }

        if aggregated.applicationTokens.isEmpty
            && aggregated.categoryTokens.isEmpty
            && aggregated.webDomainTokens.isEmpty
        {
            return nil
        }

        return aggregated
    }

    private func applyCurrentShieldsLocked() {
        let now = Date()

        // Check if we're in a temporary soft unlock period - if so, skip shield application
        if let unlockEndTime = defaults?.double(forKey: SoftBlockingKeys.temporaryUnlockEndTime) {
            if now.timeIntervalSince1970 < unlockEndTime {
                print("[BlockingSchedule] Currently in soft unlock period until \(Date(timeIntervalSince1970: unlockEndTime)), skipping shield application")
                return
            } else {
                // Clear expired unlock time
                defaults?.removeObject(forKey: SoftBlockingKeys.temporaryUnlockEndTime)
                defaults?.synchronize()
                print("[BlockingSchedule] Soft unlock period expired, proceeding with shield application")
            }
        }

        let pauseState = pauseStateLocked(referenceDate: now)

        switch pauseState {
        case .none:
            break
        case .until(let date):
            print(
                "[BlockingSchedule] Schedule blocking paused until \(date) – clearing shields and skipping reapply"
            )
            controlModel.store.clearAllSettings()
            notifyBlockingStatusChangedLocked()
            return
        case .indefinite:
            print(
                "[BlockingSchedule] Schedule blocking paused indefinitely – clearing shields and skipping reapply"
            )
            controlModel.store.clearAllSettings()
            notifyBlockingStatusChangedLocked()
            return
        }

        let (effectiveIDs, timeBasedIDs) = computeEffectiveIDsLocked(referenceDate: now)

        if !timeBasedIDs.isEmpty {
            print(
                "[BlockingSchedule] Time-based active schedules detected at \(now): \(timeBasedIDs)"
            )
        }

        let selections = selectionsLocked(for: effectiveIDs, includeGlobalWhenNoSchedule: true)
        guard !selections.isEmpty else {
            print("[BlockingSchedule] No active schedules – clearing shields")
            NativeBlockingLogger.info("shield_apply action=clear reason=no_active_selection")
            controlModel.store.clearAllSettings()
            updateActivePauseFriction(nil)
            updateScheduleShieldInfos([])
            notifyBlockingStatusChangedLocked()
            return
        }

        if let scheduleReason = activeScheduleBlockingReason(for: effectiveIDs) {
            _ = controlModel.prefs.setBlockDistractionReason(reason: scheduleReason)
        }

        let totalApps = selections.reduce(0) { $0 + $1.applicationTokens.count }
        print(
            "[BlockingSchedule] Applying shields for \(effectiveIDs.count) effective schedule(s); total apps: \(totalApps)"
        )

        // Build per-schedule shield infos for the shield extensions.
        // Sort by id for a stable, deterministic priority order when an app
        // belongs to multiple active schedules (schedule with lower id wins).
        let activeSchedules = effectiveIDs.compactMap { schedules[$0] }.sorted { $0.id < $1.id }
        let shieldInfos: [ScheduleShieldInfo] = activeSchedules.compactMap { schedule in
            guard let selectionData = schedule.selectionData else { return nil }
            return ScheduleShieldInfo(
                id: schedule.id,
                name: schedule.name,
                pauseFriction: schedule.pauseFriction,
                selectionData: selectionData
            )
        }
        updateScheduleShieldInfos(shieldInfos)

        // Keep activePauseFriction as a fallback for web-domain / category shields which can't do per-app lookups.
        let activePauseFriction = activeSchedules.first?.pauseFriction ?? "none"
        updateActivePauseFriction(activePauseFriction)

        NativeBlockingLogger.info(
            "shield_apply action=apply activeSchedules=\(effectiveIDs.count) totalApps=\(totalApps)"
        )
        controlModel.applySelections(selections)
        notifyBlockingStatusChangedLocked()
    }

    private func updateActivePauseFriction(_ pauseFriction: String?) {
        defaults?.set(pauseFriction, forKey: SoftBlockingKeys.activePauseFriction)
        defaults?.synchronize()
        print("[BlockingSchedule] Updated active pauseFriction to: \(pauseFriction ?? "nil")")
    }

    private func updateScheduleShieldInfos(_ infos: [ScheduleShieldInfo]) {
        if let data = try? JSONEncoder().encode(infos) {
            defaults?.set(data, forKey: SoftBlockingKeys.scheduleShieldInfos)
        } else {
            defaults?.removeObject(forKey: SoftBlockingKeys.scheduleShieldInfos)
        }
        defaults?.synchronize()
        print("[BlockingSchedule] Updated schedule shield infos: \(infos.count) schedule(s)")
    }

    private func activeScheduleBlockingReason(for effectiveIDs: Set<String>) -> String? {
        let activeNames =
            effectiveIDs
            .compactMap { schedules[$0]?.name }
            .filter { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
            .sorted()

        guard let firstName = activeNames.first else {
            return nil
        }

        return "Blocking enabled: \(firstName)"
    }

    func aggregatedSelectionForImmediateBlocking() -> FamilyActivitySelection? {
        workQueue.sync {
            let (effectiveIDs, _) = computeEffectiveIDsLocked()
            let selections = selectionsLocked(for: effectiveIDs, includeGlobalWhenNoSchedule: false)
            return aggregateSelections(selections)
        }
    }

    func reapplyCurrentShields() {
        workQueue.sync {
            applyCurrentShieldsLocked()
        }
    }

    // This is used after a soft unlock expires to ensure all shields are correctly reapplied based on current active schedules
    func clearAndReapplyShields() {
        workQueue.sync {
            controlModel.store.clearAllSettings()
            applyCurrentShieldsLocked()
        }
    }

    // Performs a temporary app unlock after the soft-blocking delay has elapsed.
    func performTemporaryUnlock() {
        let storedMinutes = defaults?.integer(forKey: SoftBlockingKeys.unlockDurationMinutes) ?? 0
        let storedSeconds = defaults?.integer(forKey: SoftBlockingKeys.unlockDurationSeconds) ?? 0
        let totalSeconds = (storedMinutes * 60) + storedSeconds
        let unlockDurationSeconds = totalSeconds > 0 ? totalSeconds : SoftBlockingKeys.defaultUnlockDuration
        let unlockEndTime = Date().addingTimeInterval(TimeInterval(unlockDurationSeconds))

        defaults?.set(unlockEndTime.timeIntervalSince1970, forKey: SoftBlockingKeys.temporaryUnlockEndTime)
        defaults?.synchronize()

        // Clear shields temporarily
        workQueue.sync {
            controlModel.store.clearAllSettings()
        }

        // Schedule re-blocking after the unlock duration
        scheduleReblock(afterSeconds: unlockDurationSeconds)

        let mins = unlockDurationSeconds / 60
        let secs = unlockDurationSeconds % 60
        print("[SoftBlocking] Temporary unlock activated for \(mins)m \(secs)s")
    }

    private func scheduleReblock(afterSeconds seconds: Int) {
        print("[SoftBlocking] Scheduling re-block after \(seconds) seconds")

        let now = Date()
        let startTime = now.addingTimeInterval(-15 * 60)
        let endTime = now.addingTimeInterval(Double(seconds))

        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(
                hour: Calendar.current.component(.hour, from: startTime),
                minute: Calendar.current.component(.minute, from: startTime),
                second: Calendar.current.component(.second, from: startTime)
            ),
            intervalEnd: DateComponents(
                hour: Calendar.current.component(.hour, from: endTime),
                minute: Calendar.current.component(.minute, from: endTime),
                second: Calendar.current.component(.second, from: endTime)
            ),
            repeats: false
        )

        let center = DeviceActivityCenter()
        let activityName = DeviceActivityName("soft_unlock_reblock")

        try? center.stopMonitoring([activityName])

        do {
            try center.startMonitoring(activityName, during: schedule)
            print("[SoftBlocking] Successfully scheduled re-block for \(seconds) seconds")
        } catch {
            print("[SoftBlocking] Failed to schedule re-block: \(error.localizedDescription)")
            defaults?.removeObject(forKey: SoftBlockingKeys.temporaryUnlockEndTime)
            defaults?.set(true, forKey: SoftBlockingKeys.reblockScheduleFailed)
            defaults?.synchronize()
        }

        // Notify user when the unlock period is about to end
        scheduleUnlockEndNotification(afterSeconds: seconds)
    }

    private func scheduleUnlockEndNotification(afterSeconds seconds: Int) {
        let content = UNMutableNotificationContent()
        content.title = "unlock_period_ending".localize
        content.body = "blocking_will_resume".localize
        content.sound = .default
        content.userInfo = ["action": "reblock"]

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(seconds),
            repeats: false
        )

        let request = UNNotificationRequest(
            identifier: "SoftBlockingEnd",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("[SoftBlocking] Failed to schedule unlock end notification: \(error)")
            }
        }
    }

    // MARK: - Global Habit Blocking

    func getGlobalHabitBlockingSelection() -> FamilyActivitySelection? {
        guard let data = globalHabitBlockingSelection else { return nil }
        return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }

    func setGlobalHabitBlockingSelection(_ data: Data) {
        workQueue.sync {
            globalHabitBlockingSelection = data
            if isGlobalHabitBlockingEnabled {
                applyCurrentShieldsLocked()
            }
        }
    }

    func selectionForGlobalHabitBlocking() -> FamilyActivitySelection? {
        return getGlobalHabitBlockingSelection()
    }
}
