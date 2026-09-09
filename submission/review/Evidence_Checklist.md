# ContextFlow evidence checklist

Review checkpoint: 9 September 2026. This package is ready for storyboard review; final submission acceptance is still open.

| Requirement | Status and evidence | Remaining work |
|---|---|---|
| Five-minute story + four appendices | Prepared. Twelve editable slides and speaker notes; rendered and visually inspected. | Rehearse live timing after media assembly. |
| Master prompt, eight slide briefs, six scenes | Prepared and checked against existing assets, product evidence and published Flow controls. | Joint storyboard approval; inspect every generated render independently. |
| Still-image plates | Three generated blank-screen device plates visually inspected. Phone is generic staging; Watch and Mac are concepts. | Approve art direction. |
| Production sports-feed isolation | 34 passing backend tests include local/Edge, poisoned-cache, refresh and event-detail checks with network interception. Edge v14 is deployed; remote check returns ten sample events, consent off and unknown eligibility. | Observe final native network traffic at the frozen presentation build. |
| Persistent consent + synthetic eligibility | Implemented in shared contracts, migration, stored session and shared action handler. Old tasks/receipts preserved; consent defaults off and eligibility unknown. | Real identity, exclusions, legal bases and production integration remain external dependencies. |
| Notification safeguards | Tests pass for withdrawal, overnight timezone boundaries, caps, minimum interval, deduplication, stale/future candidates and restricted profiles. Native iPhone capture shows “Last decision: consent off.” | Verify actual OS delivery/denial behavior and local clock transitions on presenting devices. An allowed decision is a delivery attempt, not proof of OS delivery. |
| Voice cannot override eligibility | Tests block touch, voice, tool and handoff play for restricted profiles; voice cannot choose a registry fixture or grant consent. Restricted users can still stop following an event. | Demonstrate the spoken override attempt during the final human run. |
| AI identification and context explanation | Updated physical iPhone capture shows AI label, user instruction, requested action, source label/age/time and required confirmation. | Keep these visible in final footage. Recommendation rationale/uncertainty is a production requirement if recommendations are added. |
| Native builds | Android Release build passed and installed on emulator. iPhone Release QA build passed and installed on physical iPhone. Build archives and hashes are in `../builds/`. | Freeze final source and rerun relevant checks after any further change. |
| Mobile regression | 29 mobile tests and type checking pass at this checkpoint. | Additional native lifecycle/accessibility checks below. |
| Physical iPhone task journey | One automated typed QA journey passed: fictional source import, 10.00 → 5.00, exact touch review/confirmation, receipt, consent suppression. | This is not a human-spoken acceptance run and contains no final demonstration MP4. |
| Matching review and receipt | Captured receipt **CF-87867C8E**: stake 5.00 demo credits, estimated return 9.25, balance 1,245.00 from 1,250.00. Review shows home winner at 1.85. | Repeat with three consecutive human-spoken runs on the frozen build. |
| iPhone widget + compact Dynamic Island | Updated physical capture shows the same match, five-credit action and consistent muted indication. Source now preserves timestamps and adds stale indicators. | Lock-screen Live Activity, expanded island, stale expiry, restart, cold start, permission and opening/unlocking behavior need explicit final inspection. |
| Android device status | Emulator screenshots show sample-only data, off-by-default consent and synthetic-profile controls. | Physical Android, widget, foreground microphone controls and restart inspection remain open. |
| Accessibility | Labelled controls, voice alternatives and reduced-motion behavior are implemented. | VoiceOver/TalkBack, large text, contrast, touch targets and captions need device verification. No conformance claim. |
| Three consecutive human-spoken runs | OPEN — zero certified runs. | Complete the three-row record in `Capture_Runbook.md`; a failure resets the count. |
| Impact workbook | Formula edits, blank contribution, invalid FX, zero adoption, arithmetic and export/reimport recalculation checked. All three sheets visually inspected. | Usage calibration, deployed SKU/invoice rates, identity-service quotes and pilot baselines are visibly unresolved. |
| Compliance note | One-page requirement/control/evidence/dependency map prepared and rendered. | FEG legal review before production; real consent/identity/exclusion systems and accessibility audit. |
| Flow motion + score | OPEN — zero Flow video generations. | Joint storyboard review, two drafts per approved scene, independent render scoring, final compositing and cleared/original score. |
| Embedded videos + standalone MP4 | OPEN. The current PPTX is a still-image storyboard review edition. | Assemble after the approved motion and human recording exist. Preserve original screen recordings. |
| PDF fallback | Twelve-slide review fallback exported; the seven-page scene storyboard is separate. | Export again from the locked final deck. |
| Presenting PowerPoint offline playback | OPEN — PowerPoint unavailable here. | Test embedded media, poster frames, audio, Presenter View, manual advance and offline projector playback in the presenting application. |

## Evidence locations and limits

- `assets/FEG-02-research-import.png`: current physical iPhone source/instruction card.
- `assets/FEG-03-follow-up.png`: typed input and exact five-credit action, with microphone paused.
- `assets/surface-detail.png`: lossless crop of the updated physical home widget and compact Dynamic Island. The full home screen stays in the private working captures.
- `assets/FEG-05-exact-review.png` and `assets/FEG-06-receipt.png`: exact review and committed sample receipt.
- `assets/FEG-08-suppression.png`: consent-off decision. The final excluded-profile screenshot missed the register after scrolling and is not used as visual evidence; backend restricted-profile tests remain valid.
- Full test logs, original captures and formula receipts are preserved in `../working/`. Earlier failed captures are not presented as successful evidence.

The successful iPhone capture preceded the v14 deployment. Version 14 was separately checked for sample catalogue and safe session defaults; repeat the final human/device journey after freezing the backend. The workspace received concurrent voice-panel changes, so build hashes identify the delivered checkpoint more reliably than an evolving source directory.

## Pilot measurement contract

Propose 1,000 eligible adult participants, equal control/treatment assignment, 30 days of exposure and later retention follow-up. Pre-register useful-open and task-success definitions. Measure app opens, DAU/MAU, widget adoption, surface engagement and retained consent; keep off-app task completion separate. Track opt-outs and harmful-play indicators alongside value. The FEG workbook supplies historical betting sessions and separate front-end measures, not app-open or widget baselines. Pilot size is a proposal, not a completed power calculation.
