//
//  WatchConnector.swift
//  watch Watch App
//
//  Created by iMac on 07/11/23.
//

import Foundation
import WatchKit
import WatchConnectivity
import UIKit

final class WatchConnector: NSObject, WCSessionDelegate,ObservableObject {
  var session: WCSession
  @Published var receivedMessage:ReceivedMessage?
  @Published var activityStatus = ""
  @Published var initialMessage: ReceivedMessage?
  @Published var activityCompleteMessage = ""
  let messageTextKey = "text"

  
  init(session: WCSession  = .default) {
    self.session = session
    super.init()
    if WCSession.isSupported() {
      session.delegate = self
      session.activate()
    }
  }
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    print("WCSession activation completed with state: \(activationState.rawValue)")
    if let error = error {
      print("WCSession activation failed with error: \(error.localizedDescription)")
    }
  }
  
  // Received event from react native app
  func session(_ session: WCSession, didReceiveMessage message: [String : Any], replyHandler: @escaping ([String : Any]) -> Void) {
    // message containe initial key that means need to display last unCompleted activity in watch app
      if let textMessage = message[messageTextKey] as? String, textMessage == Constant.Strings.continue_on_your_phone_event {
          activityCompleteMessage = textMessage
      }
      else if message.keys.contains("isInitial") {
          if let initialMessage = ReceivedMessage(message: message) {
              print("initial Message: \(initialMessage)")
              self.initialMessage = initialMessage
          }
      } else {
          if let receivedMessage = ReceivedMessage(message: message) {
              print("Received Message: \(receivedMessage)")
              self.receivedMessage = receivedMessage
          } else {
              for (key, value) in message {
                  if let stringValue = value as? String {
                      print("Key: \(key), Value: \(stringValue)")
                      self.activityStatus = stringValue
                  }
              }
              print("Failed to parse the message.")
          }
      }
  }
}
