//
//  LocalizationExtension.swift
//  FocusBear
//

import Foundation

extension String {
  var localize: String {
    let lang = resolveLanguageCode()    
    let path = Bundle.main.path(forResource: lang, ofType: "lproj")
    
    guard let path, let bundle = Bundle(path: path) else {
        return NSLocalizedString(self, comment: "")
    }
    return NSLocalizedString(self, tableName: nil, bundle: bundle, value: "", comment: "")
  }
  
  func localizeString(lang: String) -> String {
    let path = Bundle.main.path(forResource: lang, ofType: "lproj")
    guard let path, let bundle = Bundle(path: path) else {
      return NSLocalizedString(self, comment: "")
    }
    return NSLocalizedString(self, tableName: nil, bundle: bundle, value: "", comment: "")
  }

  func resolveLanguageCode() -> String {
    let locale = Locale.current
    
    let languageCode: String
    if #available(iOS 16.0, *) {
        languageCode = locale.language.languageCode?.identifier ?? "en"
    } else {
        languageCode = locale.languageCode ?? "en"
    }

    // Handle Chinese variants: traditional, simplified and Hong Kong
    if languageCode == "zh" {
        let script: String?
        if #available(iOS 16.0, *) {
            script = locale.language.script?.identifier
        } else {
            script = locale.scriptCode
        }
        
        let region: String?
        if #available(iOS 16.0, *) {
            region = locale.region?.identifier
        } else {
            region = locale.regionCode
        }
         
        if let script {
            if script == "Hans" { return "zh-Hans" }
            if script == "Hant" { return "zh-Hant" }
        }
        
        // Fallback to region based if iOS did not provide script
        if let region {
            switch region {
            case "TW", "HK", "MO":
                return "zh-Hant"
            default:
                return "zh-Hans"
            }
        }
        // Default Chinese Simplified
        return "zh-Hans"
    }
    return languageCode
  }
}
