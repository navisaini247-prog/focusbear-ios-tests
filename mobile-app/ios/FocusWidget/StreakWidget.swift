//
//  StreakWidget.swift
//  FocusWidget
//

import WidgetKit
import SwiftUI

struct StreakProvider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> StreakEntry {
        StreakEntry(
            date: Date(),
            configuration: ConfigurationAppIntent(),
            morningStreak: 0,
            eveningStreak: 0,
            focusStreak: 0,
            morningDone: false,
            eveningDone: false,
            focusDone: false
        )
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> StreakEntry {
        makeEntry(date: Date(), configuration: configuration)
    }

    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<StreakEntry> {
        WidgetTimelineFactory.quarterHourly(configuration: configuration) { date, config in
            makeEntry(date: date, configuration: config)
        }
    }

    private func makeEntry(date: Date, configuration: ConfigurationAppIntent) -> StreakEntry {
        let defaults = UserDefaults(suiteName: WidgetTheme.appGroupSuiteName)
        return StreakEntry(
            date: date,
            configuration: configuration,
            morningStreak: defaults?.integer(forKey: "morning-streak") ?? 0,
            eveningStreak: defaults?.integer(forKey: "evening-streak") ?? 0,
            focusStreak: defaults?.integer(forKey: "focus-streak") ?? 0,
            morningDone: defaults?.bool(forKey: "morning-streak-done-today") ?? false,
            eveningDone: defaults?.bool(forKey: "evening-streak-done-today") ?? false,
            focusDone: defaults?.bool(forKey: "focus-streak-done-today") ?? false
        )
    }
}

struct StreakEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let morningStreak: Int
    let eveningStreak: Int
    let focusStreak: Int
    let morningDone: Bool
    let eveningDone: Bool
    let focusDone: Bool
}

struct StreakWidgetEntryView: View {
    @Environment(\.widgetFamily) var widgetFamily
    @Environment(\.colorScheme) var colorScheme
    var entry: StreakEntry

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
        GeometryReader { geometry in
            let headerHeight = geometry.size.height * WidgetTheme.streakHeaderRatio
            let bodyHeight = max(geometry.size.height - headerHeight, 0)

            VStack(spacing: 0) {
                HStack(spacing: 8) {
                    Image("FocusBearIcon")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 30, height: 30)

                    Text("streak_title".localize)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(.white)

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 14)
                .frame(maxWidth: .infinity, minHeight: headerHeight, maxHeight: headerHeight, alignment: .center)
                .offset(y: -16)

                HStack(spacing: 0) {
                    streakColumn(count: entry.morningStreak, done: entry.morningDone, label: "streak_morning".localize)

                    Rectangle()
                        .fill(WidgetTheme.dividerColor(for: colorScheme))
                        .frame(width: 1)
                        .padding(.vertical, 8)

                    streakColumn(count: entry.eveningStreak, done: entry.eveningDone, label: "streak_evening".localize)

                    Rectangle()
                        .fill(WidgetTheme.dividerColor(for: colorScheme))
                        .frame(width: 1)
                        .padding(.vertical, 8)

                    streakColumn(count: entry.focusStreak, done: entry.focusDone, label: "streak_focus".localize)
                }
                .padding(.horizontal, 8)
                .frame(maxWidth: .infinity, minHeight: bodyHeight, maxHeight: bodyHeight, alignment: .center)
            }
        }
    }

    private var smallLayout: some View {
        GeometryReader { geometry in
            let headerHeight = geometry.size.height * WidgetTheme.streakHeaderRatio
            let bodyHeight = max(geometry.size.height - headerHeight, 0)

            VStack(spacing: 0) {
                HStack(spacing: 6) {
                    Image("FocusBearIcon")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 30, height: 30)

                    Text("streak_title".localize)
                        .font(.system(size: 15, weight: .bold))
                        .foregroundColor(.white)

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 8)
                .frame(maxWidth: .infinity, minHeight: headerHeight, maxHeight: headerHeight, alignment: .center)
                .offset(y: -16)

                HStack(spacing: 0) {
                    streakColumnCompact(count: entry.morningStreak, done: entry.morningDone, label: "streak_morning_short".localize)
                    streakColumnCompact(count: entry.eveningStreak, done: entry.eveningDone, label: "streak_evening_short".localize)
                    streakColumnCompact(count: entry.focusStreak, done: entry.focusDone, label: "streak_focus_short".localize)
                }
                .padding(.horizontal, 4)
                .frame(maxWidth: .infinity, minHeight: bodyHeight, maxHeight: bodyHeight, alignment: .center)
            }
        }
    }

    private func streakColumn(count: Int, done: Bool, label: String) -> some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundColor(WidgetTheme.streakColor(count: count, done: done))

            Text("streak_days".localize)
                .font(.system(size: 11))
                .foregroundColor(WidgetTheme.secondaryText(for: colorScheme))

            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(WidgetTheme.primaryText(for: colorScheme))
        }
        .frame(maxWidth: .infinity)
    }

    private func streakColumnCompact(count: Int, done: Bool, label: String) -> some View {
        VStack(spacing: 2) {
            Text("\(count)")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(WidgetTheme.streakColor(count: count, done: done))

            Text("streak_days".localize)
                .font(.system(size: 11))
                .foregroundColor(WidgetTheme.primaryText(for: colorScheme).opacity(0.8))

            Text(label)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(WidgetTheme.primaryText(for: colorScheme))
        }
        .frame(maxWidth: .infinity)
    }
}

struct StreakWidget: Widget {
    let kind: String = "StreakWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: StreakProvider()) { entry in
            StreakWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    AmberHeaderBackground(headerRatio: WidgetTheme.streakHeaderRatio)
                }
        }
        .configurationDisplayName("streak_title".localize)
        .description("streak_widget_description".localize)
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

#Preview(as: .systemMedium) {
    StreakWidget()
} timeline: {
    StreakEntry(
        date: .now,
        configuration: ConfigurationAppIntent(),
        morningStreak: 5,
        eveningStreak: 3,
        focusStreak: 12,
        morningDone: true,
        eveningDone: false,
        focusDone: true
    )
    StreakEntry(
        date: .now,
        configuration: ConfigurationAppIntent(),
        morningStreak: 0,
        eveningStreak: 0,
        focusStreak: 0,
        morningDone: false,
        eveningDone: false,
        focusDone: false
    )
}
