//
//  ControlView.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 03/04/23.
//

import FamilyControls
import SwiftUI

var globalActivityController: ActivityController?

@available(iOS 15.0, *)

/// Control view to display a list of apps that you want to select for restriction.
/// It uses controlfunction to select apps for restriction.

struct ControlView: View {
  @StateObject private var _activityController: ActivityController = ActivityController.shared

  var body: some View {

    VStack {
      TileView(
        title: "blocked_apps".localize, icon: "app.badge.checkmark",
        count: _activityController.model.selectionToDiscourage.applications.count)

      TileView(
        title: "blocked_categories".localize, icon: "folder.badge.gearshape",
        count: _activityController.model.selectionToDiscourage.categories.count)

      TileView(
        title: "blocked_webdomains".localize, icon: "internaldrive",
        count: _activityController.model.selectionToDiscourage.webDomains.count)
    }
    .onAppear(
      perform: {
        DispatchQueue.main.async {
          if globalActivityController == nil {
            globalActivityController = _activityController
          }
        }
      })
      .onChange(of: _activityController.isPresented) { isPresented in
        // When picker is dismissed (isPresented becomes false), store the current selection
        if !isPresented {
          _activityController.model.storeCurrentSelection()
        }
      }
      .padding(12)
      .familyActivityPicker(
        isPresented: $_activityController.isPresented,
        selection: $_activityController.model.selectionToDiscourage)
  }
}

@available(iOS 15.0, *)
struct ControlView_Previews: PreviewProvider {
  static var previews: some View {
    ControlView()
  }
}
