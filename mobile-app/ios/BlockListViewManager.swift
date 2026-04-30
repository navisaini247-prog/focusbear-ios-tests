//
//  BlockListViewManager.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 03/04/23.
//
import FamilyControls
import React
import Foundation
import SwiftUI


@objc(BlockListViewManager)
@available(iOS 15.0, *)
class BlockListViewManager: RCTViewManager {
  private final var blockListView: UIHostingController<BlockListView> = UIHostingController(rootView: BlockListView())
  
  override func view() -> UIView! {
    return blockListView.view
  }
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  
}
