# Build Plan — Payment Dispute Triage (Development Phase)

Master, ordered implementation plan for `Conference/payment-dispute-triage/`. It
sequences the four feature specs into a buildable order and grounds each step in
the current scaffold. Detailed per-feature acceptance criteria live in:

- `.kiro/specs/dispute-capture-and-triage/`
- `.kiro/specs/dispute-queue-and-detail/`
- `.kiro/specs/override-and-status-lifecycle/`
- `.kiro/specs/operations-dashboard/`

## Ownership & sequencing

> Stage A is the shared foundation — it must be built and merged to `main`
> before Stage B features start in parallel. See `.kiro/steering/collaboration.md`.

| Stage | Phase(s) | Owner | Branch | Depends on |
|-------|----------|-------|--------|------------|
| A | 0 Foundation, 1 Triage engine, 6.1–6.3 Frontend shell | Member 1 (you) | `feat/foundation` | — |
| B | 2 Capture API + 7.1 CaptureDispute | Member 1 (you) | `feat/capture-triage` | Stage A |
| B | 3 Queue & detail API + 7.2/7.3 Queue & Detail screens | Member 2 | `feat/queue-detail` | Stage A |
| B | 4 Override & status API + 5 Dashboard API + 7.4 Dashboard | Member 3 | `feat/override-dashboard` | Stage A |
| — | 8 Verification (E2E + CI) | Shared | `feat/e2e` | All Stage B |

Update the checkbox in each phase as it lands, and commit the checkbox change
with the code. Conventions: TypeScript strict, ES Modules, thin routes →
services → rules, named business parameters (never hard-coded), enums UPPERCASE,
amounts `R X,XXX.XX`, dates `DD MMM YYYY`, ARIA + keyboard, LoadingBar only.

Current scaffold notes:
- Server is starter-only: `routes/api.ts` has health/echo/info; `prisma/schema.prisma` has a `User` model — both to be replaced.
- Client foundation exists: `types/dispute.ts`, `utils/format.ts` (formatAmount/formatDate + label maps), design tokens in `index.css`, `data/mockDisputes.ts`.
- `App.tsx` is the starter demo — to be replaced with routing + layout.

---

## Phase 0 — Foundation & data layer

- [ ] 0.1 Replace `server/prisma/schema.prisma` with `Dispute` and `StatusTransition` models (all fields incl. override + audit) using SQLite
  - _Requirements: REQ-002, REQ-078, REQ-080, REQ-084, REQ-112_
- [ ] 0.2 Add `.env` with `DATABASE_URL="file:./dev.db"`; run `db:generate` + `db:migrate`
  - _Requirements: REQ-112_
- [ ] 0.3 Create `server/src/types/dispute.ts` (enums + Dispute + Triage result interfaces) mirroring the client types
  - _Requirements: REQ-002_
- [ ] 0.4 Create `server/src/config/params.ts` with business-parameter constants (thresholds, age days, hours)
  - _Requirements: REQ-111, conventions_

## Phase 1 — Triage engine (pure, fully tested)

- [ ] 1.1 `rules/triageRules.ts` — one pure function per rule REQ-031–048
  - _Requirements: REQ-031–048_
- [ ] 1.2 Helpers: age + ageBand, base priority, due date, queue assignment (with fraud override)
  - _Requirements: REQ-010–020, REQ-025–028_
- [ ] 1.3 `services/triageEngine.ts` — ordered first-match evaluation, 7/14-day modifiers, fraudFlag, build ruleId/explanation/factors/rulesEvaluated
  - _Requirements: REQ-030, REQ-018, REQ-019, REQ-035, REQ-050–053_
- [ ] 1.4 Unit tests covering every rule REQ-031–048 + determinism (100% rule coverage)
  - _Requirements: REQ-030–048, REQ-054_

## Phase 2 — Dispute capture API

- [ ] 2.1 `services/disputeService.ts` — Prisma create, `generateCaseReference()` (DSP-YYYYMMDD-XXXX), decision logging
  - _Requirements: REQ-001, REQ-002, REQ-055_
- [ ] 2.2 `validateDispute()` — required fields, enum membership, amount, date
  - _Requirements: REQ-003–006, REQ-009_
