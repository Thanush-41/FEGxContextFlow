import XCTest

final class ContextFlowUITests:XCTestCase {
  var app:XCUIApplication!
  override func setUpWithError() throws {
    continueAfterFailure=false;app=XCUIApplication(bundleIdentifier:"com.contextflow.prototype");app.launchEnvironment["CONTEXTFLOW_QA"]="1";if name.contains("testFEGStoryboard") || name.contains("testCompactVoiceActionJourney"){app.launchEnvironment["CONTEXTFLOW_QA_MUTED"]="1"};app.launch()
    addUIInterruptionMonitor(withDescription:"ContextFlow permissions"){alert in
      for title in ["Allow","OK","Allow While Using App"] {if alert.buttons[title].exists{alert.buttons[title].tap();return true}}
      return false
    }
    if app.buttons["sign-in-button"].waitForExistence(timeout:6){app.buttons["sign-in-button"].tap()}
    XCTAssertTrue(element("tab-live").waitForExistence(timeout:15),app.debugDescription)
    element("tab-menu").tap();let settings=app.buttons["App settings"].firstMatch;reveal(settings);settings.tap()
    let profile=app.buttons["Use eligible-adult sample"].firstMatch;reveal(profile);XCTAssertTrue(profile.waitForExistence(timeout:10));profile.tap();sleep(2);element("tab-live").tap()
  }
  func element(_ id:String)->XCUIElement { app.descendants(matching:.any).matching(identifier:id).firstMatch }
  func screenshot(_ name:String){let a=XCTAttachment(screenshot:app.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
  func reveal(_ item:XCUIElement){for _ in 0..<8 {if item.isHittable{return};app.swipeUp()}}
  func typedVoice(_ command:String) {
    app.buttons["voice-options"].tap();app.buttons["Type instead"].tap()
    let input=app.textFields["Type an instruction"];XCTAssertTrue(input.waitForExistence(timeout:5));input.tap();input.typeText(command)
    app.buttons["Send instruction"].tap()
  }
  func testCompactVoiceActionJourney() {
    app.buttons["start-voice-card"].tap()
    XCTAssertTrue(element("voice-dock").waitForExistence(timeout:5))
    XCTAssertFalse(app.textFields["Type an instruction"].exists)
    XCTAssertFalse(app.staticTexts["Your context. In action."].exists)
    XCTAssertTrue(app.buttons["Unmute microphone"].waitForExistence(timeout:40))
    for (command,expected) in [("Show me the live matches today","Showing"),("Open the first match","Opened Northbridge")] {
      let start=Date();typedVoice(command)
      XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@",expected)).firstMatch.waitForExistence(timeout:20))
      print("QA compact voice action ms: \(Int(Date().timeIntervalSince(start)*1000))")
    }
    XCTAssertTrue(app.staticTexts["Northbridge FC"].firstMatch.exists);screenshot("Compact-voice-event")
    // A touchscreen choice becomes the next voice turn's context immediately.
    element("tab-live").tap();let match=app.buttons["Open Metro Falcons versus Harbor Wolves"].firstMatch;reveal(match);XCTAssertTrue(match.exists);match.tap()
    typedVoice("Add home win with five demo credits")
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS 'Added Metro Falcons'")).firstMatch.waitForExistence(timeout:20))
    typedVoice("Change that to ten")
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS 'Stake set to 10.00'")).firstMatch.waitForExistence(timeout:20))
    app.buttons["voice-slip"].tap();XCTAssertTrue(app.staticTexts["Metro Falcons"].firstMatch.waitForExistence(timeout:5));screenshot("Compact-voice-slip")
    app.buttons.matching(identifier:"Close dialog").allElementsBoundByIndex.last?.tap()
    app.buttons["End voice session"].tap()
    XCTAssertTrue(app.buttons["voice-mic"].exists)
  }
  func testCasinoAndArena() {
    for (id,action,result) in [("dice","Roll the dice","Rolled"),("cards","Draw a card","Drew"),("rocket","Launch the rocket","Flight")] {
      element("tab-casino").tap();let card=app.buttons["game-open-\(id)"].firstMatch;reveal(card);card.tap()
      let play=app.buttons[action];reveal(play)
      XCTAssertTrue(play.waitForExistence(timeout:10));sleep(1);play.tap()
      XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label BEGINSWITH %@",result)).firstMatch.waitForExistence(timeout:12));screenshot("Casino-\(id)")
    }
    element("tab-menu").tap();app.buttons["open-arena"].tap()
    let copy=app.buttons["Copy Slip"].firstMatch;reveal(copy);copy.tap()
    let accept=element("I reviewed the current odds");reveal(accept);accept.tap()
    let add=app.buttons["copy-add-button"];reveal(add);add.tap()
    XCTAssertTrue(app.buttons["place-demo-bet"].waitForExistence(timeout:10));screenshot("Arena-copied-slip")
    let clear=app.buttons["Clear all"];reveal(clear);clear.tap();app.alerts.buttons["Clear all"].tap()
  }
  func testScreensAndTheme() {
    screenshot("Home-dark")
    for tab in ["today","sports","casino","menu","live"] {element("tab-\(tab)").tap();XCTAssertTrue(element("tab-\(tab)").exists);screenshot(tab)}
    app.buttons["theme-toggle"].tap();screenshot("Home-light");app.buttons["theme-toggle"].tap()
    XCTAssertTrue(app.buttons["start-voice-card"].exists)
  }
  func testPresentation() {
    element("tab-live").tap()
    if app.buttons["theme-toggle"].label=="Switch to dark mode" {app.buttons["theme-toggle"].tap()}
    XCTAssertTrue(app.buttons["start-voice-card"].exists)
    sleep(4);screenshot("ContextFlow-ready-on-iPhone")
  }
  func testNativeVoiceConnection() {
    let tapTime=Date()
    app.buttons["start-voice-card"].tap()
    XCTAssertTrue(element("voice-dock").waitForExistence(timeout:5))
    print("QA visual acknowledgement upper bound ms: \(Int(Date().timeIntervalSince(tapTime)*1000))")
    // Trigger interruption handling for the system microphone prompt if shown.
    let system=XCUIApplication(bundleIdentifier:"com.apple.springboard")
    for title in ["Allow","OK","Allow While Using App"] {if system.alerts.buttons[title].waitForExistence(timeout:1){system.alerts.buttons[title].tap()}}
    let predicate=NSPredicate(format:"label == 'Listening' OR label == 'Speaking' OR label == 'Thinking' OR label == 'Microphone muted'")
    let connected=app.staticTexts.matching(predicate).firstMatch
    let ready=connected.waitForExistence(timeout:35)
    if !ready { if app.buttons["Connection settings"].exists {app.buttons["Connection settings"].tap();app.swipeUp()};screenshot("Voice-connection-diagnostics");print(app.debugDescription) }
    XCTAssertTrue(ready,"Native WebRTC did not reach an active state. Inspect screenshot/error text.")
    print("QA tap to observed native connection upper bound ms: \(Int(Date().timeIntervalSince(tapTime)*1000))")
    screenshot("Native-voice-connected")
    if app.buttons["Mute microphone"].firstMatch.exists {app.buttons["Mute microphone"].firstMatch.tap()}
    XCTAssertTrue(app.staticTexts["Microphone muted"].waitForExistence(timeout:5));screenshot("Native-voice-muted")
    app.buttons["End voice session"].firstMatch.tap();screenshot("Native-voice-ended")
  }
  func testDemoSlipFlow() {
    app.buttons["Search matches"].tap()
    let input=app.textFields["Team, player, league…"]
    XCTAssertTrue(input.waitForExistence(timeout:5));input.tap();input.typeText("Northbridge")
    let odd=app.buttons["odd-e1-winner-0"];XCTAssertTrue(odd.waitForExistence(timeout:10));if odd.isSelected {app.buttons["open-bet-slip"].tap()}else{odd.tap()}
    let place=app.buttons["place-demo-bet"]
    for _ in 0..<5 {if place.isHittable{break};app.swipeUp()}
    XCTAssertTrue(place.waitForExistence(timeout:5));place.tap()
    let confirm=app.buttons["confirm-demo-bet"];XCTAssertTrue(confirm.waitForExistence(timeout:10));screenshot("Exact-demo-review");confirm.tap()
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS[c] 'recorded' OR label CONTAINS[c] 'placed' OR label CONTAINS[c] 'You’re in'")).firstMatch.waitForExistence(timeout:10));screenshot("Demo-receipt")
  }
  func testSiriStartsNativeVoice() {
    XCUIDevice.shared.press(.home)
    XCUIDevice.shared.siriService.activate(voiceRecognitionText:"Start voice control in ContextFlow")
    // Enable the system's first-use ContextFlow Siri prompt before this test.
    XCTAssertTrue(app.wait(for:.runningForeground,timeout:35),"Siri did not foreground ContextFlow.")
    if app.buttons["sign-in-button"].exists {app.buttons["sign-in-button"].tap()}
    let dock=element("voice-dock")
    XCTAssertTrue(dock.waitForExistence(timeout:35),"The Siri App Shortcut did not start native voice.")
    XCTAssertTrue(element("voice-dock").exists)
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label == 'Listening' OR label == 'Speaking' OR label == 'Thinking' OR label == 'Microphone muted'")).firstMatch.waitForExistence(timeout:35),"Siri started the task but Azure voice did not connect.")
    screenshot("Siri-AppShortcut-native-voice")
    app.buttons["End voice session"].firstMatch.tap()
  }
  func testResearchHandoffContinuity() {
    app.buttons["start-voice-card"].tap()
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label == 'Listening' OR label == 'Speaking' OR label == 'Thinking' OR label == 'Microphone muted'")).firstMatch.waitForExistence(timeout:35))
    app.buttons["Mute microphone"].firstMatch.tap()
    let add=app.buttons["Add research context"];reveal(add);add.tap()
    let research=app.textViews["Research summary"];reveal(research);research.tap();research.typeText("Fictional QA research, supplied as context only.")
    let instruction=app.textViews["Your requested action"];reveal(instruction);instruction.tap();instruction.typeText("Open Northbridge FC and add home win with 10 demo credits")
    let send=app.buttons["Continue with this context"];reveal(send);send.tap()
    XCTAssertTrue(app.staticTexts["RESEARCH CONTEXT"].waitForExistence(timeout:12))
    let command=app.textFields["Type an instruction"];reveal(command);command.tap();command.typeText("change that to five")
    let submit=app.buttons["Send instruction"];reveal(submit);submit.tap()
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS 'Stake set to 5.00'")).firstMatch.waitForExistence(timeout:10))
    for _ in 0..<6 {app.swipeDown()};screenshot("Research-and-follow-up")
    app.buttons["End voice session"].firstMatch.tap()
  }
  func testSequentialVoiceTextInstructions() {
    app.buttons["start-voice-card"].tap()
    XCTAssertTrue(app.buttons["Mute microphone"].waitForExistence(timeout:40));app.buttons["Mute microphone"].tap()
    for (command,amount) in [("set my stake to five","5.00"),("change that to ten","10.00"),("change that to three","3.00")] {
      typedVoice(command)
      XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@", "Stake set to "+amount)).firstMatch.waitForExistence(timeout:20))
    }
    screenshot("Consecutive-compact-voice");app.buttons["End voice session"].tap()
  }

  func testFEGStoryboard() {
    screenshot("FEG-01-sample-home")
    app.buttons["start-voice-card"].tap()
    XCTAssertTrue(app.buttons["Unmute microphone"].waitForExistence(timeout:40))
    app.buttons["voice-options"].tap()
    let load=app.buttons["Load fictional research example"];reveal(load);XCTAssertTrue(load.exists);load.tap();sleep(3)
    app.buttons["voice-options"].tap();screenshot("FEG-02-research-import")
    let typed=app.buttons["Type instead"];reveal(typed);typed.tap()
    let command=app.textFields["Type an instruction"];reveal(command);command.tap();command.typeText("change that to five")
    let send=app.buttons["Send instruction"];reveal(send);send.tap()
    XCTAssertTrue(app.staticTexts.matching(NSPredicate(format:"label CONTAINS '5.00'")).firstMatch.waitForExistence(timeout:20));sleep(2);screenshot("FEG-03-follow-up")
    XCUIDevice.shared.press(.home);sleep(2);screenshot("FEG-04-home-live-session")
    app.activate();app.buttons["voice-stop"].tap();sleep(2)
    app.buttons["voice-slip"].tap();let place=app.buttons["place-demo-bet"];reveal(place);place.tap()
    let confirm=app.buttons["confirm-demo-bet"];XCTAssertTrue(confirm.waitForExistence(timeout:10));screenshot("FEG-05-exact-review");confirm.tap();sleep(2);screenshot("FEG-06-receipt")
    element("tab-menu").tap();let settings=app.buttons["App settings"].firstMatch;reveal(settings);settings.tap();screenshot("FEG-07-consent")
    let testAlert=app.buttons["Test optional match alert"];reveal(testAlert);testAlert.tap();sleep(2);screenshot("FEG-08-suppression")
    let restricted=app.buttons["Use self-excluded sample"];reveal(restricted);restricted.tap();sleep(2);screenshot("FEG-09-excluded")
  }

}
