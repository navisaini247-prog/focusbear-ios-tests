//
//  ControlModel.swift
//  FocusBear
//
//  Created by Arindam HestaBit on 04/04/23.
//

import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings
import ManagedSettingsUI

class ControlModel: ObservableObject {
  static let shared = ControlModel()

  let store = ManagedSettingsStore(named: ManagedSettingsStore.Name("FocusBearStore"))

  let prefs = PreferenceController.shared

  static var isBlockingEnabled: Bool {
    get {
      UserDefaults(suiteName: "group.com.FocusBear")?.bool(forKey: "FocusBear_IsBlockingEnabled") ?? false
    }
    set {
      let defaults = UserDefaults(suiteName: "group.com.FocusBear")
      defaults?.set(newValue, forKey: "FocusBear_IsBlockingEnabled")
      defaults?.synchronize()
    }
  }
  static var highFrictionMode: Bool = false

  private let initializationCompleteKey = "initializationComplete"
  private let storeMigrationKey = "FocusBear_NamedStoreMigrationDone_v1"

  @Published var initializationComplete: Bool {
    didSet {
      UserDefaults.standard.set(initializationComplete, forKey: initializationCompleteKey)
    }
  }

  private init() {
    // Initialize `initializationComplete` from UserDefaults
    initializationComplete = UserDefaults.standard.bool(forKey: initializationCompleteKey)
    migrateDefaultStoreToNamedStoreIfNeeded()
  }

  /// One-time migration: copy shield settings from the old default ManagedSettingsStore to the
  /// new named "FocusBearStore". This prevents existing users from losing their shields after
  /// the store rename. The migration only runs once (guarded by `storeMigrationKey`).
  private func migrateDefaultStoreToNamedStoreIfNeeded() {
    guard !UserDefaults.standard.bool(forKey: storeMigrationKey) else { return }
    defer { UserDefaults.standard.set(true, forKey: storeMigrationKey) }

    let oldStore = ManagedSettingsStore() // default (unnamed) store used by previous versions
    let hasApps = !(oldStore.shield.applications?.isEmpty ?? true)
    let hasWebDomains = !(oldStore.shield.webDomains?.isEmpty ?? true)
    let hasAppCategories = oldStore.shield.applicationCategories != nil
    let hasWebCategories = oldStore.shield.webDomainCategories != nil

    guard hasApps || hasWebDomains || hasAppCategories || hasWebCategories else {
      // Old store had no shields — nothing to migrate.
      return
    }

    store.shield.applications = oldStore.shield.applications
    store.shield.webDomains = oldStore.shield.webDomains
    store.shield.applicationCategories = oldStore.shield.applicationCategories
    store.shield.webDomainCategories = oldStore.shield.webDomainCategories

    // Clear the old store so it no longer enforces duplicate restrictions.
    oldStore.clearAllSettings()

    print("[ControlModel] Migrated shields from default ManagedSettingsStore to FocusBearStore")
  }

  @Published var applicationsToBlock: Set<ApplicationToken>?
  @Published var webDomainsToBlock: Set<WebDomainToken>?

  @Published var applicationCategoriesToBlock: ShieldSettings.ActivityCategoryPolicy<Application>?
  @Published var webDomainCategoriesToBlock: ShieldSettings.ActivityCategoryPolicy<WebDomain>?

  /// FamilyActivitySelection to set and manage parental controls
  /// Also to initiate shield extension over other application
  private func updateSelections() {
    let applications = self.selectionToDiscourage.applicationTokens
    let categories = self.selectionToDiscourage.categoryTokens
    let webdomain = self.selectionToDiscourage.webDomainTokens

    _ = prefs.setAppTokens(tokens: applications)
    _ = prefs.setCategoryTokens(tokens: categories)
    _ = prefs.setWebdomainTokens(tokens: webdomain)

    applicationsToBlock = applications.isEmpty ? nil : applications
    webDomainsToBlock = webdomain.isEmpty ? nil : webdomain
    applicationCategoriesToBlock = ShieldSettings.ActivityCategoryPolicy.specific(
      categories, except: Set())
    webDomainCategoriesToBlock = ShieldSettings.ActivityCategoryPolicy.specific(
      categories, except: Set())
  }

  public func initDiscourageSelection() {
    DispatchQueue.main.async { [self] in
      self.selectionToDiscourage.categoryTokens = prefs.getCategoryTokens()
      self.selectionToDiscourage.applicationTokens = prefs.getAppTokens()
      self.selectionToDiscourage.webDomainTokens = prefs.getWebdomainTokens()

      updateSelections()
      initializationComplete = true
    }
  }

  // Store current selection when user clicks "Done" in FamilyActivityPicker
  func storeCurrentSelection() {
    storeActivitySelection(selectionToDiscourage)
  }

