# Voice turn and Supabase migration QA

Verified 9 September 2026. This report covers the queue fixes and hosted backend migration. Earlier local-backend evidence is retained in `QA.md`; it is not evidence that every Siri/background scenario was repeated against the cloud.

## Delivered

- The release app on the connected iPhone and the Android release build use `contextflow-api` on Supabase Edge Functions. Deployment version 9 is active. Azure supplies realtime inference and audio.
- All existing backend API routes are hosted, including bootstrap, state, actions, feed, event details, handoffs, voice negotiation, tools, typed commands and spoken confirmation. Postgres holds task state, action deduplication and fictional-credit receipts.
- Six existing local demo sessions and 392 action records were imported without replacing existing cloud records. The local SQLite source remains intact.
- The pre-change source backup is `backups/contextflow-before-edge-turn-fix-20260909-091435.tar.gz`; it excludes secrets and generated artifacts.
- Setup, route inventory and deployment commands are in [SUPABASE.md](SUPABASE.md). The receiving interface and sample handoff payloads are in [HANDOFF.md](HANDOFF.md).

## Queue causes and corrections

1. Cancelled HTTP tools could leave unanswered function calls in the Azure conversation. The agent then described a session refresh as still running. Native coordinators now close abandoned calls with an explicit cancelled function result, ignore late callbacks and do not replay interrupted actions.
2. Tool execution and response creation could overlap. Each response's completed tool batch now executes in order and requests one continuation. Native turn ownership, duplicate-response checks, a tool-call cap and a deadline prevent an indefinite loop.
3. Typed instructions could create a separate model connection during an active voice conversation. They now enter the existing native WebRTC conversation and retain its context.
4. Initial bootstrap could finish after a newer navigation action and overwrite it. Actions now await the shared bootstrap, and stale snapshots cannot replace newer session revisions. A pending route retains its own version.
5. A serial Android network executor could delay tools behind negotiation. Independent network requests now use a bounded pool. Touch mutations remain ordered; superseded pending navigation/stake edits coalesce, and a failed connection cancels the remaining queue.
6. The model could refuse a reversible draft stake edit after the session spending allowance was exhausted. Instructions now distinguish draft edits from placement. The backend still enforces limits during review/placement.

Stop and interruption invalidate pending voice confirmation. A typed message, model tool or imported research cannot satisfy spoken confirmation. Receipt success is announced only after the backend commits it.

## Verification

| Check | Result and evidence |
|---|---|
| Physical iPhone 16, iOS 26.5.2, Release build | Final Xcode suite: **4 tests, 0 failures** in 95.414 seconds; `artifacts/ContextFlow-isolated-cloud-QA.xcresult` |
| Consecutive native instructions | Same connected voice session: “set my stake to five” → “change that to ten” → “change that to three”; each correct backend action appeared; End remained available |
| iPhone app regression | Five tabs, light/dark themes, all three casino rounds, Arena preview/copy, odds selection, exact demo review and receipt passed in the final suite |
| Blank demo authentication | Test launches enter through blank demo sign-in when presented; Android smoke also verifies it. iOS tests now use isolated demo identities without replacing the normal Keychain token |
| Android | Release APK built and installed on an emulator. Five tabs, themes, blank sign-in, casino, Arena, active voice, mute, foreground service and stop passed. A subsequent run passed the three native follow-up instructions; `artifacts/android-edge-qa/report.json`, `artifacts/android-final-voice/report.json` |
| Hosted HTTP/WebSocket journey | Research handoff, follow-up stake, stats route, duplicate handoff, readback gate, receipt, matching streamed receipt, restoration, Arena and paused-play validation passed; `artifacts/edge-http-smoke.json` |
| Concurrent placement/retries | Five simultaneous identical confirmations produced one debit and one receipt. Concurrent state changes committed without losing revisions; `artifacts/edge-concurrency.json` |
| Cancelled-tool recovery with real Azure | Deliberately abandoned `get_session`, closed it with a cancelled output, then completed three typed instructions on one connection. One action tool per turn; spending allowance set to zero to verify draft edits remain possible; `artifacts/voice-cancelled-followups.json` |
| Speech input | A real Azure session completed a typed instruction and two synthetic PCM follow-ups; `artifacts/voice-followups.json`. See the recognition limitation below |
| Live feed in cloud | Public provider returned 403 from Seoul. A service-role-protected Frankfurt invocation of the same function returned 30 live events and refreshed the Postgres cache, with no local relay; `artifacts/edge-regional-feed.json` |
| Access control | All six app-owned tables have RLS and deny direct anonymous/authenticated client access. Unauthenticated state and internal-feed calls returned 401; `artifacts/edge-security.json` |
| Secret exclusion | 1,155 source/archive/bundle files checked, including native release outputs and generated Edge source; zero matches for supplied credential values; `artifacts/secret-exclusion.json` |
| Automated code checks | Backend build and 15 action tests passed; mobile typecheck and 26 tests passed; Swift turn-gate checks and two Android turn-gate unit tests passed |

