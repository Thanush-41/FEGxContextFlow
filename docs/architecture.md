# Architecture

ContextFlow is a React Native iOS/Android application backed by a sample-only API. The same versioned task contract is shared across touch, voice, and handoff entry points.

## Main components

- `mobile/`: React Native UI, native iOS extensions, Android services/widgets, encrypted demo identity, and WebRTC voice session.
- `shared/`: TypeScript/Zod contracts and validation schemas shared by clients and backend.
- `server/`: optional local NestJS API, SQLite demo state, action dispatcher, review invalidation, and idempotent receipt handling.
- `supabase/`: hosted Edge Function and database implementation used by the untethered demo.

## Data flow

External research and the user's requested action remain separate inputs. Both are validated into a versioned task. Touch, voice, and handoffs call the shared action rules. Eligibility and consent are checked before optional engagement features, while slip changes invalidate the prior review. Only an exact user confirmation after review can create a fictional demo receipt.

Long-lived Azure credentials remain on the backend. The app receives the minimum session material needed for realtime voice; locally persisted identifiers and task state use platform-protected storage. The FEG build serves fictional fixtures and demo credits only.

## Deployment assumptions

The checked-in hosted path uses Supabase Edge Functions/Postgres. The local path requires Node 24+ and SQLite. A production deployment requires operator-controlled identity, exclusion, event/market, settlement, notification, monitoring, and security integrations; none is represented as complete in this prototype.
