//
//  Constant+Strings.swift
//  watch Watch App
//
//  Created by iMac on 21/11/23.
//

import Foundation
import UIKit

extension Constant {
  struct Strings {
    static let start = "start".localize
    static let pause = "pause".localize
    static let resume = "resume".localize
    static let next = "next".localize
    static let skipped = "skipped".localize
    static let finished = "finished".localize
    static let done = "done".localize
    static let why_do_you_want_to_skip = "why_do_you_want_to_skip".localize
    static let start_routine = "start_routine".localize
    static let routine_has_been_postponed_resume_routine = "routine_has_been_postponed_resume_routine".localize
    static let i_already_did_it = "i_already_did_it".localize
    static let cant_do_it_today = "cant_do_it_today".localize
    static let activity_complete_message = "continue_on_your_phone".localize
    
    // static event name used for send event apple watch to app
    static let activity_start_with_log_quantity = "Activity_Start_with_LogQuantity"
    static let routine_has_been_postponed = "Routine_has_been_postponed"
    static let activity_sendDataToRN = "sendDataToRN"
    
    static let continue_on_your_phone_event = "SET_ACTIVITY_CONTINUE_ON_YOUR_PHONE"
  }
}