- [ ] 2.3 Replace `routes/api.ts` with real router; add `POST /api/disputes`, `GET /api/enums`, `POST /api/seed`
  - _Requirements: REQ-001, REQ-007, REQ-100–104, REQ-120_
- [ ] 2.4 Seed script covering every rule path + age triggers
  - _Requirements: REQ-100–104_
- [ ] 2.5 API tests: success, validation rejections, response shape
  - _Requirements: REQ-001, REQ-003–006_

## Phase 3 — Queue & detail API

- [ ] 3.1 `disputeService.list()` — filters, priority-then-age sort, pagination
  - _Requirements: REQ-061, REQ-062–066, REQ-121_
- [ ] 3.2 `GET /api/disputes`, `GET /api/disputes/:id` (with SLA/escalation flags), `GET /api/rules`
  - _Requirements: REQ-060, REQ-068, REQ-069, REQ-050_
- [ ] 3.3 API tests: sorting, each filter, pagination, 404
  - _Requirements: REQ-061, REQ-062–066_

## Phase 4 — Override & status API

- [ ] 4.1 `applyOverride()` — validate reason 10–300, preserve originals, set isOverridden, audit
  - _Requirements: REQ-075–079, REQ-084_
- [ ] 4.2 `transitionStatus()` — lifecycle guards, RESOLVED note, CLOSED immutability, audit
  - _Requirements: REQ-080–084_
- [ ] 4.3 `POST /api/disputes/:id/override`, `PATCH /api/disputes/:id/status`
  - _Requirements: REQ-075, REQ-080_
- [ ] 4.4 Age re-evaluation on read (7-day bump, 14-day forced escalate)
  - _Requirements: REQ-018, REQ-019_
- [ ] 4.5 Tests: reason boundaries, legal/illegal transitions, immutability, age modifiers
  - _Requirements: REQ-075–084, REQ-018, REQ-019_

## Phase 5 — Dashboard API

- [ ] 5.1 `getDashboardMetrics()` — counts by priority/action/queue/payment type, average age, early warnings, override rate
  - _Requirements: REQ-090–092_
- [ ] 5.2 `GET /api/dashboard` + API tests (boundaries 4/5/7/8, 11/12/14/15; rounding)
  - _Requirements: REQ-090–092_

## Phase 6 — Frontend foundation

- [ ] 6.1 Add `react-router-dom`; replace `App.tsx` with routes + `TopBar` + `Sidebar` layout
  - _Requirements: REQ-122_
- [ ] 6.2 Data hooks in `hooks/useDisputes.ts` (list, detail, create, override, status, dashboard, enums, rules) — no fetch in components
  - _Requirements: REQ-060, REQ-068_
- [ ] 6.3 Design-system components per `.kiro/skills/ui-design.md`: StatusTag, ActionPanel, FraudIndicator, ExplanationPanel, DisputeRow, FilterBar, LoadingBar
  - _Requirements: REQ-070, REQ-093–095, REQ-126_

> Read `.kiro/skills/ui-design.md` before building any UI component.

## Phase 7 — Screens

- [ ] 7.1 CaptureDispute (form, enum dropdowns, client validation, triage result)
  - _Requirements: REQ-001, REQ-007–009, REQ-125_
- [ ] 7.2 DisputeQueue (summary bar, filters, sorted rows, badges, fraud indicator)
  - _Requirements: REQ-060–070, REQ-096_
- [ ] 7.3 DisputeDetail (full fields, ActionPanel + ExplanationPanel, SLA highlight, OverrideModal, StatusTransition)
  - _Requirements: REQ-068, REQ-069, REQ-075–084_
- [ ] 7.4 Dashboard (metric cards, early warnings, override rate, click-through filters)
  - _Requirements: REQ-090–096_

## Phase 8 — Verification

- [ ] 8.1 Component tests (Testing Library) for badges, labels, fraud indicator, breach highlight
  - _Requirements: REQ-070, REQ-093, REQ-094, REQ-069_
- [ ] 8.2 Playwright E2E: capture → triage → queue → detail → override → resolve → close
  - _Requirements: Journeys 1, 3, 4, 5, 6_
- [ ] 8.3 Run `npm run lint`, `npm run build`, `npm test`; fix issues
- [ ] 8.4 Reconcile `docs/test-cases.md` against any requirement changes per the requirements-to-tests steering rule
