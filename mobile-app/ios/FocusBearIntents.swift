import AppIntents
import UIKit

@available(iOS 16.0, *)
struct StartFocusSessionIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Focus Session"
    static var description = IntentDescription("Start a focus session in Focus Bear")
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "Duration (minutes)", requestValueDialog: "How many minutes do you want to focus for?")
    var duration: Int
    
    @Parameter(title: "Intention", requestValueDialog: "What's your intention for this focus session?")
    var intention: String

    static var parameterSummary: some ParameterSummary {
        Summary("Start a \(\.$duration) minute focus session with intention: \(\.$intention)")
    }
        
    func perform() async throws -> some IntentResult {
        var urlString = "focusbear://home?action=start-focus-session&duration=\(duration)"
        if !intention.isEmpty {
            if let encodedIntention = intention.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                urlString += "&intention=\(encodedIntention)"
            }
        }
        
        if let url = URL(string: urlString) {
            await MainActor.run {
                UIApplication.shared.open(url)
            }
        }
        
        return .result()
    }
}

@available(iOS 16.0, *)
struct StartNextHabitIntent: AppIntent {
    static var title: LocalizedStringResource = "Start next habit"
    static var description = IntentDescription("Start your next habit in Focus Bear")
    static var openAppWhenRun: Bool = true

    static var parameterSummary: some ParameterSummary {
        Summary("Start the next habit")
    }
    
    func perform() async throws -> some IntentResult {
        if let url = URL(string: "focusbear://home?action=start-routine") {
            await MainActor.run {
                UIApplication.shared.open(url)
            }
        }
        return .result()
    }
}

@available(iOS 16.0, *)
struct AddTaskIntent: AppIntent {
    static var title: LocalizedStringResource = "Add Task"
    static var description = IntentDescription("Add a new task in Focus Bear")
    static var openAppWhenRun: Bool = true
    
    @Parameter(title: "Task Name", requestValueDialog: "What task do you want to add?")
    var taskName: String

    static var parameterSummary: some ParameterSummary {
        Summary("Add a new task: \(\.$taskName)")
    }
    
    func perform() async throws -> some IntentResult {
        var urlString = "focusbear://home?action=add-task"
        if !taskName.isEmpty {
            if let encodedName = taskName.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) {
                urlString += "&name=\(encodedName)"
            }
        }
        
        if let url = URL(string: urlString) {
            await MainActor.run {
                UIApplication.shared.open(url)
            }
        }
        return .result()
    }
}

@available(iOS 16.0, *)
struct FocusBearShortcuts: AppShortcutsProvider {
    @AppShortcutsBuilder
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: StartFocusSessionIntent(),
            phrases: [
                "Start a focus session with \(.applicationName)",
                "Start focusing with \(.applicationName)",
                "Begin focus mode with \(.applicationName)",
                "Focus with \(.applicationName)",
                "\(.applicationName) start a focus session",
                "\(.applicationName) I need to focus",
                "\(.applicationName) help me focus",
                "\(.applicationName) start focusing please",
            ],
            shortTitle: "Start Focus",
            systemImageName: "brain.head.profile"
        )
        
        AppShortcut(
            intent: StartNextHabitIntent(),
            phrases: [
                "Start next habit with \(.applicationName)",
                "Start my next habit with \(.applicationName)",
                "Begin next habit with \(.applicationName)",
                "Start routine with \(.applicationName)",
                "Start my routine with \(.applicationName)",
                "Continue my habits with \(.applicationName)",
                "What's my next habit in \(.applicationName)",
                "\(.applicationName) start next habit",
                "\(.applicationName) what's next",
                "\(.applicationName) continue my routine",
                "\(.applicationName) next habit please",
            ],
            shortTitle: "Start next habit",
            systemImageName: "sunrise"
        )
        
        AppShortcut(
            intent: AddTaskIntent(),
            phrases: [
                "Add task in \(.applicationName)",
                "Create task in \(.applicationName)",
                "Add todo in \(.applicationName)",
                "Add task with \(.applicationName)",
                "Add a task with \(.applicationName)",
                "Create task with \(.applicationName)",
                "Add todo with \(.applicationName)",
                "Create todo with \(.applicationName)",
                "\(.applicationName) add a task",
                "\(.applicationName) add task please",
                "\(.applicationName) create a task",
                "\(.applicationName) new task",
            ],
            shortTitle: "Add Task",
            systemImageName: "plus.circle"
        )
    }
}
