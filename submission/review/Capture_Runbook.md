# ContextFlow capture and stage runbook

9 September 2026 · review milestone · final human recording pending

## Prepare a dedicated sample task

1. Use the current FEG native build and the sample-only backend. Record the build hash, OS version and backend deployment version in the evidence log.
2. Use a dedicated demo identity. Preserve existing user tasks and receipts. In Menu → Settings, select the **Eligible adult** synthetic profile. This selector is a fixture, not age verification.
3. Confirm optional notifications are off. Record the device timezone. Do not change the clock merely to force a notification; demonstrate a suppression reason when applicable.
4. Use `fixtures/Northbridge_research_sample.txt`. Keep its source text separate from the user's instruction. Do not use real player data, current sports feeds or unrelated private research.
5. Prepare a clean Home Screen page containing the ContextFlow widget. Hide unrelated personal notifications for the recording. Keep an untouched original capture privately as evidence.
6. Use Northbridge FC / Eastport United, score 2–1, 67 minutes, home winner 1.85, one selection in accumulator mode. Initial stake 10.00 demo credits. Start with 1,250.00 demo credits for the clean reference take.
7. Verify microphone permission and speaker routing. Human recording must run normally, without `CONTEXTFLOW_QA_MUTED`. The QA harness deliberately starts muted and is not human-speech evidence.
8. Rehearse source import and voice start once before the timed run. Freeze the interface and build for the three consecutive acceptance runs.

## Record the 80-second native journey

| Target | Human action | Evidence to hold on screen |
|---|---|---|
| 0–12s | Import the fictional brief. Separately request “Open Northbridge FC and add home win with 10 demo credits.” | The source label, source age/time and separate user instruction. If using the built-in fixture, identify it as sample import; do not claim this proves the Siri shortcut. |
| 12–25s | Start or continue voice. | One home-winner selection, stake 10.00. Show the actual permission/opening behavior. |
| 25–38s | Say “Change that to five.” | Actual transcription and resulting stake 5.00. Preserve response latency. |
| 38–52s | Say “Review my slip.” | One selection, odds 1.85, stake 5.00, estimated return 9.25. No receipt yet. |
| 52–66s | Wait for readback to finish; say “Confirm demo bet.” | Actual receipt and 5.00 debit. Expected clean-fixture balance: 1,245.00. Do not invent the receipt ID. |
| 66–80s | Open the Home Screen / Lock Screen and expand Dynamic Island. | Same saved task and last action. Muted/stale labels remain visible. Show actual unlocking/opening requirements. |

Use a continuous native screen recording for evidence. If a take exceeds 80 seconds, adjust the stage narration or repeat the entire take; do not hide latency or splice a successful receipt onto a failed action. Cinematic plates belong at scene boundaries. Keep original recordings intact.

## Human acceptance record

Complete **three consecutive successful human-spoken runs**. A failure resets the consecutive count. Capture timestamp, build/backend version, input recording, selection count, reviewed stake/odds/return, exact receipt ID and result. The current typed QA runs do not fill these rows.

| Run | Human audio | Review matches receipt | Build / timestamp / receipt | Result |
|---|---|---|---|---|
| 1 | Pending | Pending | Pending | OPEN |
| 2 | Pending | Pending | Pending | OPEN |
| 3 | Pending | Pending | Pending | OPEN |

## Native surface and safeguard checks

- Inspect physical iPhone widget, Live Activity, compact and expanded Dynamic Island. Stop/mute and stale state must agree with the app. Widget refresh timing is OS-controlled.
- Inspect app backgrounding, process restart, network loss, old stored snapshots, lock/unlock and shortcut cold start. Do not claim a background action succeeded merely because its button exists.
- Android evidence currently comes from an emulator. Verify the foreground microphone notification, mute/stop, widget and restart behavior on a physical Android device before making physical-device claims.
- Demonstrate consent withdrawal and persistent off state; quiet hours across midnight; three-per-day cap; 60-minute interval; duplicate and stale candidates; every restricted profile; voice attempts to override age/exclusion; review invalidation after editing.
- Keep requested safety reminders, essential microphone stop controls and the ability to turn off match following available.
- Inspect VoiceOver/TalkBack, large text, touch targets, contrast, captions and reduced motion on the actual presenting devices. A labelled control is not a completed accessibility audit.

## Stage timing

The core eight slides take five minutes. Allow at most seven more minutes for the accompanying device walkthrough, leaving a three-minute buffer within 15 minutes. Advance slides manually; embed cinematic transitions inside the videos.

Before the opening, prepare one selection at 10.00 and warm the voice session. Say “Change that to five.” If no visible result arrives after eight seconds, say “I’ll show the recorded run” and play the labelled fallback. Never present the recording as live.

Keep the final MP4 and PDF locally available. The review deck currently contains stills and speaker notes; it does not yet contain finished motion or a certified human take.

## Final assembly and playback gate

After storyboard approval, generate two 360p Omni Flash 1.1 variants for each approved scene and finish only the selected clips at 720p where available. Keep exact native UI and typography separate. Assemble a 1920×1080 master, labelling source resolutions correctly. Use a cleared or original instrumental electronic score and duck it beneath speech.

In the presenting version of PowerPoint: test all embedded videos, poster frames, audio levels, manual slide advance, Presenter View, offline playback and the projector aspect ratio. PowerPoint is unavailable in this workspace, so this remains an explicit acceptance gate. Export the final PDF after the deck is locked.
