import Foundation
import React

@objc(ContextFlowVoice)
final class ContextFlowVoice: RCTEventEmitter {
  private var observations:[NSObjectProtocol]=[]
  override static func requiresMainQueueSetup()->Bool {true}
  override func supportedEvents()->[String]! {["ContextFlowState","ContextFlowVoice"]}
  override func constantsToExport()->[AnyHashable:Any]! {["defaultApiUrl":VoiceCredentials.baseURL]}
  override func startObserving() {
    for name in [contextStateEvent,contextVoiceEvent] {observations.append(NotificationCenter.default.addObserver(forName:name,object:nil,queue:.main){[weak self] n in self?.sendEvent(withName:name.rawValue,body:n.userInfo ?? [:])})}
  }
  override func stopObserving(){observations.forEach(NotificationCenter.default.removeObserver);observations=[]}
  @objc(getCredentials:rejecter:) func getCredentials(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:RCTPromiseRejectBlock){Task{@MainActor in VoiceCoordinator.shared.migrateBackend();resolve(["baseUrl":VoiceCredentials.baseURL,"token":VoiceCredentials.token])}}
  @objc(configure:token:resolver:rejecter:) func configure(_ base:String,token:String,resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in VoiceCoordinator.shared.configure(base:base,token:token);resolve(nil)}}
  @objc(start:rejecter:) func start(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in do{try await VoiceCoordinator.shared.start();resolve(nil)}catch{reject("voice_start",error.localizedDescription,nil)}}}
  @objc(sendText:resolver:rejecter:) func sendText(_ text:String,resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in do{try await VoiceCoordinator.shared.sendText(text);resolve(nil)}catch{reject("voice_text",error.localizedDescription,nil)}}}
  @objc(syncState:resolver:rejecter:) func syncState(_ value:String,resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in if let result=(try? JSONSerialization.jsonObject(with:Data(value.utf8))) as? [String:Any]{VoiceCoordinator.shared.accept(["result":result])};resolve(nil)}}
  @objc(stop:rejecter:) func stop(_ resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in await VoiceCoordinator.shared.stop();resolve(nil)}}
  @objc(setMuted:resolver:rejecter:) func setMuted(_ value:Bool,resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in VoiceCoordinator.shared.setMuted(value);resolve(nil)}}
  @objc(readReview:resolver:rejecter:) func readReview(_ value:String,resolver resolve:@escaping RCTPromiseResolveBlock,rejecter reject:@escaping RCTPromiseRejectBlock){Task{@MainActor in if let data=(try? JSONSerialization.jsonObject(with:Data(value.utf8))) as? [String:Any]{VoiceCoordinator.shared.readReview(data)};resolve(nil)}}
}
