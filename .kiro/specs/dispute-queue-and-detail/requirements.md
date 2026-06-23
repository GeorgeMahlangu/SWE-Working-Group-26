# Requirements — Dispute Queue & Detail

## Introduction

This feature lets an operations user review the queue of disputes, filter and
sort to find work, and open a dispute to understand its full detail and triage
reasoning. It covers User Journey 3 (Work the Queue) and Journey 4 (Review
Detail).

**Source docs:** `docs/requirements.md` v4.0 (REQ-060–070, REQ-121),
`docs/user-journeys.md` (Journeys 3, 4), `docs/api-spec.md`.

**Scope:** `GET /api/disputes` (with filtering + pagination),
`GET /api/disputes/:id`, `GET /api/rules`, and the DisputeQueue and
DisputeDetail screens. Read-only — overrides and status changes are a separate
feature.

---

## Requirement 1 — Display the dispute queue

**User Story:** As an operations user, I want to see all disputes in one list,
so that I can decide what to work on next.

#### Acceptance Criteria

1. WHEN a user requests the queue, THEN each row SHALL show case reference,
   customer name, payment type, issue category, amount (R), colour-coded
   priority, recommended action, assigned queue, due date, age in days, and
   status. (REQ-060)
2. THE queue SHALL be sorted by priority (`CRITICAL`, then `HIGH`, `MEDIUM`,
   `LOW`) and within priority by age, oldest first. (REQ-061)
3. WHEN the queue loads with up to 100 records, THEN it SHALL render within 1
   second. (REQ-121)
4. THE queue SHALL display a summary bar showing counts per priority level.
   (REQ-096)

## Requirement 2 — Filter the queue

**User Story:** As an operations user, I want to narrow the list, so that I can
focus on a subset of disputes.

#### Acceptance Criteria

1. WHEN a user filters by priority, THEN only disputes of that priority SHALL be
   shown. (REQ-062)
2. WHEN a user filters by payment type, THEN only matching disputes SHALL be
   shown. (REQ-063)
3. WHEN a user filters by issue category, THEN only matching disputes SHALL be
   shown. (REQ-064)
4. WHEN a user filters by recommended action, THEN only matching disputes SHALL
   be shown. (REQ-065)
5. WHEN a user filters by status, THEN only matching disputes SHALL be shown.
   (REQ-066)
6. THE filters SHALL be combinable, and `GET /api/disputes` SHALL accept them as
   query parameters with pagination.

## Requirement 3 — Visual priority, age, and fraud signals

**User Story:** As an operations user, I want at-a-glance signals, so that I can
triage visually.

#### Acceptance Criteria

1. WHEN priority is displayed, THEN it SHALL be colour-coded: red `CRITICAL`,
   orange `HIGH`, amber `MEDIUM`, green `LOW`. (REQ-093)
2. WHEN age band is displayed, THEN it SHALL use badges: neutral `NEW`, warning
   `AGEING`, alert `BREACHED`. (REQ-094)
3. WHERE a dispute is fraud-flagged (CARD + UNAUTHORISED_TRANSACTION), THEN the
   row SHALL display a fraud indicator. (REQ-070)
4. WHEN a recommended action is displayed, THEN it SHALL use the display label
   (`RESOLVE_NOW`→"Resolve Immediately", `INVESTIGATE`→"Investigate Further",
   `ESCALATE`→"Escalate", `REFER`→"Refer to Another Team").

## Requirement 4 — Navigate to detail

#### Acceptance Criteria

1. WHEN a user clicks a dispute row, THEN the system SHALL navigate to the
   dispute detail view. (REQ-067)

## Requirement 5 — Show full dispute detail and explanation

**User Story:** As an operations user, I want to understand why a dispute was
triaged a certain way, so that I can act with confidence.

#### Acceptance Criteria

1. WHEN a user opens a dispute, THEN the detail view SHALL show all captured
   fields plus the recommendation panel with action, priority, queue, ruleId,
   plain-language explanation, and decision factors. (REQ-068, REQ-050–053)
2. WHEN a dispute has crossed the `SLA_DAYS` (7) or `ESCALATION_DAYS` (14)
   threshold, THEN the detail view SHALL visually highlight the breach. (REQ-069)
3. THE recommended action SHALL be presented as a prominent call-to-action label
   alongside its explanation. (REQ-095)
4. `GET /api/rules` SHALL provide the active triage rules for a rules-reference
   panel. (REQ-050)

## Requirement 6 — Presentation & accessibility

#### Acceptance Criteria

1. THE queue and detail SHALL format amounts as `R X,XXX.XX` and dates as
   `DD MMM YYYY` via shared utilities. (REQ-123, REQ-124)
2. ALL interactive elements SHALL have ARIA labels and keyboard navigation.
   (REQ-126)
3. Loading states SHALL use the 2px LoadingBar only — no spinners or skeletons.
