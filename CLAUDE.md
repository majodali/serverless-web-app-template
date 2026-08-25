# CLAUDE.md

## Methodology — binding

This project follows majodali/methodology v1.3.0 as declared in
docs/classification.md. That file strictly defines this project's
document lifecycles and workflows. Read it before any work; nothing
in this file or under .claude/ overrides it.

Classification: C1 / S0 / template / none-local
Deviations: none

## What this project is

A GitHub template repository: a batteries-included starter for simple
web apps with a serverless AWS backend (React + Vite SPA, API Gateway +
Lambda TypeScript, DynamoDB, CDK, GitHub Actions OIDC deploy),
instantiated via "Use this template".

## Build / run / test

- `npm run typecheck` — backend, frontend, and infra workspaces
- `npm run build:frontend`
- `npm run synth` — CDK synth (the CI PR check is typecheck + build + synth)
- `npm run deploy` — build frontend, then `cdk deploy` (owner-run)

## Architecture at a glance

Static SPA on S3 + CloudFront (optional ACM/Route 53); REST calls hit
API Gateway (HTTP API) → Lambda → DynamoDB. Optional WebSocket module.
`infra/` (CDK) is authoritative for the stack shape; README carries the
diagram.

## Conventions

- Every feature ships with a diagnostics self-test
  (`frontend/src/diagnostics.ts`).
- This repo is a `template` project (Q-001): the shipped tree IS the
  scaffold — keep it form-audit-clean, because derivatives start as a
  copy of it. Derivatives re-classify first (docs/CUSTOMIZE.md step 0).

## Pointers

- docs/classification.md — the binding declaration (and the
  Derivatives declaration Q-001 requires)
- docs/backlog.md — what is done and what is next
- docs/CUSTOMIZE.md — the derivative's customization steps
- DEPLOY.md / docs/CI_DEPLOY.md — deployment paths
