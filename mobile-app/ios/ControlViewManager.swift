//
//  ControlViewManager.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 03/04/23.
//
import React
import Foundation
import SwiftUI


@objc(ControlViewManager)
@available(iOS 15.0, *)
class ControlViewManager: RCTViewManager {
  private final var controlView: UIHostingController<ControlView> = UIHostingController(rootView: ControlView())
  
  override func view() -> UIView! {
    return controlView.view
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  
}

