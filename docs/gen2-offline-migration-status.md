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

## Production backend cutover completed

The production refactor was run on June 8, 2026 with:

```powershell
node C:\Users\Nathaniel\supply_sgt\supply-sgt-app\node_modules\@aws-amplify\cli\lib\run.js gen2-migration refactor --to amplify-d32o5wudsuc2eh-gen2offlinemigration-branch-29274b3266 --skip-validations --yes
```

The first refactor attempt without `--yes` stopped before mutation because the CLI could not prompt in the non-interactive shell. The `--yes` run completed successfully.

Stateful resources now owned by Gen 2:

- Cognito user pool: `us-east-1_GzkyUvzWd`
- Cognito web client: `6orvthkmh7hmusd7iao6it08eu`
- Cognito identity pool: `us-east-1:412f871c-97a9-4e1f-95a5-2b362307a24e`
- S3 bucket: `supplysgtapp143c061359bc4407bdefc8dd9b6c476ea792b-dev`
- Auxiliary DynamoDB table: `dynamo4062985a-dev`

After refactor, `postRefactor();` was enabled in `amplify/backend.ts` and the Gen 2 backend was redeployed with `ampx pipeline-deploy`. Fresh outputs were written to:

```text
C:\Users\Nathaniel\supply_sgt\supplysgt-gen2-cutover-20260608-205803\gen2-post-refactor-outputs\amplify_outputs.json
```

Post-refactor outputs:

- AppSync API ID: `fog6zid7xjea7ar5sxtfla5a7m`
- AppSync endpoint: `https://t5y2iz5nxbgsxmd6zxtptsgvk4.appsync-api.us-east-1.amazonaws.com/graphql`
- Cognito user pool: `us-east-1_GzkyUvzWd`
- Cognito web client: `6orvthkmh7hmusd7iao6it08eu`
- S3 bucket: `supplysgtapp143c061359bc4407bdefc8dd9b6c476ea792b-dev`

Amplify Hosting app `d32o5wudsuc2eh` was updated so `SSGT_APPSYNC_GRAPHQL_ENDPOINT` points to the Gen 2 endpoint. A `main` release job (`5`) completed successfully.

Production verification:

- `https://supplysgt.net` returned HTTP 200 and served `static/js/main.a20a9570.js`.
- `https://www.supplysgt.net` returned HTTP 200 and served `static/js/main.a20a9570.js`.
- The production JS bundle contains the Gen 2 endpoint and does not contain the old Gen 1 endpoint.
- Browser smoke rendered the Amplify sign-in screen with no console warnings/errors.
- The sign-in password visibility switch toggled correctly.

Not yet completed in this checkpoint:

- Credentialed login/onboarding/roster/inventory/issue/return/accountability smoke was not run in-browser in this step.
- Gen 1 stateless stacks and holding stacks have not been decommissioned.
- The stale Gen 1 assessment false positive is still documented for historical context.

## Next cloud steps

1. Run the credentialed product smoke suite:
   - auth sign-in/sign-out;
   - onboarding and approval queues;
   - roster;
   - inventory;
   - issue/return hand receipts;
   - accountability online;
   - accountability offline check-in queue and reconnect sync;
   - storage downloads.
2. Watch CloudWatch/AppSync/Cognito errors through the first real user sessions.
3. Keep Gen 1 stateless resources and the old frontend rollback path available until post-cutover checks are clean.
4. Plan a separate cleanup step for old Gen 1 stateless stacks and Gen 2 holding stacks only after rollback confidence is high.
