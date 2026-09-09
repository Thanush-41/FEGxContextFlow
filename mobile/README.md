# ContextFlow native app

React Native iOS and Android screens with a native Azure realtime voice coordinator, persistent demo task, blue light/dark themes, live sports and fictional credits.

See [the project setup guide](../README.md), [Siri handoff contract](../HANDOFF.md) and [actual QA coverage](../QA.md). The original HTML prototype is preserved in the parent folder.

- Leave sign-in/sign-up fields empty to enter a backend-issued demo session. Typed form values are discarded.
- Open `ios/ContextFlow.xcworkspace`, choose ContextFlow and the connected iPhone, and Run. Release includes its JavaScript bundle.
- For Metro development: `npm ci`, `npm start`, then `npm run ios` or `npm run android`.
- For an Android internal-demo APK: `cd android` and `./gradlew assembleRelease` using JDK 21.
- Start the independent backend from `../server` with `npm run dev` (port 3001). Set its reachable URL in the voice sheet's Connection settings.
- `npm run typecheck` and `npm test` run TypeScript and native UI/model tests. ContextFlowQA is the Xcode physical-device UI test scheme.

Azure settings remain exclusively in ignored backend configuration; the supplied `.env` is not imported or bundled by the mobile app. Transcripts stay in memory. Accepted research, task state, demo wallet, receipts and play controls persist on the backend.

This is an 18+ demo. No real payments or gambling are connected. APNs/FCM delivery and the external Siri research-producing workflow require their separate setup.
