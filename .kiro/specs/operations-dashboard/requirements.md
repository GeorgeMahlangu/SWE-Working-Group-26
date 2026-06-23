# Requirements — Operations Dashboard

## Introduction

This feature gives an operations user (or team lead) an at-a-glance overview of
the current dispute landscape, including counts by dimension, average age,
override rate, and early-warning indicators for ageing disputes. It covers User
Journey 8 (Monitor the Dashboard).

**Source docs:** `docs/requirements.md` v4.0 (REQ-090–096),
`docs/user-journeys.md` (Journey 8), `docs/api-spec.md` (`GET /api/dashboard`).

**Scope:** `GET /api/dashboard` and the Dashboard screen. Read-only aggregation
over existing dispute data.

---

## Requirement 1 — Show core operational metrics

**User Story:** As an operations user, I want a summary of all disputes, so that
I can understand the current workload.

#### Acceptance Criteria

1. WHEN the user opens the dashboard, THEN the system SHALL display total open
   disputes plus counts grouped by priority, by recommended action, by queue,
   and by payment type, along with the average dispute age. (REQ-090)
2. THE dashboard SHALL present counts using the action display labels
   (`RESOLVE_NOW`→"Resolve Immediately", `INVESTIGATE`→"Investigate Further",
   `ESCALATE`→"Escalate", `REFER`→"Refer to Another Team").

## Requirement 2 — Surface early warnings

**User Story:** As a team lead, I want to see disputes nearing escalation, so
that I can act before SLAs breach.

#### Acceptance Criteria

1. THE dashboard SHALL display the count of disputes aged 5–7 days (approaching
   the 7-day `SLA_DAYS` threshold) and the count aged 12–14 days (approaching
   the 14-day `ESCALATION_DAYS` threshold) as early warnings. (REQ-091)

## Requirement 3 — Show override rate

#### Acceptance Criteria

1. THE dashboard SHALL display the count of overridden recommendations as a
   percentage of total disputes. (REQ-092)

## Requirement 4 — Visual encoding

**User Story:** As an operations user, I want consistent colour and badge
coding, so that I can read the dashboard at a glance.

#### Acceptance Criteria

1. WHEN priority is displayed, THEN it SHALL be colour-coded: red `CRITICAL`,
   orange `HIGH`, amber `MEDIUM`, green `LOW`. (REQ-093)
2. WHEN age band is displayed, THEN it SHALL use badges: neutral `NEW`, warning
   `AGEING`, alert `BREACHED`. (REQ-094)

## Requirement 5 — Navigation to filtered queue

**User Story:** As an operations user, I want to jump from a metric into the
relevant disputes, so that I can investigate.

#### Acceptance Criteria

1. WHEN a user selects a metric grouping (e.g. a priority or payment-type count),
   THEN the system SHALL navigate to the dispute queue pre-filtered to that
   grouping. (Journey 8, ties to REQ-062–066)

## Requirement 6 — Presentation & accessibility

#### Acceptance Criteria

1. THE dashboard SHALL format amounts as `R X,XXX.XX`, dates as `DD MMM YYYY`,
   and average age in whole days. (REQ-123, REQ-124)
2. ALL interactive metrics SHALL have ARIA labels and keyboard navigation.
   (REQ-126)
3. Loading states SHALL use the 2px LoadingBar only — no spinners or skeletons.
