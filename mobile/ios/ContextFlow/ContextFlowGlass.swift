import UIKit
import React

final class ContextFlowGlassSurface:UIView {
  private let material=UIVisualEffectView()
  @objc var darkMode:Bool=false {didSet{overrideUserInterfaceStyle=darkMode ? .dark:.light;refresh()}}
  override init(frame:CGRect){super.init(frame:frame);isUserInteractionEnabled=false;addSubview(material);refresh();NotificationCenter.default.addObserver(self,selector:#selector(refresh),name:UIAccessibility.reduceTransparencyStatusDidChangeNotification,object:nil)}
  required init?(coder:NSCoder){fatalError("init(coder:) has not been implemented")}
  override func layoutSubviews(){super.layoutSubviews();material.frame=bounds}
  @objc private func refresh(){
    if UIAccessibility.isReduceTransparencyEnabled {material.effect=nil;backgroundColor=darkMode ? UIColor(red:0.10,green:0.16,blue:0.25,alpha:1):UIColor(red:0.97,green:0.98,blue:1,alpha:1)}
    else {backgroundColor = .clear;if #available(iOS 26.0,*){material.effect=UIGlassEffect(style:.regular)}else{material.effect=UIBlurEffect(style:.systemThickMaterial)}}
  }
  deinit{NotificationCenter.default.removeObserver(self)}
}
@objc(ContextFlowGlassManager)
final class ContextFlowGlassManager:RCTViewManager {
  override static func requiresMainQueueSetup()->Bool{true}
  override func view()->UIView!{ContextFlowGlassSurface()}
}
