# ContextFlow implementation QA

**Update:** the backend now runs on Supabase. The current deployment, queue fixes, native checks and measurements are documented in [VOICE-QUEUE-QA.md](VOICE-QUEUE-QA.md). The report below records the earlier local-backend implementation, including its original device coverage.

Tested on **9 September 2026**. This report separates real device/provider behavior from synthetic contract fixtures.

## Builds and devices

| Target | Actual coverage |
|---|---|
| Physical iPhone 16, iOS 26.5.2 | Xcode Release built, signed and installed with widget and Share extensions. Native microphone permission, Azure WebRTC connection, mute/end, UI flows and Siri App Shortcut exercised. |
| Android | Release APK built successfully with JDK 21. Installed and exercised on `patient-mobile-test` / `emulator-5554`, 1080×2400. No physical Android hardware was attached. |
| Backend | NestJS build/typecheck passed. Node 24 SQLite persistence and real HTTP/WebSocket transport exercised on port 3001. |

The iPhone reaches this Mac through its wired IPv6 device tunnel. The tested Wi-Fi network did not allow the phone to reach the Mac LAN URL. Android reached the Mac's development backend. A stable reachable HTTPS endpoint is required for untethered use.

## Passed checks

- **15 backend tests:** decimal/single/accumulator arithmetic, owner authentication, handoff context/follow-up/deduplication, imported-text isolation, exact spoken-confirmation gate, one receipt/debit on retry, odds changes, invalidation, suspension, incompatibility, spending limit/pause, pending context, restart persistence, Arena copy, versioned schemas, old research, expiry/interruption and persistent casino restrictions.
- **20 React Native/model tests:** blank sign-in and sign-up, five-tab navigation, theme persistence, odds/slip controls and calculations, validation and accessible voice entry.
- **Five physical-iPhone UI flows passed together:** all three casino simulations plus Arena preview/accept/copy; odds → exact review → backend receipt; native voice connection/mute/end; five tabs and light/dark; actual Siri App Shortcut → foreground app → live Azure connection → stop.
- **Additional physical-iPhone handoff flow passed:** research entered separately from its requested action → requested Northbridge selection → “change that to five” → persisted 5-credit stake. Input was typed for this test; it was not Siri-generated research or a human-spoken placement.
- **Android emulator UI checks passed:** blank sign-in, five tabs, both themes, all three game rounds, Arena copying, Azure connection, mute/end, foreground microphone service and its ongoing notification while the Home screen was visible. Microphone denial produced a persistent explanation; permission was restored after the check.
- **Real HTTP/WebSocket integration passed:** research handoff, follow-up stake and Stats view, duplicate transfer, rejected model confirmation, readback gate, explicit simulated user confirmation, one receipt/debit, matching WebSocket snapshot, restored bootstrap, Arena copy and paused-play restriction.
- **Credential exclusion passed:** the supplied Azure endpoint, key and deployment values were compared against 731 files in the iPhone app, unpacked Android APK and original source backup; no matches were found. Environment files, database, backups and artifacts are ignored. Backend configuration is mode 0600.

Both native layouts were visually inspected. Screens fit the tested portrait viewports without unintended horizontal overflow. Sport/market selectors intentionally scroll horizontally. Modal background controls are hidden from accessibility while a sheet is open. Full VoiceOver/TalkBack audits, very large text and additional screen sizes remain to be tested.

## Latency measurements

These are individual development measurements, not service-level guarantees:

