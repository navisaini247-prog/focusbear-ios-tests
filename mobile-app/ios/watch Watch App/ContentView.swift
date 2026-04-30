//
//  ContentView.swift
//  watch Watch App
//
//  Created by iMac on 07/11/23.
//

import SwiftUI
import WatchConnectivity
import WatchKit
import Combine

struct ContentView: View {
  
  @ObservedObject var watchConnector = WatchConnector()
  @State private var remainingSeconds = 0
  var timeInterval: TimeInterval = 0
  @State var isButtonHide = false
  @State var currentRoutineDescription = Constant.Strings.start_routine
  @State var currentButtonTitle = Constant.Strings.start
  @State var isTimerHide = true
  @State var isSkipped = false
  @State private var timer: Timer?
  @State var receivedMessage:ReceivedMessage?
  @State var isLoading = true
  
  // Send message to react native app
  private func sendMessage(message: [String:String]) {
    self.watchConnector.session.sendMessage(message, replyHandler: nil) { (error) in
      print(error.localizedDescription)
    }
  }
  
  private func timeString(from seconds: Int) -> String {
    let minutes = seconds / 60
    let seconds = seconds % 60
    return String(format: "%02d:%02d", minutes, seconds)
  }
  
  private func startTimer() {
    if receivedMessage != nil {
      currentRoutineDescription = receivedMessage?.name ?? ""
      currentButtonTitle = receivedMessage?.durationSeconds == 1 ? Constant.Strings.next : Constant.Strings.pause
      isTimerHide = receivedMessage?.durationSeconds == 1
    } else {
      currentRoutineDescription = Constant.Strings.start_routine
      currentButtonTitle = Constant.Strings.start
      isTimerHide = true
    }
    
    if isTimerHide {
      timer?.invalidate()
      timer = nil
    } else {
      timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
        if remainingSeconds > 0 {
          remainingSeconds -= 1
        } else {
          timer?.invalidate()
          timer = nil
        }
      }
    }
  }
  
  private func handleButtonAction() {
    switch currentButtonTitle {
    case Constant.Strings.pause:
      handlePauseAction()
    case Constant.Strings.resume:
      handleResumeAction()
    case Constant.Strings.start:
      handleStartAction()
    case Constant.Strings.next:
      sendMessage(message: [Constant.Strings.activity_sendDataToRN: currentButtonTitle])
    default:
      break
    }
  }
  
  private func handlePauseAction() {
    sendMessageAndHandleTimer(action: Constant.Strings.pause)
    currentButtonTitle = Constant.Strings.resume
  }
  
  private func handleResumeAction() {
    if currentRoutineDescription == Constant.Strings.routine_has_been_postponed_resume_routine {
      sendMessage(message: [Constant.Strings.activity_sendDataToRN: Constant.Strings.routine_has_been_postponed])
    } else {
      sendMessageAndHandleTimer(action: Constant.Strings.resume)
      currentButtonTitle = Constant.Strings.pause
    }
  }
  
  private func handleStartAction() {
    if currentRoutineDescription == Constant.Strings.start_routine {
      sendMessage(message: [Constant.Strings.activity_sendDataToRN: currentRoutineDescription])
    } else {
      handleNonStartRoutine()
    }
  }
  
  private func handleNonStartRoutine() {
    guard let receivedMessage = receivedMessage else { return }
    if receivedMessage.logQuantity == true && receivedMessage.durationSeconds == 1 {
      sendMessage(message: [Constant.Strings.activity_sendDataToRN: Constant.Strings.activity_start_with_log_quantity])
      isTimerHide = true
      isButtonHide = true
    } else {
      sendMessageAndHandleTimer(action: Constant.Strings.start)
      currentButtonTitle = Constant.Strings.pause
    }
  }
  
  private func sendMessageAndHandleTimer(action: String) {
    sendMessage(message: [Constant.Strings.activity_sendDataToRN: action])
    if action == Constant.Strings.resume {
      startTimer()
    } else {
      stopTimer()
    }
  }
  
  private var buttonTextColor: Color {
    return (currentButtonTitle == Constant.Strings.pause || currentButtonTitle == Constant.Strings.done) ? .black : .white
  }
  
  private var buttonBackgroundColor: Color {
    return (currentButtonTitle == Constant.Strings.pause || currentButtonTitle == Constant.Strings.done) ? Constant.Colors.resumeButtonColor : Constant.Colors.primaryColor
  }
  
  func updateUIBasedOnStatus(_ status: String?) {
      guard let status = status, !status.isEmpty else { return }

      switch status {
      case Constant.Strings.resume:
          handleResumeStatus()
      case Constant.Strings.pause:
          handlePauseStatus()
      case Constant.Strings.routine_has_been_postponed:
          handlePostponedStatus()
      case Constant.Strings.skipped:
          handleSkippedStatus()
      default:
          handleDefaultStatus()
      }
  }
  
  func handleResumeStatus() {
      currentButtonTitle = Constant.Strings.resume
      stopTimer()
  }

  func handlePauseStatus() {
      currentButtonTitle = Constant.Strings.pause
      startTimer()
  }

  func handlePostponedStatus() {
      currentRoutineDescription = Constant.Strings.routine_has_been_postponed_resume_routine
      currentButtonTitle = Constant.Strings.resume
      isTimerHide = true
      isButtonHide = false
      isSkipped = false
  }

  func handleSkippedStatus() {
      currentRoutineDescription = Constant.Strings.why_do_you_want_to_skip
      isButtonHide = true
      isTimerHide = true
      isSkipped = true
  }

  func handleDefaultStatus() {
      let name = receivedMessage?.name ?? ""
      currentRoutineDescription = "\(name) \(Constant.Strings.finished)"
      currentButtonTitle = Constant.Strings.next
      isTimerHide = true
      isSkipped = false
      isButtonHide = false
  }

  func stopTimer() {
      self.timer?.invalidate()
      self.timer = nil
  }
  
  // Function to handle timer-based activity
  private func handleTimerBasedActivity(message: ReceivedMessage) {
      if message.durationSeconds == 1 {
          isTimerHide = true
          currentRoutineDescription = message.name
          isButtonHide = true
      } else {
          receivedMessage = message
          remainingSeconds = message.durationSeconds
          isButtonHide = false
          isTimerHide = message.durationSeconds == 1 ? true : false
          currentButtonTitle = message.logQuantity ? Constant.Strings.next : Constant.Strings.pause
          startTimer()
      }
  }

  // Function to handle non-timer-based activity
  private func handleNonTimerBasedActivity(message: ReceivedMessage) {
      currentRoutineDescription = message.name
      isButtonHide = true
  }
  
  var body: some View {
    ZStack {
      Color.black.ignoresSafeArea()
      
      // Show loading indicator while waiting for initial data
      if isLoading && watchConnector.initialMessage == nil && watchConnector.receivedMessage == nil {
        VStack(spacing: 10) {
          ProgressView()
            .progressViewStyle(CircularProgressViewStyle(tint: .white))
            .scaleEffect(1.2)
          Text("Loading...")
            .foregroundColor(.white)
            .font(.custom(Constant.Fonts.interMedium, size: 15))
        }
      } else {
      VStack {
        Spacer()
        Text(currentRoutineDescription)
          .foregroundColor(.white)
          .padding([.leading, .trailing], 20)
          .multilineTextAlignment(.center)
          .font(.custom(Constant.Fonts.interMedium, size: currentButtonTitle == Constant.Strings.start || currentButtonTitle == Constant.Strings.next ? 20 : 15))
        if isTimerHide == false {
          Text(timeString(from: remainingSeconds))
            .font(.custom(Constant.Fonts.interMedium, size: currentButtonTitle == Constant.Strings.start ? 15 : 36))
            .foregroundColor(.white)
            .padding(.top, currentButtonTitle == Constant.Strings.start ? 4 : 10)
        }
        Spacer()
        if isSkipped == true {
          Button(action: {
            self.sendMessage(message: [Constant.Strings.activity_sendDataToRN: Constant.Strings.i_already_did_it])
          }) {
            Text(Constant.Strings.i_already_did_it)
              .font(.custom(Constant.Fonts.interMedium, size: 16))
              .foregroundColor(.white)
          }
          .background(Constant.Colors.primaryColor)
          .frame(width: 150, height: 42, alignment: .center)
          .cornerRadius(30)
          Button(action: {
            self.sendMessage(message: [Constant.Strings.activity_sendDataToRN: Constant.Strings.cant_do_it_today])
          }) {
            Text(Constant.Strings.cant_do_it_today)
              .font(.custom(Constant.Fonts.interMedium, size: 16))
              .foregroundColor(.white)
          }
          .background(Constant.Colors.primaryColor)
          .frame(width: 150, height: 42, alignment: .center)
          .cornerRadius(30)
        }
        if !isButtonHide {
          Button(action: {
            handleButtonAction()
          }) {
            Text(currentButtonTitle)
              .font(.custom(Constant.Fonts.interMedium, size: 20))
              .foregroundColor(buttonTextColor)
          }
          .background(buttonBackgroundColor)
          .frame(width: 133, height: 42, alignment: .center)
          .cornerRadius(30)
          }
        }
      }
    }.onReceive(self.watchConnector.$receivedMessage.receive(on: DispatchQueue.main)) { message in
      // received message from react native app and manage in apple watch
      if let receivedMessage = message {
          isLoading = false
          stopTimer()
          if receivedMessage.completionRequirement.isEmpty {
              handleTimerBasedActivity(message: receivedMessage)
          } else {
              handleNonTimerBasedActivity(message: receivedMessage)
          }
      }
    }.onReceive(self.watchConnector.$activityStatus.receive(on: DispatchQueue.main)) { status in
      updateUIBasedOnStatus(status)
    }
    .onReceive(self.watchConnector.$initialMessage.receive(on: DispatchQueue.main)) { isInitial in
      isLoading = false
      currentButtonTitle = Constant.Strings.start
      currentRoutineDescription = isInitial?.name ?? Constant.Strings.start_routine
      isTimerHide = true
      receivedMessage = isInitial
    }
    .onReceive(self.watchConnector.$activityCompleteMessage.receive(on: DispatchQueue.main)) { activityCompleteMessage in
      isLoading = false
      currentRoutineDescription = Constant.Strings.activity_complete_message
      isButtonHide = true
    }
    .onAppear {
      // Set a timeout to hide loading after 5 seconds if no data received
      DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
        if isLoading {
          isLoading = false
        }
      }
    }
  }
}
