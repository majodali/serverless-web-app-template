# Customizing the template

## 0. Re-classify — make the methodology declaration yours

Your fresh copy carries the *template's* own methodology declaration
([majodali/methodology](https://github.com/majodali/methodology)):
`docs/classification.md`, the `CLAUDE.md` Binding block, and
`docs/backlog.md` describe the template, not your app. Replace them
with your project's own declaration first — run
[`mtool classify`](https://github.com/majodali/methodology-tools) (it
scaffolds all three from your answers; typical fields for an app built
from this template: type `web-app`, target `serverless-aws`, the
C-tier you choose) or hand-edit the three files. If you don't follow
the methodology, delete the three files instead — an inaccurate
declaration is worse than none.

## 1. Name your app

Set `APP_NAME` in `infra/.env` (local) or as a repo **Variable** (CI). It's used
to name the CloudFormation stack and resources, so pick something short and
stable (e.g. `mynotes`). Update the `<title>` in `frontend/index.html` and the
brand text in `frontend/src/components/AppShell.tsx`.

## 2. Point it at a domain (optional)

Set `DOMAIN_NAME` (and `INCLUDE_WWW`) once you have a Route 53 hosted zone in the
same AWS account. Redeploy; CDK provisions the ACM cert + DNS. Use `us-east-1`.

## 3. Add your own resource (copy the `items` example)

`items` is a minimal per-user CRUD resource. To add e.g. `notes`:

1. **Backend** — copy `backend/src/http/listItems.ts`, `createItem.ts`,
   `deleteItem.ts` to `notes*` and adjust the shape. Add a table accessor in
   `backend/src/lib/ddb.ts` if you need a new table (or reuse `Items`).
2. **Infra** — in `infra/lib/app-stack.ts`, add the Lambda(s) with `makeFn(...)`
   and register routes with `route(...)`. If you add a table, define it like the
   `Items` table and `grantReadWriteData` to the relevant functions.
3. **Frontend** — add API methods in `frontend/src/api.ts` and a screen/component.
4. **Diagnostics** — add a step in `frontend/src/diagnostics.ts` that exercises
   the new endpoint end-to-end (create → read → delete). This is the convention:
   **every feature ships with a self-test.**

## 4. Optional modules

Toggle these in `infra/.env` (local) or repo **Variables** (CI):

- **WebSocket** — set `ENABLE_WEBSOCKET=true`. This provisions the WebSocket API,
  a connections table, and `connect/disconnect/echo/broadcast` handlers, and adds
  `wsUrl` to the runtime config. The frontend `AppSocket` client and the
  WebSocket diagnostics test activate automatically. Build your realtime feature
  on the `echo`/`broadcast` handlers (replace "all connections" with your own
  targeting). **Never `PostToConnection` in `$connect`** — reply to the client's
  first message instead.

- **Hosting** — `HOSTING_MODE`:
  - `cloudfront` (default): own S3 + CloudFront; set `DOMAIN_NAME` for a custom
    domain (needs a Route 53 zone; deploy in `us-east-1`).
  - `existing-bucket`: deploy the SPA into an existing site bucket under a path.
    Set `SITE_BUCKET_NAME` and `SITE_PATH_PREFIX` (e.g. `myapp` →
    `example.com/myapp`). The SPA is automatically built with the matching base
    path, and only objects under the prefix are ever written.

### Adding a new module

Keep the pattern: gate infra with a `config` flag, add the backend handlers,
surface any runtime values through `config.json`, feature-detect on the frontend,
and add a diagnostics step that only runs when the module is enabled.

## 5. Auth model

- Accounts are **admin-created** (no email/signup). The first admin is seeded on
  deploy from `ADMIN_USERNAME` / `ADMIN_PASSWORD`.
- Tokens are JWTs signed with a secret in Secrets Manager (injected as an env
  var). Password hashing is bcrypt.
- To allow self-signup instead, add a public `POST /signup` handler modeled on
  `adminCreateUser.ts` (drop the admin check) — and think about abuse controls.

## 6. Conventions to keep

- **CommonJS Lambda bundling** (`OutputFormat.CJS` in `app-stack.ts`). ESM output
  breaks deps that do dynamic `require()` of Node builtins (e.g. bcryptjs).
- **Runtime config**: the SPA fetches `/config.json` (written at deploy) for the
  API URL, so the build never hardcodes environment URLs.
- **Non-mutating self-tests** for anything destructive (password changes, deletes
  of real data) — assert the validation/negative path so diagnostics is safe to
  run against production.
- **PR checks gate `main`; deploy runs on merge.** Keep PRs cohesive (one feature).
