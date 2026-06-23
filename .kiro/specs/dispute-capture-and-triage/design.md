# Design — Dispute Capture & Automatic Triage

## Overview

A thin Express route accepts a dispute, delegates validation and triage to
services, persists the result via Prisma/SQLite, and returns the created record
plus a full recommendation object. The frontend CaptureDispute page collects
input, mirrors validation client-side, and renders the triage result on success.

## Architecture

```
CaptureDispute.tsx ──(useDisputes hook)──▶ POST /api/disputes
                                                │
                          routes/disputes.ts (thin handler)
                                                │
                 ┌──────────────────────────────┼───────────────────────┐
                 ▼                               ▼                        ▼
        validateDispute()             triageEngine.evaluate()    disputeService.create()
        (field + enum checks)         (rules + modifiers)        (Prisma → SQLite)
                                                │
                                       rules/triageRules.ts
                                       (one function per rule)
```

- Route handlers stay thin; all logic lives in services (`conventions.md`).
- Triage rules live in `server/src/rules/triageRules.ts`, one function per rule.
- Prisma access is confined to `disputeService.ts`.

## Components and Interfaces

### API: `POST /api/disputes` (REQ-001, REQ-030)
- Request body: `customerName`, `accountNumber`, `transactionReference`,
  `transactionAmount`, `transactionDate`, `paymentType`, `issueCategory`,
  `transactionStatus`, optional `description`.
- Response 201: full `Dispute` including `caseReference`, `recommendedAction`,
  `priority`, `routingQueue`, `ruleId`, `explanation`, `decisionFactors`,
  `fraudFlag`, `dueDate`, `ageBand`, `createdAt`.
- Errors: `{ error: string, field?: string }` (REQ-003–006).

### API: `GET /api/enums` (REQ-007)
- Returns `paymentTypes`, `issueCategories`, `transactionStatuses`, `actions`,
  `priorities`, `statuses` for form dropdowns.

### API: `POST /api/seed` (REQ-100–104)
- Dev-only. Generates ≥25 disputes covering every rule path.

### Service: `triageEngine.evaluate(dispute)` (REQ-030–055)
1. Compute age, age band, due date.
2. Assign queue (payment type; `UNAUTHORISED_TRANSACTION` → `FRAUD_OPERATIONS`).
3. Walk ordered rule list; first match wins; record `rulesEvaluated`.
4. Apply REQ-018 priority bump and REQ-019 forced escalation.
5. Set `fraudFlag` for CARD + UNAUTHORISED_TRANSACTION (REQ-035).
6. Build `explanation`, `ruleId`, `decisionFactors`, `targetQueue`.

### Service: `disputeService.create()` / `generateCaseReference()`
- Case reference `DSP-YYYYMMDD-XXXX`: zero-padded sequential per day.

## Data Models

`Dispute` per `.kiro/steering/structure.md` data model (caseReference, customer
fields, enums, status, priority, ageBand, recommendedAction, routingQueue,
ruleId, explanation, decisionFactors, fraudFlag, dueDate, ageInDays,
createdAt, updatedAt). Stored in SQLite via Prisma.

## Business Parameters (never hard-coded)

`HIGH_VALUE_THRESHOLD=50000`, `MEDIUM_VALUE_THRESHOLD=5000`,
`LOW_VALUE_THRESHOLD=1000`, `INCORRECT_AMOUNT_THRESHOLD=10000`,
`AGE_AGEING_DAYS=2`, `SLA_DAYS=7`, `ESCALATION_DAYS=14`,
`FAILED_TRANSFER_HOURS=48`.

## Error Handling

- Validation failures return 400 with `{ error, field }`; the client maps
  `field` to inline messages (REQ-125).
- Unhandled errors flow through `middleware/errorHandler.ts`.

## Testing Strategy

- Unit-test every triage rule REQ-031–048 (100% rule coverage target) plus age
  band, priority bump, forced escalation, queue override, and fraud flag.
- Determinism test: identical factors → identical output (REQ-054).
- API tests for validation rejections (REQ-003–006) and the 2-second budget.
