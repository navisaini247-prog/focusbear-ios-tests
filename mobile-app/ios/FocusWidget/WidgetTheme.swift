//
//  WidgetTheme.swift
//  FocusWidget
//

import SwiftUI
import WidgetKit

struct WidgetTheme {
    static let appGroupSuiteName = "group.com.FocusBear"
    static let refreshInterval: TimeInterval = 15 * 60
    static let focusHeaderRatio: CGFloat = 2.0 / 4.0
    static let streakHeaderRatio: CGFloat = 0.42

    static let amber = Color(red: 217 / 255, green: 119 / 255, blue: 6 / 255)

    static let streakGray = Color(red: 156 / 255, green: 163 / 255, blue: 175 / 255)
    static let streakGreen = Color(red: 22 / 255, green: 163 / 255, blue: 74 / 255)
    static let streakYellow = Color(red: 234 / 255, green: 179 / 255, blue: 8 / 255)

    static func bodyBackground(for scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 28 / 255, green: 28 / 255, blue: 30 / 255)
            : Color(red: 252 / 255, green: 248 / 255, blue: 240 / 255)
    }

    static func primaryText(for scheme: ColorScheme) -> Color {
        scheme == .dark ? .white : Color(red: 17 / 255, green: 24 / 255, blue: 39 / 255)
    }

    static func secondaryText(for scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color(red: 156 / 255, green: 163 / 255, blue: 175 / 255)
            : Color(red: 107 / 255, green: 114 / 255, blue: 128 / 255)
    }

    static func dividerColor(for scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color.white.opacity(0.12)
            : Color.black.opacity(0.1)
    }

    static func mutedText(for scheme: ColorScheme) -> Color {
        scheme == .dark
            ? Color.white.opacity(0.55)
            : Color.gray
    }

    static func streakColor(count: Int, done: Bool) -> Color {
        if count == 0 { return streakGray }
        if done { return streakGreen }
        return streakYellow
    }
}

enum WidgetTimelineFactory {
    static func quarterHourly<Entry>(
        from startDate: Date = Date(),
        configuration: ConfigurationAppIntent,
        makeEntry: (Date, ConfigurationAppIntent) -> Entry
    ) -> Timeline<Entry> where Entry: TimelineEntry {
        var entries: [Entry] = []
        for minuteOffset in stride(from: 0, to: 60, by: 15) {
            let entryDate = Calendar.current.date(byAdding: .minute, value: minuteOffset, to: startDate) ?? startDate
            entries.append(makeEntry(entryDate, configuration))
        }

        return Timeline(entries: entries, policy: .after(startDate.addingTimeInterval(WidgetTheme.refreshInterval)))
    }
}

struct AmberHeaderBackground: View {
    @Environment(\.colorScheme) var colorScheme
    var headerRatio: CGFloat = 0.36

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                WidgetTheme.amber
                    .frame(height: geometry.size.height * headerRatio)
                WidgetTheme.bodyBackground(for: colorScheme)
            }
            .padding(-16)
        }
    }
}

struct PlainWidgetBackground: View {
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        WidgetTheme.bodyBackground(for: colorScheme)
    }
}
