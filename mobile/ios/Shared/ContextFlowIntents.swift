import AppIntents
import Foundation

@available(iOS 16.0,*)
struct ContinueContextFlowIntent: AppIntent {
  static var title:LocalizedStringResource="Continue in ContextFlow"
  static var description=IntentDescription("Send research and your separate instruction to the same ContextFlow demo task. Research never confirms a bet.")
  static var openAppWhenRun=false
  @Parameter(title:"Research summary") var research:String
  @Parameter(title:"Your instruction") var instruction:String
  @Parameter(title:"Source URLs (one per line)") var source:String?
  @Parameter(title:"Handoff ID (optional)") var handoffID:String?
  @Parameter(title:"Task session ID (optional)") var sessionID:String?
  @Parameter(title:"Candidate event IDs (comma separated)") var eventIDs:String?
  @MainActor func perform() async throws -> some IntentResult & ProvidesDialog & ReturnsValue<String> {
    #if CONTEXTFLOW_APP
    let reply=try await VoiceCoordinator.shared.receiveHandoff(research:research,instruction:instruction,source:source ?? "",handoffID:handoffID,sessionID:sessionID,eventIDs:eventIDs)
    let continuation=VoiceCoordinator.shared.isVoiceActive ? " Your voice session will continue after Siri releases audio." : " Say Start voice control in ContextFlow to continue speaking."
    return .result(value:reply,dialog:IntentDialog(stringLiteral:reply+continuation))
    #else
    return .result(value:"Open ContextFlow to continue.",dialog:"Open ContextFlow to continue.")
    #endif
  }
}

@available(iOS 16.0,*)
struct StartContextFlowVoiceIntent: AppIntent {
  static var title:LocalizedStringResource="Start or resume voice control"
  static var openAppWhenRun=true
  @MainActor func perform() async throws -> some IntentResult & ProvidesDialog {
    #if CONTEXTFLOW_APP
    // Finish the Siri action before acquiring its microphone/audio session.
    VoiceCoordinator.shared.requestStartWhenActive()
    #endif
    return .result(dialog:"Opening your saved ContextFlow task.")
  }
}

@available(iOS 18.0,*)
struct StartContextFlowWidgetVoiceIntent: AppIntent {
  static var title:LocalizedStringResource="Start voice control from the widget"
  static var description=IntentDescription("Open ContextFlow and start or resume voice control immediately.")
  static var openAppWhenRun=true
  @MainActor func perform() async throws -> some IntentResult & ProvidesDialog {
    // Widget extensions cannot safely acquire the app's microphone session. The
    // shared flag is consumed as soon as the foreground app becomes active.
    UserDefaults(suiteName:"group.com.contextflow.prototype")?.set(true,forKey:"voiceStartRequested")
    #if CONTEXTFLOW_APP
    VoiceCoordinator.shared.requestStartWhenActive()
    #endif
    return .result(dialog:"Opening ContextFlow voice control.")
  }
}

@available(iOS 16.2,*)
struct StopContextFlowVoiceIntent: LiveActivityIntent {
  static var title:LocalizedStringResource="Stop voice control"
  static var openAppWhenRun=false
  @MainActor func perform() async throws -> some IntentResult & ProvidesDialog {
    #if CONTEXTFLOW_APP
    await VoiceCoordinator.shared.stop()
    #endif
    return .result(dialog:"Voice stopped. Your task is saved.")
  }
}

#if CONTEXTFLOW_APP
@available(iOS 16.2,*)
struct ContextFlowShortcuts: AppShortcutsProvider {
  static var appShortcuts:[AppShortcut] {
    AppShortcut(intent:StartContextFlowVoiceIntent(),phrases:["Start voice control in \(.applicationName)","Continue speaking in \(.applicationName)"],shortTitle:"Start voice",systemImageName:"waveform")
    AppShortcut(intent:ContinueContextFlowIntent(),phrases:["Continue my research in \(.applicationName)"],shortTitle:"Continue research",systemImageName:"text.bubble")
    AppShortcut(intent:StopContextFlowVoiceIntent(),phrases:["Stop voice control in \(.applicationName)"],shortTitle:"Stop voice",systemImageName:"stop.circle")
  }
}
#endif
