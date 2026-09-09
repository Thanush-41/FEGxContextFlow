# ContextFlow

**Team:** ContextFlow · **Challenge:** FEG Challenge 02 · **Repository owner:** `Thanush-41`

ContextFlow is a native context layer that carries a user-selected task between research, voice, the app, and operating-system surfaces while preserving consent, eligibility, review, and explicit confirmation.

Latest voice revision: [compact controls, navigation fixes and device QA](COMPACT-VOICE-QA.md). The current hackathon build uses fictional sample events. Start voice from the home card or bottom microphone; typing and connection settings are under **Voice options**.

Native React Native iOS/Android demo with deterministic fictional sports, demo credits, a persistent research-to-action task and Azure realtime voice. The original HTML prototypes are preserved in `index.html` and `psk-original.html`.

The app owns navigation, selections, stake and review. Siri supplies external research through an explicit App Intent. Research is evidence; the separately supplied user instruction determines the action. The agent can prepare a demo bet, but only an exact user confirmation can place it.

## Hosted backend

The native apps now use Supabase Edge Functions and Postgres. The deployed base URL is `https://dgmxohaqhfdfqrpjbxji.supabase.co/functions/v1/contextflow-api`. The Mac is not required for API, voice tools, stored demo state or sample-state refresh. See [Supabase setup and routes](SUPABASE.md) and [queue-fix QA](VOICE-QUEUE-QA.md).

## Optional local backend

Use Node **24+** (SQLite is built into Node). From this directory:

```sh
npm ci --prefix shared
npm ci --prefix server
cd server
npm run dev
```

The independent NestJS backend listens on **3001**. Its SQLite database is in `server/data/`. A timestamped backup of the earlier sources, excluding credentials, dependencies and build products, is in `backups/contextflow-before-voice-20260909-070535.tar.gz`.

`server/.env` already contains the three supplied Azure settings, copied from the supplied mobile environment file. They were verified against the Azure realtime service. Both environment files are ignored; the mobile app does not import either file. For a fresh checkout, create `server/.env` using `server/.env.example` and configure `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY` and `AZURE_OPENAI_REALTIME_DEPLOYMENT`. Never add those values to React Native configuration.

