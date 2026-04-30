//
//  PreferenceController.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 12/04/23.
//

import Foundation
import ManagedSettings
import WidgetKit

class PreferenceController: ObservableObject {
  static let shared = PreferenceController()
  
  private let prefsApplicationKey: String = "focus-application"
  private let prefsCategoryKey: String = "focus-category"
  private let prefsWebdomainKey: String = "focus-webdomain"
  private let prefsBlockDistractionReasonKey: String = "focus-block-distraction-reason"
  private let prefsNextActivityInfoKey = "next-activity-info"
  private let prefsCustomBlockedMessageKey = "custom-blocked-message"
  private let prefsMorningStreakKey = "morning-streak"
  private let prefsEveningStreakKey = "evening-streak"
  private let prefsFocusStreakKey = "focus-streak"
  private let prefsMorningStreakDoneTodayKey = "morning-streak-done-today"
  private let prefsEveningStreakDoneTodayKey = "evening-streak-done-today"
  private let prefsFocusStreakDoneTodayKey = "focus-streak-done-today"

  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()
  private let sharedDefaults = UserDefaults.init(suiteName: "group.com.FocusBear")

  // MARK: handling Application Tokens
  public func setAppTokens(tokens: Set<ApplicationToken>) -> Bool {
    let initialArray = Array(tokens)
    var encodedArray: Array<Data> = []
    
    if (initialArray.isEmpty) {
      UserDefaults.standard.set([], forKey: self.prefsApplicationKey)
      return true
    }
    
    for element in initialArray {
      let token = try? encoder.encode(element)
      
      if(token != nil) {
        encodedArray.append(token!)
      }
    }
    
    UserDefaults.standard.set(encodedArray, forKey: self.prefsApplicationKey)
    return true
  }
  
  public func getAppTokens() -> Set<ApplicationToken> {
    let tokenArray = UserDefaults.standard.array(forKey: self.prefsApplicationKey)
    var decodedArray: Array<ApplicationToken> = []
    
    if(tokenArray == nil) {
      return Set()
    }
    
    if(tokenArray!.isEmpty) {
      return Set()
    }
    
    for element in tokenArray! {
      let token = try? decoder.decode(ApplicationToken.self, from: element as! Data)
      
      if(token != nil) {
        decodedArray.append(token!)
      }
    }
    
    return Set(decodedArray)
  }
  
  
  // MARK: handling Category Tokens
  public func setCategoryTokens(tokens: Set<ActivityCategoryToken>) -> Bool {
    let initialArray = Array(tokens)
    var encodedArray: Array<Data> = []
    
    if (initialArray.isEmpty) {
      UserDefaults.standard.set([], forKey: self.prefsCategoryKey)
      return true
    }
    
    for element in initialArray {
      let token = try? encoder.encode(element)
      
      if(token != nil) {
        encodedArray.append(token!)
      }
    }
    
    UserDefaults.standard.set(encodedArray, forKey: self.prefsCategoryKey)
    return true
  }
  
  public func getCategoryTokens() -> Set<ActivityCategoryToken> {
    let tokenArray = UserDefaults.standard.array(forKey: self.prefsCategoryKey)
    var decodedArray: Array<ActivityCategoryToken> = []
    
    if(tokenArray == nil) {
      return Set()
    }
    
    if(tokenArray!.isEmpty) {
      return Set()
    }
    
    for element in tokenArray! {
      let token = try? decoder.decode(ActivityCategoryToken.self, from: element as! Data)
      
      if(token != nil) {
        decodedArray.append(token!)
      }
    }
    
    return Set(decodedArray)
  }
  
  // MARK: handling WebDomain Tokens
  public func setWebdomainTokens(tokens: Set<WebDomainToken>) -> Bool {
    let initialArray = Array(tokens)
    var encodedArray: Array<Data> = []
    
    if (initialArray.isEmpty) {
      UserDefaults.standard.set([], forKey: self.prefsWebdomainKey)
      return true
    }
    
    for element in initialArray {
      let token = try? encoder.encode(element)
      
      if(token != nil) {
        encodedArray.append(token!)
      }
    }
    
    UserDefaults.standard.set(encodedArray, forKey: self.prefsWebdomainKey)
    return true
  }
  
  public func getWebdomainTokens() -> Set<WebDomainToken> {
    let tokenArray = UserDefaults.standard.array(forKey: self.prefsWebdomainKey)
    var decodedArray: Array<WebDomainToken> = []
    
    if(tokenArray == nil) {
      return Set()
    }
    
    if(tokenArray!.isEmpty) {
      return Set()
    }
    
    for element in tokenArray! {
      let token = try? decoder.decode(WebDomainToken.self, from: element as! Data)
      
      if(token != nil) {
        decodedArray.append(token!)
      }
    }
    
    return Set(decodedArray)
  }
  
  public func clearBlockList() -> Bool {
    UserDefaults.standard.removeObject(forKey: self.prefsApplicationKey)
    UserDefaults.standard.removeObject(forKey: self.prefsCategoryKey)
    UserDefaults.standard.removeObject(forKey: self.prefsWebdomainKey)
    return true
  }

  public func setBlockDistractionReason(reason: String) -> Bool {
    if sharedDefaults != nil {
      sharedDefaults?.setValue(reason, forKey: self.prefsBlockDistractionReasonKey)
      WidgetCenter.shared.reloadTimelines(ofKind: "FocusWidget")
    }

    return true
  }

  // store name and duration of the activity, eg; Yoga (5:00)
  public func setNextActivityInfo(activityInfo: String) -> Bool {
    if sharedDefaults != nil {
      sharedDefaults?.setValue(activityInfo, forKey: self.prefsNextActivityInfoKey)
      WidgetCenter.shared.reloadTimelines(ofKind: "FocusWidget")
    }

    return true
  }

  public func setCustomBlockedMessage(message: String) -> Bool {
    if sharedDefaults != nil {
      sharedDefaults?.setValue(message, forKey: self.prefsCustomBlockedMessageKey)
      WidgetCenter.shared.reloadTimelines(ofKind: "BlockedMessageWidget")
    }

    return true
  }

  public func getCustomBlockedMessage() -> String? {
    return sharedDefaults?.string(forKey: self.prefsCustomBlockedMessageKey)
  }

  public func setStreakData(
    morningStreak: Int,
    eveningStreak: Int,
    focusStreak: Int,
    morningDone: Bool,
    eveningDone: Bool,
    focusDone: Bool
  ) {
    guard let defaults = sharedDefaults else { return }
    defaults.set(morningStreak, forKey: prefsMorningStreakKey)
    defaults.set(eveningStreak, forKey: prefsEveningStreakKey)
    defaults.set(focusStreak, forKey: prefsFocusStreakKey)
    defaults.set(morningDone, forKey: prefsMorningStreakDoneTodayKey)
    defaults.set(eveningDone, forKey: prefsEveningStreakDoneTodayKey)
    defaults.set(focusDone, forKey: prefsFocusStreakDoneTodayKey)
    WidgetCenter.shared.reloadTimelines(ofKind: "StreakWidget")
  }
}
