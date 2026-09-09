import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import AppIntents

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "ContextFlow",
      in: window,
      launchOptions: launchOptions
    )

    if #available(iOS 16.2, *) { ContextFlowShortcuts.updateAppShortcutParameters() }
    return true
  }

  func application(_ application: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    guard url.scheme == "contextflow", url.host == "voice" else { return false }
    Task { @MainActor in
      do { try await VoiceCoordinator.shared.ensureSession(); try await VoiceCoordinator.shared.start() }
      catch { VoiceCoordinator.shared.emit("offline", error: error.localizedDescription) }
    }
    return true
  }
  func applicationDidBecomeActive(_ application:UIApplication) {VoiceCoordinator.shared.resumeRequestedStart()}
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
