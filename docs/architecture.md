# Architecture Document — Intelligent Triage of Customer Payment Disputes

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | 22 June 2026 |
| Author | Group 26 — Architect |
| Traces to | `docs/requirements.md` v4.0 |

---

## Related Documents

- [Requirements](./requirements.md) — EARS requirements (v4.0)
- [API Specification](./api-spec.md) — Endpoint contracts
- [UI Specification](./ui-spec.md) — Screen specifications

---

## Diagrams

Editable draw.io sources live in [`docs/diagrams/`](./diagrams/). Open them at
[app.diagrams.net](https://app.diagrams.net) (File → Open) or with the
Draw.io Integration VS Code extension.

| Diagram | File | Shows |
|---------|------|-------|
| System Architecture | [`diagrams/architecture.drawio`](./diagrams/architecture.drawio) | Browser → Express API → Triage Engine + Prisma/SQLite layers and their data flow |
| Data Model (ERD) | [`diagrams/data-model.drawio`](./diagrams/data-model.drawio) | `Dispute` and `StatusTransition` entities, all fields, and the 1→many relationship |
| Use Case Diagram | [`diagrams/UseCaseDiagram_DisputeTriage.drawio`](./diagrams/UseCaseDiagram_DisputeTriage.drawio) | Operations User and System actors against the system's use cases |
| Swimlane — Capture & Triage | [`diagrams/swimlane-capture-triage.drawio`](./diagrams/swimlane-capture-triage.drawio) | Cross-functional flow for Journeys 1 & 2 across User, Frontend, API/Service, Triage Engine, and SQLite |
| Swimlane — Override & Status | [`diagrams/swimlane-override-status.drawio`](./diagrams/swimlane-override-status.drawio) | Cross-functional flow for Journeys 5 & 6 (override + status lifecycle) with validation gates |
| Triage Decision Flow | [`diagrams/triage-decision-flow.drawio`](./diagrams/triage-decision-flow.drawio) | Rule precedence chain REQ-031–048, first-match-wins, with priority/action/queue outcomes |
| Status State Machine | [`diagrams/status-state-machine.drawio`](./diagrams/status-state-machine.drawio) | `OPEN → IN_PROGRESS → RESOLVED → CLOSED` transitions, guards, and audit (REQ-080–084) |
| Sequence — Create Dispute | [`diagrams/sequence-create-dispute.drawio`](./diagrams/sequence-create-dispute.drawio) | `POST /api/disputes` message flow across frontend, route, service, engine, and database |
| Sequence — Override Recommendation | [`diagrams/sequence-override.drawio`](./diagrams/sequence-override.drawio) | `POST /api/disputes/:id/override` flow with validation, original-value preservation, and audit (REQ-075–079, 084) |
| Deployment / Context | [`diagrams/deployment-context.drawio`](./diagrams/deployment-context.drawio) | Single-machine deployment: browser SPA, Vite proxy, Express/Prisma/SQLite, and the absence of external integrations |

---

## System Overview

A single-machine internal prototype with no external dependencies. The React
frontend communicates with an Express API over a Vite dev proxy. All dispute
data, triage results, and audit history live in a local SQLite file. No real
banking systems are connected.

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  React 18 + Vite (localhost:5173)                           │
│  Tailwind CSS, React Router, useDisputes hooks              │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP /api/* (proxied by Vite)
┌──────────────────────▼──────────────────────────────────────┐
│  Express API Server (localhost:3001)                        │
│  routes/ → services/ → rules/                               │
│  Validation middleware, error handler                       │
└──────────┬────────────────────────┬────────────────────────┘
           │                        │
┌──────────▼──────────┐  ┌──────────▼──────────────────────┐
│  Triage Rules Engine │  │  Prisma ORM                     │
│  triageEngine.ts     │  │  disputeService.ts               │
│  triageRules.ts      │  │  SQLite (dev.db)                 │
└─────────────────────┘  └──────────────────────────────────┘
```

---

## Components

- **React Frontend** — Dispute capture form, queue view, detail view, dashboard. Built with React 18 + Vite. All API calls go through custom hooks in `useDisputes.ts`. No business logic in components — presentational only.

- **Express API Server** — REST endpoints for disputes, dashboard metrics, enumerations, triage rules, and seeding. Route handlers are thin; all logic lives in services. Error handling via centralised `errorHandler.ts` middleware.

- **Triage Rules Engine** (`triageEngine.ts`, `triageRules.ts`) — Evaluates dispute inputs against 17 rules in fixed precedence order (REQ-030). Returns `{ recommendedAction, priority, ruleId, explanation, factors, rulesEvaluated, targetQueue }`. Pure functions — no I/O, no side effects. Deterministic: same inputs always produce same outputs (REQ-054).

- **Dispute Service** (`disputeService.ts`) — CRUD operations, case reference generation (`DSP-YYYYMMDD-XXXX`), age/ageBand/dueDate computation, queue assignment, status transition enforcement, override persistence. All Prisma queries live here.

- **Prisma ORM + SQLite** — Type-safe database access. Schema at `prisma/schema.prisma`. Local `dev.db` file — zero infrastructure required (REQ-112).

- **Seed Script** (`prisma/seed.ts`) — Inserts 25+ mock disputes covering all payment types, issue categories, priority levels, and age bands (REQ-100–104).

---

## Data Model

### Dispute
Primary entity. One row per dispute.

| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| caseReference | String | `DSP-YYYYMMDD-XXXX`, unique |
| customerName | String | Required |
| accountNumber | String | 10 digits |
| transactionRef | String | Required |
| amount | Float | > 0, ZAR |
| transactionDate | DateTime | Not in future |
| paymentType | Enum | `CARD`, `EFT`, `INTERNAL_TRANSFER` |
| issueCategory | Enum | 5 values |
| transactionStatus | Enum | `SETTLED`, `PENDING`, `FAILED`, `REVERSED` |
| description | String? | Max 500 chars |
| status | Enum | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| priority | Enum | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| ageBand | Enum | `NEW`, `AGEING`, `BREACHED` |
| recommendedAction | Enum | `RESOLVE_NOW`, `INVESTIGATE`, `ESCALATE`, `REFER` |
| routingQueue | Enum | 4 queue values |
| ruleId | String | Matched rule (e.g. `REQ-038`) |
| explanation | String | Plain-language explanation |
| decisionFactors | Json | issueCategory, transactionStatus, amount, amountBand, ageBand, priority, queue |
| rulesEvaluated | Json | Array of rule IDs checked before match |
| fraudFlag | Boolean | CARD + UNAUTHORISED_TRANSACTION |
| dueDate | DateTime | transactionDate + SLA_DAYS |
| isOverridden | Boolean | Default false |
| originalAction | Enum? | Set on first override |
| originalPriority | Enum? | Set on first override |
| overrideReason | String? | 10–300 chars |
| overriddenAt | DateTime? | Timestamp of override |
| overriddenBy | String? | Operator ID |
| resolutionNote | String? | Required for RESOLVED status |
| createdAt | DateTime | Auto, ISO 8601 |
| updatedAt | DateTime | Auto-updated |

### StatusTransition
One row per status change. Immutable audit log.

| Field | Type | Notes |
|-------|------|-------|
| id | String (UUID) | Primary key |
| disputeId | String | FK → Dispute |
| fromStatus | Enum? | Null on creation |
| toStatus | Enum | New status |
| note | String? | Present only for RESOLVED |
| operatorId | String | Who made the change |
| timestamp | DateTime | Auto |

**Relationships:** `Dispute` 1→many `StatusTransition`

---

## Integrations

- **Core banking** — none. All data is synthetic mock data (REQ-110).
- **Card processing** — none. Simulated by mock disputes with `paymentType=CARD`.
- **Case management** — none. This prototype is the case management system.
- **Fraud systems** — none. Fraud flag is set by rules engine (REQ-035), not by an external system.
- **Notifications** — none. No emails or SMS in scope.
- **Authentication** — none. Prototype assumes trusted internal network (no auth required for demo).

---

## Key Decisions

**SQLite for the database**
Zero infrastructure — runs from a single file with no server process. Sufficient for a single-user prototype. Prisma makes it trivially swappable to PostgreSQL later (REQ-112).

**Synchronous triage at creation time**
Triage runs in-process when `POST /api/disputes` is called, not as a background job. This keeps the architecture simple and meets the 2-second response requirement (REQ-120). There is no queue, no worker, no async processing.

**Rules engine as pure functions**
Each triage rule is a pure TypeScript function that takes a dispute input and returns a result or null. No database reads inside the engine. This makes rules trivially testable and guarantees determinism (REQ-054, REQ-111).

**Fixed precedence order, first-match wins**
Rather than scoring all rules and picking the highest, the engine evaluates rules in strict order and returns on the first match. This makes the logic transparent and predictable — operators can reason about which rule fired (REQ-030).

**Age/ageBand computed at query time, not stored**
Age in days and ageBand are derived from `transactionDate` and the current date each time a dispute is fetched. This means they stay accurate without needing scheduled jobs or triggers.

**Vite proxy for dev — no CORS configuration needed**
In development, Vite proxies all `/api/*` requests to `localhost:3001`. The frontend never talks to the backend directly. In production, Express would serve the built frontend.

**npm workspaces monorepo**
`client/` and `server/` share one `package-lock.json` and one `node_modules/` at the root. Shared types can be extracted to a `shared/` workspace later if needed.

**No real customer data**
All names, account numbers, and references in seed data are synthetic. The system must never be connected to a real data source (REQ-110, REQ-127).

---

## Request / Response Flow

### Creating a dispute (Journey 1 + 2)

```
Browser
  │  POST /api/disputes  {customerName, accountNumber, ...}
  ▼
Express route handler
  │  1. Validate all fields (server-side, REQ-009)
  │  2. Reject if invalid → 400/422
  ▼
Dispute Service
  │  3. Assign queue (REQ-025–028)
  │  4. Compute age, ageBand, dueDate (REQ-010–020)
  ▼
Triage Engine
  │  5. Evaluate 17 rules in order (REQ-030)
  │  6. Return { action, priority, ruleId, explanation, factors }
  ▼
Dispute Service
  │  7. Persist dispute + triage result to SQLite
  │  8. Generate caseReference DSP-YYYYMMDD-XXXX
  ▼
Express route handler
  │  9. Return 201 with full dispute + triage object
  ▼
Browser
     10. Show confirmation + triage recommendation
```

### Status transition (Journey 6)

```
Browser
  │  PATCH /api/disputes/:id/status  {status, note?, operatorId}
  ▼
Express route handler → Dispute Service
  │  1. Fetch current dispute
  │  2. Validate transition is allowed (REQ-080–083)
  │  3. Require note if status = RESOLVED (REQ-081)
  │  4. Update dispute.status
  │  5. Insert StatusTransition row (REQ-084)
  ▼
Browser
     6. Update status display
```
