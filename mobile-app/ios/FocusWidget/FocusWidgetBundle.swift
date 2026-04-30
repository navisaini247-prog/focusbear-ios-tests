//
//  FocusWidgetBundle.swift
//  FocusWidget
//
//  Created by Bao Ho Gia on 11/3/25.
//

import WidgetKit
import SwiftUI

@main
struct FocusWidgetBundle: WidgetBundle {
    var body: some Widget {
        FocusWidget()
        StreakWidget()
        BlockedMessageWidget()
    }
}
