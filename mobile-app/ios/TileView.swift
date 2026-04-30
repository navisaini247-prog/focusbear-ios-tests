//
//  TileView.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 03/04/23.
//

import SwiftUI

/// Display app name and app icon in tile view
struct TileView: View {
  
  init(title: String, icon: String, count: Int){
    self.title = title
    self.icon = icon
    self.count = count
  }
  
  var title: String
  var icon: String
  var count: Int
  
  @StateObject private var _activityController: ActivityController = ActivityController.shared
  
  var body: some View {
    HStack {
      Label("\(title):", systemImage: icon)
      
      Spacer()
      
      Text("\(count)")
      
    }
    .padding(2)
  }
}

struct TileView_Previews: PreviewProvider {
  static var previews: some View {
    TileView(title: "", icon: "", count: 0)
  }
}
