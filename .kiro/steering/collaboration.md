---
inclusion: always
---

# Team Collaboration & AI-Harness Workflow

This is a shared repository worked on by multiple people, each using Kiro. The
committed steering docs and specs are the shared "harness" — every member's Kiro
reads the same rules and contracts, so consistency depends on respecting them.

## Source of truth

- **Contracts (do not change without coordination):** `docs/api-spec.md`,
  `docs/requirements.md`, the shared types in `client/src/types/dispute.ts` and
  `server/src/types/`, and the business parameters module. These are the seams
  that let people work in parallel. If a change is genuinely needed, flag it in
  the PR description and call it out — do not silently diverge.
- **Plan & progress:** `.kiro/specs/build-plan/tasks.md` is the master plan with
  ownership. Per-feature detail lives in the four feature specs.

## Working rules for each Kiro session

1. Work only on the phase/spec assigned to your owner (see the ownership table
   in `build-plan/tasks.md`). Do not start another member's phase without
   agreeing first.
2. Respect the dependency order: Stage A (foundation, engine, frontend shell)
   must be merged to `main` before Stage B features begin.
3. Keep changes modular. Each feature owns its own files (`routes/disputes.ts`,
   `routes/dashboard.ts`, separate services and page components). Avoid editing
   shared aggregators (`routes/index.ts`, `App.tsx` router) in the same lines as
   another feature — register feature routers rather than inlining.
4. Update task checkboxes in the relevant `tasks.md` as you complete them, and
   commit those updates **with the code** so progress is visible to everyone.
5. Follow `conventions.md`, `rules.md`, and `requirements-to-tests.md` exactly.
   When requirements change, reconcile `docs/test-cases.md` per the
   requirements-to-tests rule.
6. Run `npm run lint` and `npm test` before committing. Keep `main` green.

## Branch & PR workflow

- Branch per feature: `feat/<spec-name>` (e.g. `feat/triage-engine`,
  `feat/queue-detail`, `feat/override-status`, `feat/dashboard`).
- Small, focused PRs. One feature spec per PR where possible.
- Never push directly to `main`; open a PR and let CI pass first.
- Commit messages use the conventions in `conventions.md`
  (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
- Do not commit `.env`, `dev.db`, or `node_modules` (already gitignored). Each
  member runs `npm install`, `npm run db:migrate`, and the seed locally.

## Environment notes

- MCP config (`~/.kiro/settings/mcp.json`) is per-machine and is NOT in the
  repo — each member configures their own.
- The SQLite `dev.db` is local to each machine; the schema and migrations in
  `server/prisma/` are the shared source of truth.
