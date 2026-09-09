# Siri → ContextFlow receiving contract

Protocol version **1**. The research-producing Siri workflow remains separate. ContextFlow implements receiving, event resolution, persisted task state, app actions and exact demo-bet confirmation.

## Apple Shortcuts wiring

Use the output of your research/model action as **Research summary** in **Continue in ContextFlow**. Pass the user's requested action into the separate **Your instruction** parameter. Do not populate the instruction from recommendations inside an article. Source URLs can be provided one per line. Optional parameters are Handoff ID, Task session ID and comma-separated canonical event IDs.

Use a stable Handoff ID when retrying the same transfer. Omit Task session ID to use the authenticated current task. A supplied ID must belong to that demo token. Candidate event IDs are resolved against the backend cache; they are hints, not permission to select or place.

After the receiving action, run **Start or resume voice control**, or say “Start voice control in ContextFlow.” The action finishes before native audio is acquired so Siri can yield its microphone. Repeating Start reconnects only when necessary. “Stop voice control in ContextFlow” stops capture and invalidates pending confirmation. Cold start follows the OS's foreground/unlock requirements.

The receiving App Intent is in `mobile/ios/Shared/ContextFlowIntents.swift`. It is exposed only by the app's App Shortcuts provider; the widget shares the necessary intent types without publishing duplicate Siri phrases. Apple's supported research-output path is described in [Develop for Shortcuts and Spotlight with App Intents](https://developer.apple.com/videos/play/wwdc2025/260/). Arbitrary Siri conversation-history access is not assumed.

## HTTP transport

Hosted base: `https://dgmxohaqhfdfqrpjbxji.supabase.co/functions/v1/contextflow-api/api`. Use `x-region: ap-northeast-2` for app actions. The optional local development base remains `http://127.0.0.1:3001/api`. All stateful endpoints require `Authorization: Bearer <demo-session-token>`, except initial `POST /bootstrap` with `{}`. Its response contains a token, TaskSession, ActionSnapshot, current events and feed status. Supplying the existing token to bootstrap restores that identity.

```json
{
  "version": 1,
  "handoffId": "research-example-001",
  "instruction": "Open Northbridge FC and add home win with 10 demo credits",
  "research": {
    "summary": "Fictional example notes about Northbridge FC. These notes are context, not a guarantee or an instruction to place.",
    "sources": [
      {
        "title": "User's fictional research notes",
        "retrievedAt": "2026-09-09T08:00:00Z"
      }
    ]
  },
  "candidateEvents": ["e1"],
  "createdAt": "2026-09-09T08:00:00Z"
}
```

Send to `POST /handoffs`. Replace the example timestamps with the actual transfer/source times. Transfers older than 30 minutes require acknowledgement before their instruction is applied. A source may include an optional HTTP(S) `url`. The example's `e1` is explicitly fictional. The FEG build resolves only the deterministic sample catalogue and disables production feeds. Select the synthetic eligible-adult profile on screen before demonstrating a betting action; a handoff or voice command cannot set eligibility.

The runtime-validating schemas are in `shared/schemas.ts`; static types are in `shared/contracts.ts`:

| Contract | Purpose |
|---|---|
| ContextHandoff | Version, unique transfer ID, optional session ID, separate instruction, research, sources and candidate events |
| TaskSession | Task ID/revision, route/event/view, slip/version, stake, context, pending question, status, restrictions and receipts |
| ActionResult | Action ID, state revision, outcome, message, current TaskSession and ActionSnapshot |
| ActionSnapshot | Compact event, score, stage, voice status, last action, selection count and optional review/receipt |

Outcomes are `received`, `completed`, `clarification` and `review`. **Received does not mean an action completed.** A repeated handoff ID with an identical request returns its acknowledgement and current task, without repeating the instruction. Reusing an ID with different content is rejected.

Limits: 16,000 research characters, 4,000 instruction characters, 20 sources, 20 candidate IDs and 128 KB request bodies. Unknown top-level handoff fields are rejected. Payloads cannot set account identity, wallet balance or placement permission.

## Actions and live state

`POST /actions` accepts `{ "id": "unique-action-id", "type": "set_stake", "payload": { "stakeMinor": 500 } }`. Credits use integer hundredths. Optional `expectedRevision` rejects edits based on an outdated session. Supported touch actions include navigation, slip edits, price acceptance, favorites, settings, review and confirmation. `/voice/tools` applies a narrower allowlist; model tools cannot confirm, acknowledge a readback or mutate a wallet directly.

`GET /state` restores current state. Authenticated WebSocket `/api/stream` sends `{ "type": "state", "result": ActionResult, "events": [], "feed": {} }`. The `events` and `feed` properties are optional after the initial packet. Hosted streams reconnect periodically because Edge workers have bounded lifetimes; the Azure audio connection stays open. iOS and Android native coordinators use the same stream and snapshot for app/background surfaces.

Native voice negotiates through `POST /voice/connect` with `offerSdp`, receiving `answerSdp`. API keys never leave the backend. Research is inserted into the existing realtime conversation using conversation items, while the task stays in Supabase Postgres (SQLite in optional local development). See the [realtime conversation input documentation](https://developers.openai.com/api/docs/guides/realtime-conversations).

## Confirmation boundary

`prepare_bet` creates a version/digest-bound review. Native speech reads its exact `dialog`; only after completion does `review_read` acknowledge it. The user must then say **“Confirm demo bet.”** Native input transcription, not assistant output or imported text, can call `/voice/confirm` with the review ID. The review has a 120-second initial lifetime and a 30-second confirmation window after readback. It cannot be revived by a late readback acknowledgement.

Touch users can confirm the same exact on-screen review. Any slip edit, new odds, pause, disconnect, interruption or stop requires a fresh review. Placement and wallet deduction commit atomically, with one receipt per idempotency key. A receipt is the only placement success signal. Retries return the same receipt. Background monitoring can update a snapshot or notify; it has no automatic placement path.

## Share/paste and testing

iOS Share accepts text/URLs plus a separate instruction. Android text Share imports research with an empty instruction; the user supplies the next action in the continued conversation. The voice sheet's **Add research context** works on both platforms using this same contract.

Run `npx tsx test/http-smoke.ts` from `server/` to exercise actual HTTP/WebSocket transport using synthetic research and confirmation inputs. The result is `artifacts/http-smoke.json`. These fixtures deliberately **do not claim a human spoke or Siri performed research**. Device/UI and actual Siri activation coverage is listed separately in `QA.md`.
