//
//  ActivityController.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 03/04/23.
//

import Foundation
import FamilyControls


final class ActivityController: ObservableObject {
  static let shared: ActivityController = {
    let instance = ActivityController()
    instance.model.initDiscourageSelection()
    return instance
  }()
  @Published public var isPresented: Bool = false
  @Published public var model = ControlModel.shared
}
