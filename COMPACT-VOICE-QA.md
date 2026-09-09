# Compact voice controls and action navigation

Verified on 9 September 2026. Source backup: `backups/contextflow-before-compact-voice-20260909-102506.tar.gz` (no secrets, dependencies or generated builds).

## What changed

- The home voice entry starts the microphone directly. The top transcript/keyboard sheet no longer opens automatically. One bottom glass control shows microphone state, the completed transcription and the completed action, growing with its content. Long text can scroll. Typing remains an optional accessibility fallback under **Voice options → Type instead**.
- iOS uses `UIGlassEffect` on iOS 26, with material/opaque fallbacks for older systems and Reduce Transparency. Android uses the same layout with a tinted surface. Both themes remain available.
- “Show me the live matches today” opens the matching list. “Open the first match” uses exactly the same filtering/order as the visible list. Team queries with no results show an empty list instead of substituting another event.
- Touch-selected events immediately update the native agent context. A follow-up such as “add home win with five demo credits” uses that event rather than an older research candidate. “Change that to ten” updates the stake. “Place it with ten” prepares the exact review; it does not bypass confirmation.
- A delayed acknowledgement of touch navigation no longer closes newly opened voice options. Stale state from another session is ignored. VAD state distinguishes recording from processing; completed tool results appear before the spoken response finishes.
- Tool failures preserve the specific backend message and terminate the outstanding turn, avoiding an unhelpful generic failure/retry loop. External-app requests such as Instagram receive a clear Siri handoff explanation.

Mobbin was the only visual research source used for this revision: [corner](https://mobbin.com/screens/7927b2f6-d5c6-4f1f-9a11-fb7a17a7f520) informed compact recording status, and [Claude](https://mobbin.com/screens/9050ce03-46a9-48d6-91d1-252df02272e7) informed distinct microphone/stop controls. The resulting interface is original.

## Findings from the reported lag

Some transcripts reached the agent without a navigation action. General live-list phrasing was not consistently resolved to an app action, and the model could describe search results without opening the list. Follow-ups could also refer to an older event because touch updates reached the conversation later. A separate route-acknowledgement bug caused the options sheet to disappear after manually opening an event. These paths now have explicit dispatch/context handling and regression coverage.

This does not establish that every possible speech delay is eliminated. Initial Azure/WebRTC connection, transcription, network transport and speech generation still take time. The UI acknowledges a tap immediately and displays the action result when received.

## Verification

| Check | Result |
| --- | --- |
| Server TypeScript build and action/security tests | Passed; 33 tests |
| Mobile type check and Jest suites | Passed; 29 tests |
| Connected iPhone 16, iOS 26.5.2, Release build | Passed; two targeted XCUITests, zero failures |
| Native agent journey | Start session → typed live-list request → first event → manually select Metro Falcons → request home win with 5 → change to 10 → matching slip → stop |
| Navigation and themes | All five tabs; light and dark screenshots captured |
| Android | Release APK build and debug unit tests passed; no new Android UI/device test in this revision |
| Hosted API | Supabase Edge function version 13 active; sequential list/event/selection/review requests passed |
| Secret exclusion | 1,602 artifact/archive files checked against configured private values; zero matches |

The iPhone test sent text through the real Azure realtime connection while the microphone was muted to prevent surrounding speech affecting the test. It exercised the actual model/tool/native navigation path. It is not a test of a person's spoken audio or the full external Siri research workflow.

Latest direct hosted API timings: list **1,116 ms**, open first **1,107 ms**, add selection/stake **1,125 ms**, prepare review **1,126 ms**. The review contained the requested 10-credit stake and did not create a ticket. These measurements cover HTTP action completion, not end-to-end spoken latency or a statistical latency benchmark. An earlier run, including missing-team and external-app requests, is in `artifacts/compact-voice-edge-actions.json`.

Xcode results: `artifacts/ContextFlow-compact-voice-final.xcresult`. Screenshots: `artifacts/compact-voice-final-screens/`. The final tested Release app was installed and reopened on the connected iPhone; launch receipt: `artifacts/compact-voice-final-launch.json`.

The device build used an ignored APFS copy in `mobile/ios-voice-qa/` to avoid a concurrent Siri/widget task changing shared Pods during compilation. The source fixes are also present in the normal `mobile/ios/` project. The tested app is `mobile/build/ios-voice-qa/Build/Products/Release-iphoneos/ContextFlow.app`.

## Try on the iPhone

1. Open Live and tap **Start voice control**, or tap the bottom microphone.
2. Say “Show me the live matches today.”
3. Say “Open the first match,” or tap a match yourself.
4. Say “Add home win with five demo credits,” then “Change that to ten.”
5. Ask to review the slip. Confirm only after the exact review has been read. Stopping, interruption or edits invalidate an earlier review.

Existing sample-account restrictions remain enforced. If testing draft selections, use the eligible-adult demo sample in Settings. Voice does not change eligibility or bypass spending/session restrictions.

## Scope and remaining coverage

- This build currently uses fictional hackathon sample events. A real team such as Barcelona can correctly return no matches. Production sports data was not enabled by this change.
- The browser Live page opened in this task is the preserved standalone HTML prototype. It does not share the native microphone session or demonstrate these native fixes.
- Human microphone recognition, Bluetooth, lock-screen/background interruptions and a complete Siri-generated research handoff were not newly certified here. Previous coverage is recorded separately in `VOICE-QUEUE-QA.md` and `QA.md`.
- Instagram is outside the internal sports agent's action set. Siri remains responsible for opening external apps and producing external research.
- Demo placement still requires the exact confirmation and a backend receipt. No automatic placement was added.
