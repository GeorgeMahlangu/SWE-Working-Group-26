# Requirements — Override & Status Lifecycle

## Introduction

This feature lets an operations user override a system recommendation with an
audited reason, progress a dispute through its status lifecycle, and have the
system automatically escalate ageing disputes. It covers User Journey 5
(Override a Recommendation), Journey 6 (Progress Status), and Journey 7
(Auto-Escalation).

**Source docs:** `docs/requirements.md` v4.0 (REQ-075–084, plus age modifiers
REQ-018, REQ-019, REQ-031), `docs/user-journeys.md` (Journeys 5, 6, 7).

**Scope:** `POST /api/disputes/:id/override`, `PATCH /api/disputes/:id/status`,
the auto-escalation evaluation, and the OverrideModal / StatusTransition
components on DisputeDetail.

---

## Requirement 1 — Override the recommended action or priority

**User Story:** As an operations user, I want to set a different action or
priority based on my judgement, so that the system reflects my decision.

#### Acceptance Criteria

1. WHILE viewing a dispute, the user SHALL be able to override the recommended
   action with any value from the `RecommendedAction` enumeration. (REQ-075)
2. WHILE viewing a dispute, the user SHALL be able to override the priority with
   any value from the `Priority` enumeration. (REQ-076)
3. WHEN a user submits an override, THEN the system SHALL require a reason of
   10–300 characters before accepting it. (REQ-077)
4. IF the reason is shorter than 10 or longer than 300 characters, THEN the
   system SHALL reject the override with a validation error. (REQ-077)

## Requirement 2 — Preserve override history for audit

**User Story:** As a supervisor, I want overrides to be auditable, so that
manual decisions can be reviewed.

#### Acceptance Criteria

1. WHEN an override is applied, THEN the system SHALL preserve the original
   recommendation and original priority alongside the new values. (REQ-078)
2. WHEN an override is applied, THEN the system SHALL record it with timestamp
   and operator identifier. (REQ-084)
3. WHILE viewing an overridden dispute, the system SHALL visually indicate that
   the current action was set manually rather than by the rules engine.
   (REQ-079, `isOverridden`)

## Requirement 3 — Progress dispute through statuses

**User Story:** As an operations user, I want to move a dispute through its
lifecycle, so that its state reflects the work done.

#### Acceptance Criteria

1. THE system SHALL support statuses `OPEN`, `IN_PROGRESS`, `RESOLVED`,
   `CLOSED` with transitions OPEN→IN_PROGRESS→RESOLVED→CLOSED. (REQ-080)
2. WHEN a user moves a dispute to `RESOLVED`, THEN the system SHALL require a
   resolution note of at least 10 characters. (REQ-081)
3. IF a user attempts to close a dispute that is not `RESOLVED`, THEN the system
   SHALL reject with an error. (REQ-082)
4. WHILE a dispute is `CLOSED`, the system SHALL not allow any further
   modifications. (REQ-083)
5. WHEN any status transition occurs, THEN the system SHALL record it with
   timestamp and operator identifier. (REQ-084)

## Requirement 4 — Automatically escalate ageing disputes

**User Story:** As the system, I need to escalate disputes left too long, so
that nothing falls through the cracks.

#### Acceptance Criteria

1. WHEN a dispute has been open longer than `SLA_DAYS` (7), THEN the system
   SHALL bump its priority by one level (LOW→MEDIUM, MEDIUM→HIGH, HIGH→CRITICAL,
   CRITICAL unchanged). (REQ-018)
2. WHEN a dispute has been open longer than `ESCALATION_DAYS` (14), THEN the
   system SHALL force the recommended action to `ESCALATE` regardless of the
   original recommendation. (REQ-019, REQ-031)
3. WHEN auto-escalation changes a dispute, THEN the system SHALL update the
   triggered rules and explanation to reflect the escalation. (REQ-055)

## Requirement 5 — Presentation & accessibility

#### Acceptance Criteria

1. THE OverrideModal and StatusTransition controls SHALL use action display
   labels (`RESOLVE_NOW`→"Resolve Immediately", `INVESTIGATE`→"Investigate
   Further", `ESCALATE`→"Escalate", `REFER`→"Refer to Another Team").
2. ALL controls SHALL have ARIA labels and keyboard support; errors SHALL use
   `role="alert"`. (REQ-126)
