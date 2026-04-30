//
//  BlockListView.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 03/04/23.
//

import SwiftUI
import FamilyControls
import Sentry

struct BlockListView: View {
  @StateObject private var _activityController: ActivityController = ActivityController.shared
  
  var body: some View {
    VStack {
      Divider()
      
      Text("apps_to_block".localize)
        .frame(alignment: .center)
      
      Divider()
      
      FamilyActivityPicker(selection: $_activityController.model.selectionToDiscourage)
        .onChange(of: _activityController.model.selectionToDiscourage) { newSelection in
          _ = _activityController.model.selectionToDiscourage.applications
          _ = _activityController.model.selectionToDiscourage.categories
          _ = _activityController.model.selectionToDiscourage.webDomains
        }
    }
    .onAppear(
      perform: {
        DispatchQueue.main.async {
          _activityController.model.initDiscourageSelection()
          
          if (globalActivityController == nil) {
            globalActivityController = _activityController
          }
          
          Task{
            do {
              try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
            }catch{
              SentrySDK.capture(error: error)
              print("Failed to authenticate with error: \(error)")
            }
          }
        }
      })
    .onChange(of: _activityController.isPresented) { isPresented in
      // When picker is dismissed (isPresented becomes false), store the current selection
      if !isPresented {
        _activityController.model.storeCurrentSelection()
      }
    }
  }
}

struct BlockListView_Previews: PreviewProvider {
  static var previews: some View {
    BlockListView()
  }
}
