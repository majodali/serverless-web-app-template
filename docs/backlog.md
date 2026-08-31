# Backlog

The single source of progress truth for this repo (methodology
[K-003](https://github.com/majodali/methodology/blob/v1.3.0/docs/rules/knowledge.md#k-003--the-backlog-is-the-single-source-of-progress-truth));
entries update in the same commit as the work they describe (W-003).

## Completed

- [x] **Template v1** — the starter itself, built before this register
  existed: React + Vite SPA, HTTP API + Lambda backend, DynamoDB,
  auth, the `items` example resource, diagnostics self-tests, CDK
  infra, GitHub Actions PR checks and OIDC deploy, optional WebSocket
  and custom-domain hosting modules (PR #1). Pre-adoption history
  lives in the git log.
- [x] **Methodology adopted** (2026-08-25) — Classification declared
  C1 / S0 / `template` / none-local, pinned 1.3.0, member of the
  `methodology` family; scaffolded with `mtool classify`. The
  [Derivatives declaration](classification.md#derivatives) discharges
  Q-001: declared derivative tier C1, checked by this repo's own form
  audits (the scaffold is the tree); fresh derivatives re-classify
  first ([CUSTOMIZE.md step 0](CUSTOMIZE.md)). This repo motivated
  the v1.3.0 `template` type and Q-001 itself.

- [x] **Migrated to methodology 1.4.0** — 2026-08-30; migration
  notes none mandatory, so the pin bump is the whole migration
  (scaffold copies inherit the new pin; Q-001 check unchanged).

## Upcoming

- [ ] **Q-001 at releases** — run the form audit on the tree as part
  of cutting any template release/tag, so the scaffold ships clean by
  ceremony, not by luck.
