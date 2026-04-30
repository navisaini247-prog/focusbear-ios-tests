//
//  WatchLocalizationExtension.swift
//  watch Watch App
//
import Foundation
import SwiftUI

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
        if #available(watchOS 9.0, *) {
            languageCode = locale.language.languageCode?.identifier ?? "en"
        } else {
            languageCode = locale.languageCode ?? "en"
        }
        
        if languageCode == "zh" {
            let script: String?
            if #available(watchOS 9.0, *) {
                script = locale.language.script?.identifier
            } else {
                script = locale.scriptCode
            }
            
            let region: String?
            if #available(watchOS 9.0, *) {
                region = locale.region?.identifier
            } else {
                region = locale.regionCode
            }
                        
            if let script {
                if script == "Hans" { return "zh-Hans" }
                if script == "Hant" { return "zh-Hant" }
            }
            
            if let region {
                switch region {
                case "TW", "HK", "MO":
                    return "zh-Hant"
                default:
                    return "zh-Hans"
                }
            }
            return "zh-Hans"
        }
        return languageCode
    }
}
