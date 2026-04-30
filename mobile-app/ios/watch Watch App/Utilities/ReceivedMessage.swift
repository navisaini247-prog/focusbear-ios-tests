//
//  ReceivedMessage.swift
//  watch Watch App
//
//  Created by iMac on 07/11/23.
//

import Foundation
import UIKit

struct ReceivedMessage: Codable {
  let id: String
  let choices: [String]
  let durationSeconds: Int
  let activitySequenceId: String
  let activityTemplateId: String
  let logQuantity: Bool
  let logSummaryType: String
  let isDefault: Bool
  let runMicroBreaks: Bool
  let daysOfWeek: [String]
  let logQuantityQuestions: [String]
  let linkedActivityId: String?
  let impactCategory: String?
  let createdAt: String
  let name: String
  let videoUrls: [String]
  let allowedApps: [String]
  let allowedUrls: [String]
  let category: String
  let completionRequirement: String
  
  init?(message: [String: Any]) {
    guard let textJSON = message["text"] as? String,
          let textData = textJSON.data(using: .utf8),
          let textValue = (try? JSONSerialization.jsonObject(with: textData, options: [])) as? [String: Any]
    else {
      return nil
    }
    
    id = textValue["id"] as? String ?? ""
    choices = textValue["choices"] as? [String] ?? []
    durationSeconds = textValue["duration_seconds"] as? Int ?? 0
    name = textValue["name"] as? String ?? ""
    activitySequenceId = textValue["activity_sequence_id"] as? String ?? ""
    activityTemplateId = textValue["activity_template_id"] as? String ?? ""
    logQuantity = textValue["log_quantity"] as? Bool ?? false
    logSummaryType = textValue["log_summary_type"] as? String ?? ""
    isDefault = textValue["is_default"] as? Bool ?? false
    runMicroBreaks = textValue["run_micro_breaks"] as? Bool ?? false
    daysOfWeek = textValue["days_of_week"] as? [String] ?? []
    logQuantityQuestions = textValue["log_quantity_questions"] as? [String] ?? []
    linkedActivityId = textValue["linked_activity_id"] as? String ?? ""
    impactCategory = textValue["impact_category"] as? String ?? ""
    createdAt = textValue["created_at"] as? String ?? ""
    videoUrls = textValue["video_urls"] as? [String] ?? []
    allowedApps = textValue["allowed_apps"] as? [String] ?? []
    allowedUrls = textValue["allowed_urls"] as? [String] ?? []
    category = textValue["category"] as? String ?? ""
    completionRequirement = textValue["completion_requirements"] as? String ?? ""
  }
}
