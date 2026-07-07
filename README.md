# Serverless Web App Template

A batteries-included starter for **simple web apps with a serverless AWS backend**,
developed on GitHub and deployed by GitHub Actions. Click **"Use this template"**
to start a new app.

## What you get

- ⚛️ **React + Vite SPA** frontend
- 🔌 **HTTP API (API Gateway) + AWS Lambda (TypeScript)** backend
- 🗄️ **DynamoDB** (on-demand, serverless)
- 🔐 **Auth** — admin-created accounts, bcrypt + JWT, change/reset password (no email needed)
- 📦 **One example CRUD resource** (`items`) to copy when adding your own
- 🧪 **Diagnostics page** — admin-only, runs live functional self-tests against the deployed API
- ☁️ **AWS CDK** infrastructure-as-code; one `cdk deploy`
- 🚀 **GitHub Actions** — PR checks (typecheck + build + synth) and deploy via **OIDC** (no stored AWS keys)
- 🌐 **Self-contained hosting** — S3 + CloudFront (+ optional Route 53 custom domain), HTTPS out of the box

## Architecture

```
Browser
   │
   ├─ Static SPA  ──►  S3 + CloudFront (+ ACM/Route53)      (the web app)
   │
   └─ REST calls  ──►  API Gateway (HTTP API) ─► Lambda ─► DynamoDB
                        auth, admin, health, example resource
```

## Optional modules & hosting

The template is designed to grow via toggles set in `infra/.env` (locally) or repo
**Variables** (CI). Everything is off/default until you opt in.

| Setting           | Values                              | Effect                                                                 |
| ----------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `ENABLE_WEBSOCKET`| `true` / `false` (default)          | Provisions a WebSocket API + connections table + `connect/disconnect/echo/broadcast` handlers, and adds a `wsUrl` to the runtime config. Frontend `AppSocket` client + a diagnostics test light up automatically. |
| `HOSTING_MODE`    | `cloudfront` (default) / `existing-bucket` | `cloudfront`: own S3 + CloudFront (+ optional domain). `existing-bucket`: deploy the SPA into an existing site bucket under `SITE_PATH_PREFIX` (never touches the rest of the bucket). |

The **WebSocket module** bakes in a hard-won lesson: never `PostToConnection`
during `$connect` (the socket isn't established yet — it 410s and deletes the
connection). Handlers reply to the first client message instead.

## Repo layout

```
backend/    Lambda handlers (TypeScript): shared lib + HTTP routes
frontend/   React + Vite single-page app (incl. the diagnostics page)
infra/      AWS CDK app that provisions the whole stack
docs/        DEPLOY, CI_DEPLOY (OIDC setup), CUSTOMIZE
.github/    CI + deploy workflows, PR template
```

## Quick start

```bash
npm install
npm run typecheck        # typecheck all workspaces
npm run build:frontend   # build the SPA
npm run synth --workspace infra   # synthesize the CloudFormation (no AWS needed)
```

To deploy, see **[DEPLOY.md](./DEPLOY.md)** (local) or
**[docs/CI_DEPLOY.md](./docs/CI_DEPLOY.md)** (GitHub Actions + OIDC).

## Make it yours

See **[docs/CUSTOMIZE.md](./docs/CUSTOMIZE.md)** — rename the app, set your
domain, and add your own resource by copying the `items` example.

## Conventions worth keeping

- **Every feature ships with a diagnostics test.** When you add an endpoint,
  add a step in `frontend/src/diagnostics.ts` that exercises it. Password/admin
  tests use non-mutating negative paths so a self-test can never lock you out.
- **Lambdas bundle as CommonJS** (`OutputFormat.CJS`) — some deps (e.g. bcryptjs)
  do dynamic `require()` of Node builtins that esbuild's ESM output rejects.
- **PR checks gate `main`;** deploy runs on merge to `main`.
