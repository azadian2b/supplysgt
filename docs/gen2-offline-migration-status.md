# Gen 2 Offline Migration Status

## Implemented on this branch

- Removed direct web runtime usage of Amplify DataStore.
- Added Apollo Client v3 with persisted cache support.
- Added an IndexedDB-backed offline custody repository for:
  - active/pinned UIC snapshot storage;
  - soldier/equipment custody rows;
  - active hand receipt/session data;
  - queued accountability check-in events.
- Added `AccountabilityCheckInEvent` to the GraphQL schema as an append-only offline check-in event model.
- Added transitional `_deleted`, `_version`, and `_lastChangedAt` fields to every model so existing DynamoDB metadata remains queryable after conflict resolution is disabled.
- Removed the generated DataStore model artifacts from `src/models`.
- Added Amplify CLI v14.5.0 as a dev dependency for deterministic migration commands.

## Not pushed to cloud in this branch

The current Amplify environment is `dev`, and `dev` backs `supplysgt.net`. Do not run `amplify push` from this branch against `dev` without a release decision.

Local backend files are prepared to disable conflict resolution, but the deployed `dev` backend still has conflict resolution enabled. `amplify gen2-migration assess` will continue to report the DataStore/conflict-resolution blocker until the backend change is pushed to an isolated environment or the live environment is intentionally migrated.

## Next cloud steps

1. Create or select an isolated Amplify environment/app for the migration candidate.
2. Push the local API update there to deploy:
   - disabled conflict resolution;
   - transitional metadata fields;
   - `UICCreationRequest` operations if they were missing in the deployed API;
   - `AccountabilityCheckInEvent`.
3. Run:
   - `node node_modules/@aws-amplify/cli/lib/run.js gen2-migration assess`
   - `node node_modules/@aws-amplify/cli/lib/run.js gen2-migration lock`
   - `node node_modules/@aws-amplify/cli/lib/run.js gen2-migration generate`
4. Deploy the generated Gen 2 candidate to a separate Amplify Hosting app/branch because the current app uses manual hosting.
5. Run the full smoke suite before refactor or production cutover:
   - auth sign-in/sign-out;
   - onboarding and approval queues;
   - roster;
   - inventory;
   - issue/return hand receipts;
   - accountability online;
   - accountability offline check-in queue and reconnect sync;
   - storage downloads.
