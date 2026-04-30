//
//  ShieldConfigurationExtension.swift
//  FocusShield
//
//  Created by Arindam HestaBit on 14/04/23.
//

import FamilyControls
import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

private func LineBreak(_ count: Int = 2) -> String {
    return String(repeating: "\n", count: count)
}

// Override the functions below to customize the shields used in various situations.
// The system provides a default appearance for any methods that your subclass doesn't override.
// Make sure that your class name matches the NSExtensionPrincipalClass in your Info.plist.
class ShieldConfigurationExtension: ShieldConfigurationDataSource {

    private let prefsBlockDistractionReasonKey = "focus-block-distraction-reason"
    private let prefsCustomBlockedMessageKey = "custom-blocked-message"
    private let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")
    private let focusBearIcon = UIImage(named: "ic-launcher-20.png")

    private func getRandomBlockedMessage() -> String {
        let messages = ["blockedMessage1".localize, "blockedMessage2".localize, "blockedMessage3".localize]
        return messages.randomElement() ?? "shield_title".localize
    }

    private func getMotivationalMessage() -> String {
        if let customMessage = sharedDefaults?.string(forKey: prefsCustomBlockedMessageKey),
           !customMessage.isEmpty {
            return customMessage
        }
        let messages = [
            "motivationalMessage1".localize,
            "motivationalMessage2".localize,
            "motivationalMessage3".localize,
            "motivationalMessage4".localize,
            "motivationalMessage5".localize,
        ]
        return messages.randomElement() ?? "shield_subtitle".localize
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
                break
            }
        }
        let pauseFriction = sharedDefaults?.string(forKey: SoftBlockingKeys.activePauseFriction)
            ?? SoftBlockingKeys.pauseFrictionNone
        return pauseFriction == SoftBlockingKeys.pauseFrictionNone
    }

    private func getPrimaryButtonlabel() -> ShieldConfiguration.Label {
        return .init(text: "block_app".localize, color: .black)
    }

    private func getUnlockDurationLabel() -> String {
        let storedMinutes = sharedDefaults?.integer(forKey: SoftBlockingKeys.unlockDurationMinutes) ?? 0
        let storedSeconds = sharedDefaults?.integer(forKey: SoftBlockingKeys.unlockDurationSeconds) ?? 0
        let totalSeconds = (storedMinutes * 60) + storedSeconds

        let effectiveSeconds = totalSeconds > 0 ? totalSeconds : SoftBlockingKeys.defaultUnlockDuration
        let mins = effectiveSeconds / 60
        let secs = effectiveSeconds % 60

        if mins > 0 && secs > 0 {
            return String(format: "unlock_for_mins_secs".localize, mins, secs)
        } else if mins > 0 {
            return String(format: "unlock_for_mins".localize, mins)
        } else {
            return String(format: "unlock_for_secs".localize, secs)
        }
    }

    private func isSuperStrictModeEnabled() -> Bool {
        sharedDefaults?.bool(forKey: SoftBlockingKeys.superStrictMode) ?? false
    }

    private func getSecondaryButtonLabel(for token: ApplicationToken?) -> ShieldConfiguration.Label? {
        guard isSoftBlockingEnabled(for: token) else { return nil }
        if isSuperStrictModeEnabled() { return nil }
        let isWaiting = sharedDefaults?.bool(forKey: SoftBlockingKeys.isWaitingForUnlock) ?? false
        if isWaiting { return nil }
        return .init(text: getUnlockDurationLabel(), color: .label)
    }

    // For apps: looks up the owning schedule (or global blocking) by application token.
    // For web domains / categories: falls back to the stored distraction-reason string.
    private func resolveBlockingReason(for token: ApplicationToken?) -> String {
        if let token,
           let source = SoftBlockingKeys.findBlockingSource(for: token, in: sharedDefaults) {
            switch source {
            case .schedule(let name, _):
                return String(format: "blocking_enabled_by_schedule".localize, name)
            case .global:
                return "blocked_globally".localize
            }
        }
        return sharedDefaults?.string(forKey: prefsBlockDistractionReasonKey) ?? "shield_subtitle".localize
    }

    private func buildSubtitle(reason: String, softBlockingEnabled: Bool) -> String {
        var parts: [String] = [reason, getMotivationalMessage()]
        if softBlockingEnabled && !isSuperStrictModeEnabled() {
            parts.append("exponential_delay_note".localize)
        }
        return "\n" + parts.joined(separator: LineBreak(3))
    }

    private func buildConfiguration(for token: ApplicationToken?) -> ShieldConfiguration {
        let softBlockingEnabled = isSoftBlockingEnabled(for: token)
        let reason = resolveBlockingReason(for: token)
        let subtitle = buildSubtitle(reason: reason, softBlockingEnabled: softBlockingEnabled)

        return ShieldConfiguration(
            icon: focusBearIcon,
            title: .init(text: getRandomBlockedMessage(), color: .label),
            subtitle: .init(text: subtitle, color: .label),
            primaryButtonLabel: getPrimaryButtonlabel(),
            primaryButtonBackgroundColor: .systemOrange,
            secondaryButtonLabel: getSecondaryButtonLabel(for: token)
        )
    }

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return buildConfiguration(for: application.token)
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return buildConfiguration(for: application.token)
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return buildConfiguration(for: nil)
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return buildConfiguration(for: nil)
    }
}
