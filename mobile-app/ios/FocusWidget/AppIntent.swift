//
//  AppIntent.swift
//  FocusWidget
//
//  Created by Bao Ho Gia on 11/3/25.
//

import WidgetKit
import AppIntents

@available(iOSApplicationExtension 17.0, *)
struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Configuration" }
    static var description: IntentDescription { "This is an example widget." }
}