The early HTTP smoke reported zero live events before regional feed retrieval was implemented. The later dedicated feed check and final native tests used the regional cloud path. Test fixtures remain available as clearly fictional demo events.

## Measured latency

These are observed development runs, not a percentile benchmark or an instant-response promise. Native UI measurements include XCTest interaction/polling overhead. An action becoming visible and the agent finishing its spoken response are different milestones.

| Measurement | Observed |
|---|---|
| Final iPhone warm typed input through the native voice conversation → correct visible stake | **2.893 / 2.686 / 2.672 seconds** |
| Real Azure cancelled-tool recovery → hosted action completion | 3.618 / 2.215 / 2.142 seconds |
| Same recovery run → completed model reply | 4.640 / 3.384 / 3.248 seconds |
| Regional action HTTP requests | Many warm calls around 1.1 seconds; full timing list in `artifacts/edge-concurrency.json` |
| Forced live-feed refresh through Frankfurt | 3.685 seconds |
| Initial connection | Roughly 4–5 seconds in direct Azure test runs; Android tap-to-observed-ready smoke was 13.44 seconds, including UI test overhead |

The UI immediately clears submitted text and keeps Stop available. That visual acknowledgement is implemented but was not independently benchmarked during the final suite. Model/network time still exists; moving the API to the cloud does not eliminate it.

## Test isolation and cleanup

Earlier physical iPhone casino tests consumed 50 demo credits of the original session's spending allowance and changed game points by a net +38. Only those five recorded QA rounds were compensated through the same atomic commit mechanism. The configured 100-credit limit, 1,230-credit wallet and original ticket receipts were left unchanged. Evidence: `artifacts/qa-compensation.json` and the idempotent compensation record.

Subsequent iOS tests create an isolated demo identity per app process using the XCUITest launch environment. Normal launches continue to use the original Keychain identity. After QA, the app was relaunched on the connected iPhone with normal identity handling and voice stopped; `artifacts/iphone-final-launch.json`.

## Coverage boundaries

- Physical Android hardware was not available; Android coverage is emulator-only.
- No full human-microphone Siri-generated research → ContextFlow → spoken placement journey was certified in this migration. Hosted handoff tests supply contract fixtures; native follow-up tests type into the live Azure conversation with the microphone muted. The existing Siri research producer remains separate.
- A later synthetic-audio run misrecognized “ten” as “two.” The cancelled-call regression was consequently isolated with typed inputs, and passed. This is not a claim of perfect speech recognition; exact review and explicit confirmation remain necessary before any demo placement.
- Background microphone/notification service presence was checked on Android. Bluetooth, lock-screen operation, phone calls, network loss and all Siri audio-ownership transitions were not comprehensively repeated against this deployment.
- APNs/FCM configuration is still required for remote updates while the application cannot execute. State synchronization polls every two seconds and reconnects before Edge worker expiry; Azure audio uses a separate connection.
- Public sports-feed availability and formats can change. Source timestamps and unavailable/stale states remain visible. This is fictional-credit demo software, without a production regulatory-compliance claim.

## Reproduce

```sh
npm run build --prefix server
npm test --prefix server
npm run typecheck --prefix mobile
npm test --prefix mobile
python3 scripts/verify-secret-exclusion.py
```

The existing Xcode `ContextFlowQA` scheme runs the device UI suite. Cloud HTTP tests are in `server/test/http-smoke.ts` and `server/test/edge-concurrency.ts`; real Azure follow-up tests are in `server/test/voice-followups.ts` (use `--cancelled` for the abandoned-call case). Android UI scripts are `scripts/android-smoke.py` and `scripts/android-voice-followups.py`. Use separate demo sessions for mutation tests. Azure tests make real inference requests.
