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

## Cloud state as of June 8, 2026

The live Gen 1 `dev` backend was backed up before mutation. DynamoDB on-demand backups and metadata exports are stored outside the repo at `C:\Users\Nathaniel\supply_sgt\supplysgt-gen2-cutover-20260608-205803`.

The live API nested stack was updated to remove DataStore conflict resolution, keep transitional metadata fields, and add `AccountabilityCheckInEvent`. The parent root stack now points at the same deployed API artifact.

`amplify gen2-migration assess` still reports the DataStore/conflict-resolution advanced feature even though:

- local Gen 1 API metadata has no conflict-resolution config;
- live AppSync resolvers and data sources have no sync/conflict config;
- live API templates and stack resources have no DataStore/sync/conflict references.

Because of that detector false positive, `lock` and `generate` were run with `--skip-validations`. The Gen 1 environment is now locked by stack policy, and stateful DynamoDB/Cognito resources have retain/deletion-protection safeguards applied by the migration tool.

## Gen 2 candidate deployed

The Gen 2 candidate backend was deployed on the `gen2-offline-migration` branch of Amplify app `d32o5wudsuc2eh`.

- Candidate root stack: `amplify-d32o5wudsuc2eh-gen2offlinemigration-branch-29274b3266`
- Candidate AppSync API: `fog6zid7xjea7ar5sxtfla5a7m`
- Candidate GraphQL endpoint: `https://t5y2iz5nxbgsxmd6zxtptsgvk4.appsync-api.us-east-1.amazonaws.com/graphql`
- Candidate outputs: `C:\Users\Nathaniel\supply_sgt\supplysgt-gen2-cutover-20260608-205803\gen2-candidate-outputs\amplify_outputs.json`

The candidate AppSync data sources are mapped to the live Gen 1 model tables, including:

- `Soldier-qugplf4h6zc73kxb34z4zewev4-dev`
- `EquipmentItem-qugplf4h6zc73kxb34z4zewev4-dev`
- `EquipmentGroup-qugplf4h6zc73kxb34z4zewev4-dev`
- `EquipmentMaster-qugplf4h6zc73kxb34z4zewev4-dev`
- `HandReceiptStatus-qugplf4h6zc73kxb34z4zewev4-dev`
- `AccountabilitySession-qugplf4h6zc73kxb34z4zewev4-dev`
- `AccountabilityItem-qugplf4h6zc73kxb34z4zewev4-dev`
- `AccountabilityCheckInEvent-qugplf4h6zc73kxb34z4zewev4-dev`
- `UIC`, `User`, `UICMembershipRequest`, `UICCreationRequest`, and `AdditionalUIC` live tables with the same API suffix.

The candidate currently has its own pre-refactor Cognito user pool (`us-east-1_QwM8wBleO`). Existing production users remain in the live Gen 1 pool until the migration refactor adopts stateful resources. Production `supplysgt.net` and `www.supplysgt.net` still serve the `main` branch and returned HTTP 200 after the candidate deploy.

## Refactor checkpoint

A separate Gen 1 worktree was created at `C:\Users\Nathaniel\supply_sgt\supply-sgt-gen1-cutover` and hydrated with:

```powershell
node C:\Users\Nathaniel\supply_sgt\supply-sgt-app\node_modules\@aws-amplify\cli\lib\run.js pull --appId d14zgqyeayi7ji --envName dev --yes
```

Read-only refactor validation against the candidate stack was run with:

```powershell
node C:\Users\Nathaniel\supply_sgt\supply-sgt-app\node_modules\@aws-amplify\cli\lib\run.js gen2-migration refactor --validations-only --to amplify-d32o5wudsuc2eh-gen2offlinemigration-branch-29274b3266
```

Validation result:

- Passed: environment locked.
- Passed: Gen 1 and Gen 2 auth stack status.
- Passed: Gen 1 and Gen 2 DynamoDB storage stack status.
- Passed: Gen 1 and Gen 2 S3 storage stack status.
- Passed: deletion protection checks for refactorable stateful stacks.
- Passed: unchanged-stack checks for refactorable stateful stacks.
- Failed: assessment still reports stale `conflict-resolution` in `api/supplysgtapp/cli-inputs.json`.

The CLI does not allow `--skip-validations` with `--validations-only`. The next production-impacting command, if the stale assessment false positive is accepted, is:

```powershell
node C:\Users\Nathaniel\supply_sgt\supply-sgt-app\node_modules\@aws-amplify\cli\lib\run.js gen2-migration refactor --to amplify-d32o5wudsuc2eh-gen2offlinemigration-branch-29274b3266 --skip-validations
```

Do not run that command casually. It moves stateful production resources from Gen 1 CloudFormation ownership to the Gen 2 stack.

Rollback/hold commands to keep nearby before refactor:

```powershell
node C:\Users\Nathaniel\supply_sgt\supply-sgt-app\node_modules\@aws-amplify\cli\lib\run.js gen2-migration refactor --rollback --to amplify-d32o5wudsuc2eh-gen2offlinemigration-branch-29274b3266
node C:\Users\Nathaniel\supply_sgt\supply-sgt-app\node_modules\@aws-amplify\cli\lib\run.js gen2-migration lock --rollback
```

## Next cloud steps

1. Decide whether to accept the stale assessment false positive and run the supervised refactor command above.
2. After successful refactor, uncomment `postRefactor();` in `amplify/backend.ts` and redeploy the Gen 2 backend so generated outputs point at the adopted live Cognito, S3, and DynamoDB stateful resources.
3. Update the production `main` Amplify Hosting branch outputs/env vars and rebuild `main`.
4. Run the full smoke suite after production frontend rebuild:
   - auth sign-in/sign-out;
   - onboarding and approval queues;
   - roster;
   - inventory;
   - issue/return hand receipts;
   - accountability online;
   - accountability offline check-in queue and reconnect sync;
   - storage downloads.
5. Keep Gen 1 stateless resources and the old frontend rollback path available until post-cutover checks are clean.
