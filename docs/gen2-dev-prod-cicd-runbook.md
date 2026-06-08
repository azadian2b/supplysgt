# Gen 2 Dev/Prod CI/CD Runbook

## Target State

- `develop` is the long-lived Gen 2 development branch.
- `main` is the production branch after Gen 2 validation and cutover.
- Amplify Gen 2 Hosting is Git-connected, not manual-hosted.
- `supplysgt.net` and `www.supplysgt.net` are attached only to the production branch after validation.
- Dev uses the Amplify branch URL first; `dev.supplysgt.net` can be added after the branch is stable.

## Current State

- The existing live app is Amplify Gen 1 app `d14zgqyeayi7ji`.
- The existing live backend environment is named `dev` and currently backs `supplysgt.net`.
- The current Gen 1 app uses manual hosting, so Gen 2 branch deployment should use a new Git-connected Amplify app.
- `develop` was created from commit `70e94f1c422c72f375fe21a4b14d4fc88765f5a4`, which contains the offline custody migration prep and DataStore removal work.
- The checked-in `amplify.yml` is the Gen 1 production/fullstack build spec. Replace it with the migration-generated Gen 2 `ampx pipeline-deploy` build spec on the generated Gen 2 branch.

## Rollout Sequence

1. Restore a working local command runner or run these commands in a local terminal with AWS credentials.
2. From `develop`, verify the Gen 1 migration readiness:

   ```powershell
   npm ci
   node node_modules/@aws-amplify/cli/lib/run.js gen2-migration assess
   ```

3. Push the DataStore/conflict-resolution removal and transitional schema changes to an isolated Gen 1 candidate environment only. Do not push this branch to the current live `dev` environment while `supplysgt.net` is still attached.
4. Lock the validated Gen 1 candidate environment:

   ```powershell
   node node_modules/@aws-amplify/cli/lib/run.js gen2-migration lock
   ```

5. Generate Gen 2 backend files on a dedicated branch from `develop`:

   ```powershell
   git checkout develop
   git checkout -b gen2-main
   node node_modules/@aws-amplify/cli/lib/run.js gen2-migration generate
   npm install
   git add .
   git commit -m "Generate Amplify Gen 2 backend"
   git push origin gen2-main
   ```

6. Create a new Git-connected Amplify app from `azadian2b/supplysgt`, initially connected to `gen2-main`. The migration tool-generated `amplify.yml` should run `npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID`.
7. After the Gen 2 candidate deploys, add/connect `develop` in the same Amplify Gen 2 app as the dev branch.
8. Run full product and offline validation on the Gen 2 candidate.
9. After validation, refactor stateful resources from the current Gen 1 environment into Gen 2 using the generated Gen 2 root stack name:

   ```powershell
   git checkout main
   amplify pull --appId d14zgqyeayi7ji --envName dev
   node node_modules/@aws-amplify/cli/lib/run.js gen2-migration refactor --to <gen2-root-stack-name>
   ```

10. Enable the generated post-refactor step in `amplify/backend.ts`, commit it, and deploy Gen 2 again.
11. Merge `gen2-main` into `main`, connect `main` as the production branch, and move `supplysgt.net` / `www.supplysgt.net` to the Gen 2 production branch.

## Required Validation

- `npm run build`
- `npm test -- --watchAll=false`
- `node node_modules/@aws-amplify/cli/lib/run.js gen2-migration assess`
- Amplify Gen 2 branch deploy for `develop`
- Login, onboarding, UIC approvals, roster, inventory, issue, return, accountability, storage download
- Offline preload, offline reload, soldier/equipment search, check-in queue, reconnect sync, duplicate batch idempotency

## Guardrails

- Do not delete or recreate the existing Cognito user pool, DynamoDB model tables, or S3 bucket.
- Do not move `supplysgt.net` until Gen 2 validation is complete.
- Do not run Gen 2 refactor until the candidate Gen 2 app passes product and offline smoke tests.
- Keep `uicID`, `assignedToID`, `equipmentItemID`, and other existing GraphQL field names stable for future Swift client compatibility.