To run the compiled server, use `npm run build` followed by `npm start` from **server/**. Keep that working directory so the fixture/database paths resolve.

## Run the native app

```sh
cd mobile
npm ci
# Install iOS pods with your configured Ruby/CocoaPods environment:
cd ios
pod install
```

Open `mobile/ios/ContextFlow.xcworkspace` in Xcode. Choose **ContextFlow**, your development team and the connected iPhone, then Run. The Release configuration bundles JavaScript and does not need Metro. The installed app's bundle ID is `com.contextflow.prototype`; its widget and Share extensions are embedded. App Groups and shared Keychain signing must be available to your team.

For a development build with Metro, run `npm start` in `mobile/`, then `npm run ios` or `npm run android` in another terminal. Android needs JDK 21, SDK 36 and the SDK path in `mobile/android/local.properties`.

```sh
# Android standalone internal-demo APK
cd mobile/android
./gradlew assembleRelease
```

APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`. It uses the template development signing key; store distribution needs production signing.

On either platform, **empty sign-in and sign-up fields work**. Entered form values are discarded. A random backend-issued demo token is stored in iOS Keychain or Android Keystore-encrypted preferences. The task, demo receipts, balances, casino game points and play controls survive reconnects and app restarts. Offline preview remains browsable, but a sports bet requires a backend receipt.

## Device connection

Open the voice sheet → **Connection settings** to inspect or change the backend URL. Both native builds default to the deployed HTTPS Edge API. A one-time upgrade migration preserves the existing demo token after its state was imported into Supabase. Local development remains available at `http://10.0.2.2:3001` for the Android emulator or a reachable Mac URL for an iPhone.

Changing the backend host creates a fresh demo identity rather than forwarding a token to a different host. Ordinary reconnects to the same host retain the task. The configured Supabase backend supports untethered use. Development HTTP allowances are enabled in the native projects; remove them for distribution.

## Try the connected flow

1. Sign in with empty fields. In Menu → Settings, choose the **Eligible adult** synthetic demo profile; this is not real age verification. Optional match alerts default off. Tap **Start voice control**, allow microphone access, then say “Show live football.”
2. Use **Add research context**, the iOS Share extension, Android text Share, or the **Continue in ContextFlow** App Intent. Research and the requested action are separate fields.
3. A reproducible fictional example is “Open Northbridge FC and add home win with 10 demo credits.” Continue with “change that to five” or “show the stats.”
4. Say “Review my slip.” Native speech reads the exact selections, stake, odds and estimated return. After it finishes, say **“Confirm demo bet.”** Edits, changed prices, expiration, stopping or an audio interruption invalidate the review.
5. Use the voice dock while browsing. Stop ends microphone capture and leaves the task saved. A new connection restores state without replaying completed actions.

The main voice task is limited to sports/application controls. It does not browse the web, choose a stake or outcome on its own, or play casino games. Casino controls remain touch-operated simulations with separate game points and the same spending restriction.

## Connected screens

Sign-in, sign-up, recovery, optional demo verification and onboarding; Live dashboard; Today; sports directory and filters; search; event detail, markets, stats and line-ups; slip sheet/full page, review and receipt; casino lobby and Neon Dice/Lucky Cards/Rocket Rise; Arena and copy preview; profile, wallet, open bets, history, promotions, notifications, settings, appearance, odds format, help, responsible play, reminders and exclusion information. The five tabs remain Live, Today, Sports, Casino and Menu. Blue light/dark themes and the original native screens are retained.

The persistent voice entry, dock and expanded session add status, independent mute/end controls, an in-memory conversation, research sources, clarification and exact review. iOS includes a Home Screen widget, Live Activity/Dynamic Island, App Shortcuts and a Share extension. Android includes a microphone foreground service, ongoing notification with mute/stop, and a Home Screen widget.

## Research and architecture

Only Mobbin was used for visual pattern research: [Gemini's transcript and distinct microphone/end controls](https://mobbin.com/screens/9362deca-d1dd-4492-bbe1-6c04b8bb5c01), [Matter's compact audio controls](https://mobbin.com/screens/0b904b91-7534-4504-aad0-d3d898ef0c1e), and [Notion's source beside a summary](https://mobbin.com/screens/1be86f23-19d6-449e-8aaa-6184bc511294). The interface and artwork remain original.

`shared/contracts.ts` and `shared/schemas.ts` define versioned TypeScript/Zod contracts. `server/src/actions.ts` is the shared touch/voice/handoff dispatcher. SQLite transactions and owner-scoped idempotency keys protect receipts and fictional-credit mutations. One cached event repository backs dashboard, search, details and validation. The FEG build disables all production sports-feed requests, ignores live caches and serves only ten fictional fixtures. Unavailable stats and line-ups are disclosed.

The Azure realtime session uses versioned instructions and a restricted tool allowlist. Long-lived API keys remain on the backend; SDP negotiation is brokered by the backend. Native WebRTC owns microphone/background lifecycle. The full conversation is held only in memory (last 12 displayed turns). The latest user instruction, accepted research, consent and task state are persisted. Use only fictional inputs for the FEG demonstration. Shortcuts explicitly transfers model output; the app cannot read arbitrary Siri conversation history.

See [HANDOFF.md](HANDOFF.md) for the Siri integration contract and examples, and [QA.md](QA.md) for actual test coverage and remaining device checks.

## Verification

```sh
cd server
npm run build
npm test
npx tsx test/http-smoke.ts  # needs the development backend running
cd ../mobile
npm run typecheck
npm test
```

The **ContextFlowQA** Xcode scheme runs physical-device UI tests. Siri tests require the one-time iOS permission to enable ContextFlow shortcuts. `artifacts/` contains local test results and screenshots and is ignored by source control.

## Boundaries

This is an **18+ demo**, with no real-money placement or payment integration and no claim of production EU regulatory compliance. The live offer adapter is a public, best-effort development source; production needs an authorized feed, reliable event/market lifecycle, authentication, settlement, operational controls and security review. No statistics are inferred from imported research and presented as live feed data.

The separate Siri workflow must supply the research. APNs/FCM credentials and a notification delivery service are still required for remote updates while the app cannot execute. iOS background audio depends on an explicitly started session and OS permissions; cold microphone start can require opening/unlocking the app. Widgets may show a stale snapshot when execution is suspended. Android reminders run while the process/service is alive; iOS schedules local reminders. Bluetooth/call interruption and OS termination need broader hardware QA. No Watch or Mac companion app is included.

## FEG submission review

The storyboard, prompt pack, illustrative impact model and compliance note are in `submission/review/`. Optional alerts require persistent consent and an eligible synthetic profile; the proposed defaults are device-local 22:00–08:00 quiet hours, three alerts daily and a 60-minute gap. The shared action handler enforces eligibility for touch, voice and handoffs. Production sports data and identity services are outside this build. Final human-spoken recordings, device inspection and PowerPoint playback remain acceptance gates.

Reviewer documents: [architecture](docs/architecture.md), [impact case](docs/impact-case.md), [compliance note](docs/compliance-note.md), and [dependencies and AI-use disclosure](docs/dependencies.md). The editable impact workbook, presentation materials, screenshots, evidence checklist, and detailed compliance PDF are in [`submission/review/`](submission/review/).