  // Store FamilyActivitySelection directly in UserDefaults for reliable background access
  func storeActivitySelection(_ selection: FamilyActivitySelection) {
    do {
      let data = try JSONEncoder().encode(selection)
      let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")
      sharedDefaults?.set(data, forKey: "FocusBear_ActivitySelection")
      sharedDefaults?.set(selection.applicationTokens.count, forKey: "FocusBear_SelectedAppsCount")
      sharedDefaults?.set(
        selection.categoryTokens.count, forKey: "FocusBear_SelectedCategoriesCount")
      sharedDefaults?.set(
        selection.webDomainTokens.count, forKey: "FocusBear_SelectedWebDomainsCount")
      sharedDefaults?.synchronize()
      print(
        "[FamilyControls] Stored activity selection with \(selection.applicationTokens.count) apps, \(selection.categoryTokens.count) categories, \(selection.webDomainTokens.count) web domains"
      )
    } catch {
      print("[FamilyControls] Failed to store activity selection: \(error)")
    }
  }

  // Retrieve stored FamilyActivitySelection from UserDefaults
  private func getStoredActivitySelection() -> FamilyActivitySelection? {
    guard let data = getStoredActivitySelectionData() else {
      print("[FocusBearShared] No app selection found")
      return nil
    }

    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  func getStoredActivitySelectionData() -> Data? {
    let sharedDefaults = UserDefaults(suiteName: "group.com.FocusBear")
    return sharedDefaults?.data(forKey: "FocusBear_ActivitySelection")
  }

  @objc func initializeBlockingDataIfNeeded() {
    if !initializationComplete {
      initDiscourageSelection()  // loads prefs, apps/categories, sets flags
    }
  }

  @Published public var selectionToDiscourage: FamilyActivitySelection = FamilyActivitySelection() {
    willSet {
      if !initializationComplete {
        return
      }
      DispatchQueue.main.async { [self] in
        updateSelections()
      }
    }
  }

  /// Set particular time duration over other apps
  /// - Parameters:
  ///   - hours: Number of hours to restrict
  ///   - minutes: Number of minutes to restrict
  func initiateMonitoring(hours: Int, minutes: Int) {
    print("initiateMonitoring called with \(hours)h \(minutes)m")

    // Try to get stored FamilyActivitySelection first (most reliable for background)
    if let storedSelection = getStoredActivitySelection() {
      print(
        "Using stored FamilyActivitySelection: \(storedSelection.applicationTokens.count) apps, \(storedSelection.categoryTokens.count) categories, \(storedSelection.webDomainTokens.count) web domains"
      )
      applySelections([storedSelection])
    } else {
      // Fallback to prefs if no stored selection
      print("No stored selection found, using prefs fallback")
      store.shield.applications = prefs.getAppTokens()
      store.shield.webDomains = prefs.getWebdomainTokens()
      store.shield.applicationCategories = ShieldSettings.ActivityCategoryPolicy.specific(
        prefs.getCategoryTokens(), except: Set())
      store.shield.webDomainCategories = ShieldSettings.ActivityCategoryPolicy.specific(
        prefs.getCategoryTokens(), except: Set())
    }

    store.dateAndTime.requireAutomaticDateAndTime = true
    store.passcode.lockPasscode = ControlModel.highFrictionMode
    store.account.lockAccounts = false
    store.siri.denySiri = false
    store.appStore.denyInAppPurchases = false
    store.appStore.requirePasswordForPurchases = false
    store.media.denyExplicitContent = false
    store.gameCenter.denyMultiplayerGaming = false
    store.media.denyMusicService = false

    print(
      "Shields applied: apps=\(store.shield.applications?.count ?? 0), categories=\(store.shield.applicationCategories != nil ? "set" : "nil")"
    )
  }
}

extension DeviceActivityName {
  static let daily = Self("daily")
}

extension ControlModel {
  func applySelections(_ selections: [FamilyActivitySelection]) {
    let applications = selections.reduce(into: Set<ApplicationToken>()) {
      partialResult, selection in
      partialResult.formUnion(selection.applicationTokens)
    }

    let categories = selections.reduce(into: Set<ActivityCategoryToken>()) {
      partialResult, selection in
      partialResult.formUnion(selection.categoryTokens)
    }

    let webDomains = selections.reduce(into: Set<WebDomainToken>()) { partialResult, selection in
      partialResult.formUnion(selection.webDomainTokens)
    }

    store.shield.applications = applications.isEmpty ? nil : applications
    store.shield.webDomains = webDomains.isEmpty ? nil : webDomains
    store.shield.applicationCategories =
      categories.isEmpty
      ? nil : ShieldSettings.ActivityCategoryPolicy.specific(categories, except: Set())
    store.shield.webDomainCategories =
      categories.isEmpty
      ? nil : ShieldSettings.ActivityCategoryPolicy.specific(categories, except: Set())

    store.dateAndTime.requireAutomaticDateAndTime = true
    store.passcode.lockPasscode = ControlModel.highFrictionMode
    store.account.lockAccounts = false
    store.siri.denySiri = false
    store.appStore.denyInAppPurchases = false
    store.appStore.requirePasswordForPurchases = false
    store.media.denyExplicitContent = false
    store.gameCenter.denyMultiplayerGaming = false
    store.media.denyMusicService = false

    print(
      "[ControlModel] Applied selections ⇒ apps=\(applications.count) categories=\(categories.count) webDomains=\(webDomains.count)"
    )
  }
}
