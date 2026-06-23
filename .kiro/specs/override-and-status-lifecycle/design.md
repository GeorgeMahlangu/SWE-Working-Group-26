# Design — Override & Status Lifecycle

## Overview

Two mutating endpoints extend a dispute after creation: one applies an audited
override, the other transitions status with lifecycle guards. A re-evaluation
step applies age-based escalation when disputes are read or refreshed. The
DisputeDetail screen hosts the OverrideModal and StatusTransition controls.

## Architecture

```
DisputeDetail.tsx
  ├─ OverrideModal ──(useOverride)──▶ POST /api/disputes/:id/override
  └─ StatusTransition ──(useStatus)─▶ PATCH /api/disputes/:id/status
                                          │
                          routes/disputes.ts (thin)
                                          │
                                 disputeService
                                   ├─ applyOverride()  (preserve originals)
                                   ├─ transitionStatus() (guard transitions)
                                   └─ recordAudit()     (timestamp + operator)
                                          │
                                   Prisma / SQLite

Age escalation: triageEngine.reevaluateAge() applied on read/refresh
  → REQ-018 priority bump, REQ-019 forced ESCALATE
```

## Components and Interfaces

### API: `POST /api/disputes/:id/override` (REQ-075–079)
- Body: `{ action?: RecommendedAction, priority?: Priority, reason: string }`.
- Validates reason length 10–300; at least one of action/priority present.
- Preserves `originalRecommendation` / `originalPriority`, sets
  `isOverridden=true`, `overrideReason`, and appends an audit entry.
- Returns the updated dispute.

### API: `PATCH /api/disputes/:id/status` (REQ-080–084)
- Body: `{ status: DisputeStatus, resolutionNote?: string }`.
- Allowed transitions only: OPEN→IN_PROGRESS→RESOLVED→CLOSED.
- RESOLVED requires `resolutionNote` ≥ 10 chars; CLOSED only from RESOLVED;
  CLOSED is immutable.
- Appends an audit entry with timestamp + operator.

### Age escalation: `triageEngine.reevaluateAge(dispute)` (REQ-018, REQ-019)
- Pure function applied when a dispute is fetched/refreshed; recomputes age band,
  applies priority bump and forced escalation, and updates the explanation.

### Frontend components
- `OverrideModal.tsx` — action/priority selects (display labels) + reason field
  with live length validation.
- `StatusTransition.tsx` — status controls reflecting allowed next states +
  resolution-note field for RESOLVED.
- Overridden indicator rendered in `ActionPanel` when `isOverridden` is true.

## Data Models

Extends `Dispute` with: `originalRecommendation`, `originalPriority`,
`overrideReason`, `isOverridden`, `resolutionNote`. Adds an **Audit Trail**
record per transition/override: `{ disputeId, type, from, to, reason, operator,
timestamp }` (REQ-084).

## State Machine

```
OPEN ──▶ IN_PROGRESS ──▶ RESOLVED ──▶ CLOSED
                                        (terminal, immutable)
```
Any transition not on this path is rejected (REQ-082, REQ-083).

## Error Handling

- Invalid transition → 409 `{ error: "Invalid status transition" }`.
- Missing/short resolution note → 400 `{ error, field: "resolutionNote" }`.
- Invalid override reason → 400 `{ error, field: "reason" }`.
- Modifying a CLOSED dispute → 409 `{ error: "Closed disputes are immutable" }`.

## Testing Strategy

- Override: reason boundary (9/10/300/301 chars), originals preserved,
  isOverridden set, audit recorded.
- Status: every legal transition; rejection of illegal transitions; RESOLVED
  note enforcement; CLOSED immutability.
- Age escalation: 7-day bump per starting priority; 14-day forced ESCALATE;
  CRITICAL unchanged on bump.
