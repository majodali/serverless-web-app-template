# Classification

The binding declaration (methodology vocabulary: *Classification*) —
this project follows
[majodali/methodology](https://github.com/majodali/methodology).
Adopted 2026-08-25, alongside the v1.3.0 `template` type it motivated
(the practices' reference implementation; the gap analysis that showed
derived projects start non-compliant unless the template ships
compliance). Field definitions and omission defaults live in the
methodology vocabulary, the sole authoritative location for them.

- **C-tier**: C1
- **Pinned methodology version**: 1.3.0 (compliance target)
- **S-level**: S0 (public template code; no secrets — derivatives
  supply their own AWS accounts and OIDC configuration)
- **Type**: template (a project whose shipped content instantiates
  derived projects — the v1.3.0 type this repo motivated)
- **Target**: none/local (the template repo itself deploys nothing;
  derivatives deploy to serverless-aws)
- **Workflow**: none declared (⇒ `deployed` is false)
- **Family**: methodology (member) — lead:
  [majodali/methodology](https://github.com/majodali/methodology)
  (owner ruling 2026-08-24: template projects join the `methodology`
  family; reciprocated in the lead's Portfolio Families section)

## Derivatives

The declaration
[Q-001](https://github.com/majodali/methodology/blob/v1.3.0/docs/rules/quality.md#q-001--template-scaffolds-stay-compliant)
requires of a template:

- **Declared derivative tier**: C1. Instantiating the scaffold ("Use
  this template" — a full copy of this tree) must produce a project
  that passes a form audit at C1. Because the copy carries this repo's
  own methodology documents, the instantiated tree audits exactly as
  this repo does; the template's own audits therefore *are* the Q-001
  check, run at every release and audit.
- **Expected fresh-derivative record**: a derivative starts with the
  *template's* Classification, accurate only for the template. Its
  first customization step
  ([CUSTOMIZE.md step 0](CUSTOMIZE.md#0-re-classify--make-the-methodology-declaration-yours))
  is to re-classify — replace this file, the `CLAUDE.md` Binding
  block, and the Backlog with the derivative's own declaration
  (typically web-app / serverless-aws, at the tier its owner chooses;
  `mtool classify` scaffolds it). Until then the copied declaration is
  the template's, and the derivative records nothing else.

## Deviation register

No deviations recorded.

## Custom definitions

No custom definitions.
