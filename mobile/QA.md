# Native prototype QA — September 9, 2026

## Builds and installation

- Xcode 26.6 Release build: **passed** for physical iOS and iOS Simulator.
- Installed and launched **com.contextflow.prototype** on the connected **iPhone 16, iOS 26.5.2**. The final installed app process was confirmed running after launch.
- Android `assembleRelease`: **passed** with SDK 36, NDK 28.2.13676358 and Kotlin 2.2.10. Output: `android/app/build/outputs/apk/release/app-release.apk`.
- Both Release variants contain their JavaScript bundles; Metro is not required to run them.
- Original `../index.html` and `../psk-original.html` retained. Original PSK backup SHA-256: `4cf9620ee9a7ff2be784ba9b01479ff1b01b8db5aa7050572a19fc9272a21c2b`.

## Automated checks

`npm run typecheck`: **passed**. `npm test`: **19 tests passed** across two suites.

- Blank sign-in and completely blank sign-up enter the fictional demo account.
- Live, Today, Sports, Casino and Menu navigation select the correct destination.
- Theme toggle stores the chosen theme.
- Selecting odds opens a slip and enables valid demo review.
- Accumulator example: `10 × 1.85 × 1.62 = 29.97` estimated return.
- Singles example: `10 × 1.85 + 10 × 1.62 = 34.70` estimated return, with `20.00` total stake.
- Removing picks and editing stake recalculate correctly.
- Empty, negative, non-finite, oversized and over-precision stakes are rejected.
- Changed odds require acceptance; suspended selections, insufficient balance, spending limits and paused play are enforced.

## Native visual and interaction checks

Verified on the iPhone 17 Pro simulator at native phone dimensions:

- Sign-in opens the live feed with untouched empty fields.
- Sign-up with empty name/email/password and the preview checkbox unchecked reaches the live home screen.
- Dark and light themes render native screens correctly. Light theme survives a full app relaunch. Featured-card links and live badges retain readable contrast in both themes.
- Live feed, persistent bottom navigation and bet-slip dock fit inside the phone viewport.
- Today’s match schedule and the Sports directory render correctly. Match cards open the event scoreboard, momentum chart and selectable market categories.
- Odds selection opens the native bottom sheet with stake, odds, profit and return.
- Review → Confirm Demo Bet produces a success screen, an open demo bet and the expected fictional wallet deduction.
- Arena → Copy Slip shows all picks and changed combined odds. Add is disabled until the current odds are acknowledged. Copying adds three selections to the slip without placing a bet; the estimate updates to `56.34 DC` at a `10 DC` stake.
- Neon Dice, Lucky Cards and Rocket Rise each load, enable their play action and resolve a simulated result with an updated game-point balance.

## Scope and limits

Physical iPhone installation and launch were verified. Detailed interaction and visual checks were performed in the iOS simulator. An Android APK was compiled; no physical Android device was available for hardware testing. Automated checks validate React component behavior and calculation logic, not production authentication or payments.

All accounts, scores, odds, bets and games are local simulations. Only the theme persists. Social authentication, deposits, live data, voice recognition, push notifications and account synchronization need backend or platform integrations before production use.
