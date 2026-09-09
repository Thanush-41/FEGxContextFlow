import WidgetKit
import SwiftUI
import ActivityKit

private let blue=Color(red:0.15,green:0.39,blue:0.92)
struct ContextEntry:TimelineEntry {let date:Date;let title:String;let detail:String;let status:String;var score:String="";var stage:String="";var selections:Int=0;var savedAt:Date?=nil;var isStale:Bool {guard let savedAt else{return false};return date.timeIntervalSince(savedAt)>=90 || savedAt.timeIntervalSince(date)>5}}
struct ContextProvider:TimelineProvider {
  func placeholder(in context:Context)->ContextEntry {ContextEntry(date:Date(),title:"Your next move",detail:"Sports, live events and your slip. Just ask.",status:"READY")}
  func getSnapshot(in context:Context,completion:@escaping(ContextEntry)->Void){completion(current())}
  func getTimeline(in context:Context,completion:@escaping(Timeline<ContextEntry>)->Void){let now=Date();let entry=current(at:now);var entries=[entry];if let savedAt=entry.savedAt,!entry.isStale {entries.append(current(at:savedAt.addingTimeInterval(90)))};completion(Timeline(entries:entries,policy:.after(now.addingTimeInterval(60))))}
  func current(at date:Date=Date())->ContextEntry {
    let data=UserDefaults(suiteName:"group.com.contextflow.prototype")?.data(forKey:"snapshot")
    let s=data.flatMap{try? JSONSerialization.jsonObject(with:$0) as? [String:Any]} ?? [:]
    let iso=ISO8601DateFormatter();iso.formatOptions=[.withInternetDateTime,.withFractionalSeconds];let raw=s["updatedAt"] as? String ?? ""
    let savedAt=s.isEmpty ? nil : iso.date(from:raw) ?? ISO8601DateFormatter().date(from:raw) ?? Date.distantPast
    return ContextEntry(date:date,title:s["title"] as? String ?? "Your next move",detail:s["lastAction"] as? String ?? "Start voice control in ContextFlow.",status:s["microphoneMuted"] as? Bool == true ? "MIC MUTED" : (s["status"] as? String ?? "ready").uppercased(),score:s["score"] as? String ?? "",stage:s["stage"] as? String ?? "",selections:s["selectionCount"] as? Int ?? 0,savedAt:savedAt)
  }
}
struct ContextWidgetView:View {
  let entry:ContextEntry
  @Environment(\.widgetFamily) private var family
  private var voiceStatus:String {entry.status.lowercased()}
  private var isConnecting:Bool {voiceStatus == "connecting"}
  private var isActive:Bool {["listening","thinking","speaking","review","paused","mic muted"].contains(voiceStatus)}
  private var statusIcon:String {
    switch voiceStatus {
    case "connecting":return "waveform.badge.magnifyingglass"
    case "listening":return "waveform"
    case "thinking":return "ellipsis.bubble.fill"
    case "speaking":return "speaker.wave.2.fill"
    case "review":return "checkmark.bubble.fill"
    case "paused","mic muted":return "mic.slash.fill"
    case "offline":return "wifi.slash"
    default:return "circle.fill"
    }
  }
  @ViewBuilder private var voiceControl:some View {
    if #available(iOSApplicationExtension 18.0,*) {
      if isConnecting {
        Button(intent:StartContextFlowWidgetVoiceIntent()) {
          Label("Connecting…",systemImage:statusIcon).font(.caption.bold()).frame(maxWidth:.infinity)
        }.buttonStyle(.borderedProminent).tint(blue.opacity(0.72)).disabled(true)
      } else if isActive {
        Button(intent:StopContextFlowVoiceIntent()) {
          Label(voiceStatus == "listening" ? "Listening — Stop" : "Stop voice",systemImage:"stop.fill").font(.caption.bold()).frame(maxWidth:.infinity)
        }.buttonStyle(.borderedProminent).tint(.red)
      } else {
        Button(intent:StartContextFlowWidgetVoiceIntent()) {
          Label(voiceStatus == "offline" ? "Try voice again" : "Continue by voice",systemImage:"mic.fill").font(.caption.bold()).frame(maxWidth:.infinity)
        }.buttonStyle(.borderedProminent).tint(blue)
      }
    } else {
      Link(destination:URL(string:"contextflow://voice")!) {
        Label("Open voice control",systemImage:"mic.fill").font(.caption.bold()).frame(maxWidth:.infinity)
      }.buttonStyle(.borderedProminent).tint(blue)
    }
  }
  var body:some View {
    VStack(alignment:.leading,spacing:9){HStack{Image(systemName:"waveform.circle.fill").foregroundStyle(blue);Text("ContextFlow").font(.headline);Spacer();if family == .systemLarge{Label("Speaker on",systemImage:"speaker.wave.2.fill").font(.caption2.bold()).foregroundStyle(blue)}};Label(entry.isStale ? "UPDATE PENDING" : entry.status,systemImage:entry.isStale ? "clock" : statusIcon).font(.caption2.bold()).foregroundStyle(entry.isStale ? .orange : isActive ? .green : blue);Text(entry.title).font(family == .systemLarge ? .title3.bold():.subheadline.bold()).lineLimit(2)
      if family == .systemLarge {
        if !entry.score.isEmpty {HStack{Text(entry.score).font(.title2.monospacedDigit().bold());Spacer();Text(entry.stage).font(.caption).foregroundStyle(.secondary)}}
        Divider();Text(entry.detail).font(.subheadline).foregroundStyle(.secondary).lineLimit(4);Spacer(minLength:4)
        HStack{Label("\(entry.selections) selections",systemImage:"ticket");Spacer();Label("Demo data",systemImage:"checkmark.shield")}.font(.caption).foregroundStyle(.secondary)
        Text("Voice opens ContextFlow and starts as soon as microphone access is available.").font(.caption2).foregroundStyle(.secondary)
      } else {Text(entry.detail).font(.caption).foregroundStyle(.secondary).lineLimit(2);Spacer(minLength:0)}
      voiceControl
    }.widgetURL(URL(string:"contextflow://voice"))
  }
}
struct ContextFlowWidget:Widget {
  let kind="ContextFlowWidget"
  var body:some WidgetConfiguration {StaticConfiguration(kind:kind,provider:ContextProvider()){entry in
    if #available(iOS 17.0,*){ContextWidgetView(entry:entry).containerBackground(.background,for:.widget)}else{ContextWidgetView(entry:entry).padding()}
  }.configurationDisplayName("ContextFlow voice").description("Continue your match and your voice task.").supportedFamilies([.systemSmall,.systemMedium,.systemLarge])}
}
@available(iOSApplicationExtension 16.2,*)
struct ContextLiveActivity:Widget {
  var body:some WidgetConfiguration {ActivityConfiguration(for:ContextActivityAttributes.self){context in
    VStack(alignment:.leading,spacing:8){HStack{Label("ContextFlow",systemImage:"waveform").font(.headline);Spacer();Text(context.isStale ? "UPDATE PENDING":(context.state.microphoneMuted == true ? "MIC MUTED":context.state.status.uppercased())).font(.caption2.bold()).foregroundStyle(blue)};HStack{Text(context.state.title).font(.subheadline.bold()).lineLimit(1);Spacer();Text(context.state.score).font(.title3.monospacedDigit().bold())};Text(context.state.lastAction).font(.caption).lineLimit(2);HStack{Text("\(context.state.selections) selections · DEMO").font(.caption2).foregroundStyle(.secondary);Spacer();if #available(iOSApplicationExtension 17.0,*){Button(intent:StopContextFlowVoiceIntent()){Label("Stop",systemImage:"stop.fill")}.font(.caption).tint(.red)}}
    }.padding(16).activityBackgroundTint(Color(.secondarySystemBackground)).widgetURL(URL(string:"contextflow://voice"))
  } dynamicIsland:{context in DynamicIsland {
    DynamicIslandExpandedRegion(.leading){Label("ContextFlow",systemImage:"waveform").font(.caption).foregroundStyle(blue)}
    DynamicIslandExpandedRegion(.trailing){Text(context.state.score).font(.headline.monospacedDigit())}
    DynamicIslandExpandedRegion(.center){Text(context.isStale ? "Update pending":context.state.microphoneMuted == true ? "Mic muted":context.state.status.capitalized).font(.caption2)}
    DynamicIslandExpandedRegion(.bottom){VStack(alignment:.leading,spacing:6){Text(context.state.title).font(.headline).lineLimit(1);Text(context.state.lastAction).font(.caption).lineLimit(2);Text("\(context.state.selections) selections · Demo credits").font(.caption2).foregroundStyle(.secondary)}}
  } compactLeading:{Image(systemName:context.isStale ? "clock":context.state.microphoneMuted == true ? "mic.slash":"waveform").foregroundStyle(blue)} compactTrailing:{Text(context.state.score.isEmpty ? "\(context.state.selections)":context.state.score).font(.caption2.monospacedDigit()).lineLimit(1)} minimal:{Image(systemName:context.isStale ? "clock":context.state.microphoneMuted == true ? "mic.slash":"waveform").foregroundStyle(blue)}.widgetURL(URL(string:"contextflow://voice"))}
  }
}
@main struct ContextFlowWidgets:WidgetBundle {var body:some Widget {ContextFlowWidget();ContextLiveActivity()}}