| Measurement | Observed result | Scope |
|---|---|---|
| iPhone tap → visible voice sheet | **≤1,512 ms** | XCUITest upper bound including its tap, idle wait and element-query overhead; not a frame-level measurement |
| iPhone tap → observed native active connection | **≤10,107 ms** | Includes cold connection and UI-test polling/permission checks |
| Android tap → observed active state | **12.19 s** | Emulator UI automation upper bound including snapshots/polling |
| Azure WSS open → configured session | **4,465 ms** | Actual provider connection in an isolated synthetic-speech test |
| Warm speech input end/commit → requested action | **2,319 ms** | Synthetic “Show live football” PCM streamed through actual Azure realtime into an isolated demo dispatcher; excludes mobile microphone, WebRTC, native UI and the native 500 ms VAD silence window |
| Warm deterministic follow-up HTTP action | **3.7 ms** | Local backend “change that to five”; not a speech-latency measurement |

A separate live provider/tool test navigated to the demo wallet through Azure realtime in approximately **9.18 seconds** including a new connection. Persistent native sessions avoid creating that connection on each spoken instruction. Dashboard data and deterministic reversible actions use cached state independently of voice setup.

## Siri and background boundaries

**Verified real path:** the physical iPhone's Siri recognized the installed ContextFlow App Shortcut, requested its one-time “Turn On” permission, then launched the app and established native Azure voice. XCUITest supplied the recognized phrase to Siri; this verifies the real system action/launch path, not a human microphone's Siri recognition accuracy. The initial duplicate shortcut publication and audio-ownership transition issues were fixed and the test then passed.

**Synthetic receiving tests:** typed research in the native app and JSON handoff fixtures passed. These verify persistence, reversible requested actions, continued context, restrictions and receipt consistency. The separate Siri research-producing workflow was not present in this project, so **a complete external research → receiving App Intent → human-spoken bet confirmation has not been certified**. `HANDOFF.md` supplies the integration parameters and examples needed by that work.

iOS widget and Live Activity/Dynamic Island code and the Share extension build and install. Android's service/notification background state was verified. Actual lock-screen/Dynamic Island visual presentation, widget placement, Share-extension UI, Bluetooth switching, phone-call interruption, prolonged network loss, iOS microphone denial and OS-killed-process behavior still need the corresponding device scenarios. Audio interruption/route handling and confirmation invalidation are implemented; backend interruption/expiry rules have automated coverage. No automatic placement path exists.

APNs/FCM credentials and delivery are not configured. Widgets can show cached/stale state when execution is suspended. iOS schedules local reminders; Android reminder timers require a running process/service. Remote updates while the app cannot execute remain dependent on push infrastructure and platform policy.

## Remaining product/backend work

- Connect and jointly test the external Siri research workflow; measure an actual human-spoken end-to-end journey on the intended networks and Bluetooth devices.
- Production authentication, authorized sports feed, durable event/market settlement, notification delivery, distribution signing and operations are outside this demo.
- Current demo identities each own one persistent task; this is not a production multi-account authentication system.
- Live feed coverage is best effort. Unavailable statistics/line-ups remain unavailable; research summaries are not relabeled as live data. No game or betting outcome is guaranteed.
- This is an 18+ fictional-credit implementation, with no real payments and no production EU-compliance claim.

## Reproducible evidence

- `server/test/actions.test.ts` — domain/reliability tests.
- `server/test/http-smoke.ts` and `artifacts/http-smoke.json` — real transport, synthetic handoff/confirmation.
- `server/test/realtime-latency.ts` and `artifacts/realtime-latency.json` — real Azure with synthetic speech; isolated state.
- `mobile/ios/ContextFlowUITests/ContextFlowUITests.swift` — device UI and Siri checks.
- `artifacts/ContextFlow-release-QA.xcresult` — five passing iPhone flows, screenshots included.
- `artifacts/ContextFlow-handoff-reviewed-QA.xcresult` — passing research/follow-up flow.
- `artifacts/ContextFlow-latency-device-QA.xcresult` — passing voice controls with timing upper bounds.
- `scripts/android-smoke.py`, `artifacts/android-qa/report.json` and screenshots — actual emulator coverage.
- `scripts/verify-secret-exclusion.py`, `artifacts/secret-exclusion.json` — byte-level private-setting comparison without exposing values.
