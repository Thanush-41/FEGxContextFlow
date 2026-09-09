# Hosted ContextFlow backend

Base URL: `https://dgmxohaqhfdfqrpjbxji.supabase.co/functions/v1/contextflow-api` (clients append `/api/...`).

The native apps use HTTPS, Supabase Edge Functions and Postgres. Azure still supplies the realtime model/audio. The model has not been moved onto the phone or fine-tuned. Blank demo sign-in/sign-up obtain or restore an app-issued random demo token; no personal information is requested by the backend.

## Functions and persistence

One deployed function, `contextflow-api`, routes every existing API. It runs app/database actions in `ap-northeast-2`; the same function performs authenticated internal live-feed requests in `eu-central-1`. The public sports provider returned HTTP 403 from Seoul and returned current data from Frankfurt. Feed refresh and event-detail retrieval are routed through Frankfurt and cached in Postgres. This has no local-machine relay.

| Method | Path after `/api` | Purpose |
|---|---|---|
| GET | `/health` | Service/voice/feed status |
| POST | `/bootstrap` | Blank demo authentication and restored state |
| GET | `/state` | Task, slip, wallet, receipts and feed |
| GET / WebSocket | `/stream` | Authenticated state synchronization |
| POST | `/actions` | Navigation, slip, casino, settings, review and touch confirmation |
| GET | `/events/:id` | Cached event plus regional provider details |
| POST | `/feed/refresh` | Regional live feed refresh |
| POST | `/handoffs` | Idempotent Siri/share/paste research handoff |
| POST | `/voice/connect` | Azure WebRTC negotiation |
| POST | `/voice/tools` | Restricted app-action functions |
| POST | `/voice/command` | Typed command when native voice is not connected |
| POST | `/voice/confirm` | Exact spoken demo confirmation |
| POST | `/internal/feed` | Service-role-only regional feed retrieval |

Except health/bootstrap, app routes require `Authorization: Bearer <demo-token>`. The function gateway has `verify_jwt=false` because these are opaque app-issued demo tokens; the handler authenticates their SHA-256 hashes before any session operation. Internal feed retrieval additionally requires the runtime service-role secret and the European execution region. Anonymous/publishable keys cannot read the app's state tables or invoke its database functions.

App-owned tables use the `contextflow_` prefix. Existing `players` and `bets` tables are untouched. Row-level security is enabled; only the service role accesses these tables and RPCs. The shared action engine computes a candidate state; a Postgres row lock, revision check and unique action ID atomically commit state, wallet debit, receipt and idempotency record. A conflicting update is recalculated against the current state, with a bounded retry count. Completed action IDs never execute twice.

## Deploy

Requires Node 24+. Configuration is in ignored `server/.env`: the three `AZURE_OPENAI_*` settings plus `SUPABASE_URL` and `SUPABASE_ACCESS_TOKEN`. The supplied `ACCESS_TOKEN_SECRET` was a Supabase deployment token, not an application signing secret. No database password or Supabase management token is bundled in the app.

```sh
npm ci --prefix shared
npm ci --prefix server
node scripts/build-edge.mjs
node scripts/deploy-edge.mjs
```

The deploy script applies the app-owned SQL migration, sets Azure Edge secrets, and uploads the generated function. Supabase supplies the service-role runtime configuration. Use `node scripts/deploy-edge.mjs --function-only` when SQL/secrets have not changed. Edit `server/edge/handler.ts`, `server/src/` and `shared/`, then rebuild; do not hand-edit the generated function bundle.

The timestamped source backup before this change is `backups/contextflow-before-edge-turn-fix-20260909-091435.tar.gz`. It excludes environment files, dependency trees and build output. `scripts/migrate-demo-state.mjs` imported six local demo tasks and 392 action records, preserving their tokens and leaving the local source database intact. Its inserts preserve existing cloud records; it is a one-time import, not bidirectional synchronization.

## Turn handling

Typed input inside an active voice session is added to that same native WebRTC conversation. VAD detects speech; native coordinators create responses explicitly after speech is committed. Each completed response's tool calls finish before one continuation is requested. Interruption closes outstanding function calls with cancelled results and discards late callbacks; it does not replay those calls. A newer cold typed command also invalidates earlier cold commands across Edge workers. Stop remains available; stalled turns have a bounded deadline.

Touch actions preserve order. Pending navigation/stake edits are coalesced; a connection failure cancels the remaining queue instead of allowing a timeout for each queued command. Navigation chosen during initial backend loading survives the later bootstrap snapshot.

The exact review, digest/version binding, expiry, changed-odds invalidation and explicit user confirmation are unchanged. A model tool or imported research cannot place a demo bet.

## Operational limits

- This is a demo backend and fictional-credit ledger, not production gambling infrastructure or a claim of EU compliance.
- Initial Azure connection and cloud cold starts take longer than subsequent turns. Cloud hosting does not imply zero latency.
- State WebSockets reconnect before Edge worker expiry. The app's own action response is immediate after its commit; other surfaces receive state on a two-second polling cadence. Event catalogs refresh separately.
- The public sports feed can become unavailable or change its API. Cached timestamps remain visible; stale/suspended selections cannot pass placement validation. A production product needs an authorized, supported feed.
- APNs/FCM and the separate Siri research-producing workflow are not configured by this change. The existing receiving App Intent uses the hosted API.
- Android device coverage is emulator-only. Physical iPhone coverage and measured voice limitations are listed in the QA report.
