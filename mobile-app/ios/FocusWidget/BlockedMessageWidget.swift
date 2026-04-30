//
//  BlockedMessageWidget.swift
//  FocusWidget
//

import WidgetKit
import SwiftUI

struct BlockedMessageProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> BlockedMessageEntry {
        BlockedMessageEntry(date: Date(), configuration: ConfigurationAppIntent(), message: "")
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> BlockedMessageEntry {
        makeEntry(date: Date(), configuration: configuration)
    }

    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<BlockedMessageEntry> {
        WidgetTimelineFactory.quarterHourly(configuration: configuration) { date, config in
            makeEntry(date: date, configuration: config)
        }
    }

    private static let motivationalQuoteKeys: [String] = [
        "motivationalMessage1",
        "motivationalMessage2",
        "motivationalMessage3",
        "motivationalMessage4",
        "motivationalMessage5",
    ]

    private func makeEntry(date: Date, configuration: ConfigurationAppIntent) -> BlockedMessageEntry {
        let defaults = UserDefaults(suiteName: WidgetTheme.appGroupSuiteName)
        let customMessage = defaults?.string(forKey: "custom-blocked-message") ?? ""

        let displayMessage: String
        if !customMessage.isEmpty {
            displayMessage = customMessage
        } else {
            let key = Self.motivationalQuoteKeys.randomElement() ?? "motivationalMessage1"
            displayMessage = key.localize
        }

        return BlockedMessageEntry(date: date, configuration: configuration, message: displayMessage)
    }
}

struct BlockedMessageEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let message: String
}

struct BlockedMessageWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    @Environment(\.colorScheme) var colorScheme
    var entry: BlockedMessageEntry

    private var displayMessage: String {
        entry.message
    }

    var body: some View {
        Group {
            switch widgetFamily {
            case .systemSmall:
                smallLayout
            default:
                mediumLayout
            }
        }
    }

    private var mediumLayout: some View {
        HStack(spacing: 14) {
            Image("FocusBearIcon")
                .resizable()
                .scaledToFit()
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(WidgetTheme.amber.opacity(0.15))
                        .frame(width: 50, height: 50)
                )
                .padding(.leading, 4)

            Text(displayMessage)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(WidgetTheme.primaryText(for: colorScheme))
                .multilineTextAlignment(.leading)
                .lineLimit(4)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 12)
    }

    private var smallLayout: some View {
        VStack(spacing: 8) {
            Image("FocusBearIcon")
                .resizable()
                .scaledToFit()
                .frame(width: 32, height: 32)
                .background(
                    Circle()
                        .fill(WidgetTheme.amber.opacity(0.15))
                        .frame(width: 42, height: 42)
                )
                .padding(.top, 4)

            Text(displayMessage)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(WidgetTheme.primaryText(for: colorScheme))
                .multilineTextAlignment(.center)
                .lineLimit(4)
                .frame(maxWidth: .infinity)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
    }
}

struct BlockedMessageWidget: Widget {
    let kind: String = "BlockedMessageWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: BlockedMessageProvider()) { entry in
            BlockedMessageWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    PlainWidgetBackground()
                }
        }
        .configurationDisplayName("blocked_message_title".localize)
        .description("blocked_message_widget_description".localize)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemMedium) {
    BlockedMessageWidget()
} timeline: {
    BlockedMessageEntry(date: .now, configuration: ConfigurationAppIntent(), message: "Stay focused! You've got this.")
    BlockedMessageEntry(date: .now, configuration: ConfigurationAppIntent(), message: "")
}
