# SupplySGT CI/CD Promotion Runbook

## Current production truth

- `supplysgt.net` currently serves the Amplify Gen 1 app whose checked-in environment is named `dev`.
- The `dev` backend contains live Cognito users, AppSync data, DynamoDB model tables, and S3 files.
- Do not create a fresh `prod` backend and point the domain at it unless a separate user/data/file migration has been planned and verified.

## Branch and environment contract

- `main` is the production web branch.
- `develop` is the persistent development web branch.
- `gen2-offline-migration` remains the isolated Gen 2/offline candidate branch.
- The first production cutover preserves the current live backend resources as production truth, even though the Amplify Gen 1 environment is still named `dev`.
- The `develop` branch must not be connected to the current live `dev` backend. Create a new backend environment for development before enabling fullstack deploys there.
- Gen 2 migration work must use a blue/green candidate app or branch before any production domain cutover.

## Amplify Hosting setup

1. Connect the GitHub repository to Amplify Hosting.
2. Add the `main` branch and use the repository `amplify.yml` build spec.
3. Connect `main` to the existing backend environment that currently serves `supplysgt.net`.
4. Confirm the production branch runs:
   - `amplifyPush --simple`
   - `npm ci`
   - `CI=true npm test -- --watchAll=false`
   - `npm run build`
5. Attach `supplysgt.net` and `www.supplysgt.net` only to the validated production branch.
6. Add `develop` after production is green and after a separate development backend environment exists. Use the Amplify default branch domain or `dev.supplysgt.net`.
7. Keep the previous manual-hosting deployment available as rollback until the Git-connected production branch is verified.

## Pre-cutover checks

- `npm ci`
- `npm test -- --watchAll=false`
- `npm run build`
- `amplify status`
- Sign in with the production smoke-test account.
- Smoke onboarding, roster, inventory, issue, return, hand receipt, accountability, and sign-out.
- Verify the connectivity toggle can switch offline mode and inventory/accountability screens show cached data behavior.

## Post-cutover checks

- `https://supplysgt.net` loads the production branch.
- `https://www.supplysgt.net` loads the production branch.
- Production sign-in succeeds.
- Auth, AppSync, and Storage still point at the intended live resources.
- The development branch does not serve either production custom domain.

## Gen 2 guardrails

- Do not run `amplify push` from `gen2-offline-migration` against the live `dev` backend without an explicit release decision.
- Run `amplify gen2-migration assess` before each Gen 2 candidate deploy.
- Use a separate Gen 2 candidate app or branch when manual hosting prevents attaching a Git branch to the existing app.
- Refactor/adopt stateful resources only after offline, auth, data, storage, and rollback tests are green.
