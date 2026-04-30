//
//  FocusWidget.swift
//  FocusWidget
//
//  Created by Bao Ho Gia on 11/3/25.
//

import SwiftUI
import WidgetKit

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        makeEntry(date: Date(), configuration: ConfigurationAppIntent())
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        makeEntry(date: Date(), configuration: configuration)
    }

    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        WidgetTimelineFactory.quarterHourly(configuration: configuration) { date, config in
            makeEntry(date: date, configuration: config)
        }
    }

    private func makeEntry(date: Date, configuration: ConfigurationAppIntent) -> SimpleEntry {
        let defaults = UserDefaults(suiteName: WidgetTheme.appGroupSuiteName)

        var blockReason = "its_time_to_focus".localize
        if let reason = defaults?.string(forKey: "focus-block-distraction-reason"), !reason.isEmpty {
            if !reason.contains("You're not logged in") && !reason.contains("No has iniciado sesión") {
                blockReason = reason
            }
        }

        var nextActivity = "start_a_focus_session".localize
        if let activity = defaults?.string(forKey: "next-activity-info"), !activity.isEmpty {
            nextActivity = activity
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        let formattedUpdatedTime = formatter.string(from: date)

        return SimpleEntry(
            date: date,
            configuration: configuration,
            blockReason: blockReason,
            nextActivity: nextActivity,
            formattedUpdatedTime: formattedUpdatedTime
        )
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let blockReason: String
    let nextActivity: String
    let formattedUpdatedTime: String

    init(
        date: Date,
        configuration: ConfigurationAppIntent,
        blockReason: String,
        nextActivity: String,
        formattedUpdatedTime: String
    ) {
        self.date = date
        self.configuration = configuration
        self.blockReason = blockReason
        self.nextActivity = nextActivity
        self.formattedUpdatedTime = formattedUpdatedTime
    }

    /// Used by `#Preview` and any call sites that only have `date` + `configuration`.
    init(date: Date, configuration: ConfigurationAppIntent) {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        self.init(
            date: date,
            configuration: configuration,
            blockReason: "its_time_to_focus".localize,
            nextActivity: "start_a_focus_session".localize,
            formattedUpdatedTime: formatter.string(from: date)
        )
    }
}

struct FocusWidgetEntryView: View {
    @Environment(\.colorScheme) var colorScheme
    var entry: Provider.Entry

    var body: some View {
        GeometryReader { geometry in
            let headerHeight = geometry.size.height * WidgetTheme.focusHeaderRatio
            let bodyHeight = max(geometry.size.height - headerHeight, 0)

            VStack(spacing: 0) {
                HStack(alignment: .center, spacing: 10) {
                    cornerIcon()

                    Text(entry.blockReason)
                        .font(.system(size: 14))
                        .foregroundColor(.white)
                        .lineLimit(2)

                    Spacer(minLength: 0)
                }
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity, minHeight: headerHeight, maxHeight: headerHeight, alignment: .center)
                .offset(y: -16)

                VStack(alignment: .leading, spacing: 0) {
                    Spacer(minLength: 0)

                    HStack(alignment: .center, spacing: 4) {
                        Text("whats_next".localize)
                            .font(.system(size: 13, weight: .bold))
                            .foregroundColor(WidgetTheme.primaryText(for: colorScheme))
                            .padding(.trailing, 4)

                        Text(entry.nextActivity)
                            .font(.system(size: 13))
                            .foregroundColor(WidgetTheme.primaryText(for: colorScheme))
                            .lineLimit(2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    Spacer(minLength: 0)

                    Text("\("updated".localize): \(entry.formattedUpdatedTime)")
                        .font(.system(size: 10))
                        .foregroundColor(WidgetTheme.mutedText(for: colorScheme))
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .padding(.horizontal, 12)
                .frame(maxWidth: .infinity, minHeight: bodyHeight, maxHeight: bodyHeight)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    @ViewBuilder
    private func cornerIcon() -> some View {
        Image("FocusBearIcon")
            .resizable()
            .scaledToFit()
            .frame(width: 36, height: 36)
    }
}

struct FocusWidget: Widget {
    let kind: String = "FocusWidget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            FocusWidgetEntryView(entry: entry)
                .containerBackground(for: .widget) {
                    AmberHeaderBackground(headerRatio: WidgetTheme.focusHeaderRatio)
                }
        }
        .supportedFamilies([.systemMedium])
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        return intent
    }

    fileprivate static var starEyes: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        return intent
    }
}

#Preview(as: .systemMedium) {
    FocusWidget()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley)
    SimpleEntry(date: .now, configuration: .starEyes)
}
