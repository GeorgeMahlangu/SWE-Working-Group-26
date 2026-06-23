# Requirements — Dispute Capture & Automatic Triage

## Introduction

This feature lets a banking operations user capture a customer payment dispute
and immediately receive a deterministic, rules-based recommendation (action,
priority, routing queue) with a plain-language explanation. It covers User
Journey 1 (Capture a New Dispute) and Journey 2 (Automatic Triage), plus the
mock-data seeding that makes every recommendation path demonstrable.

**Source docs:** `docs/requirements.md` v4.0 (REQ-001–055, REQ-100–127),
`docs/user-journeys.md` (Journeys 1, 2), `.kiro/steering/rules.md`.

**Scope:** `POST /api/disputes`, `GET /api/enums`, `POST /api/seed`, the triage
engine, and the CaptureDispute screen.

---

## Requirement 1 — Capture a valid dispute

**User Story:** As an operations user, I want to log a customer payment dispute
with all required details, so that it is recorded and triaged.

#### Acceptance Criteria

1. WHEN a user submits a dispute with valid customer name, 10-digit account
   number, transaction reference, amount > 0, transaction date not in the
   future, payment type, issue category, and transaction status, THEN the system
   SHALL create a record with status `OPEN`, assign a case reference in format
   `DSP-YYYYMMDD-XXXX`, and respond within 2 seconds. (REQ-001, REQ-120)
2. WHEN a dispute is created, THEN the system SHALL persist its computed age
   band, priority, recommended action, queue, due date, and an ISO 8601 creation
   timestamp. (REQ-002)
3. WHEN a dispute is created, THEN the system SHALL compute the due date as
   transaction date + `SLA_DAYS` (7) calendar days. (REQ-020)
4. WHEN a user submits a dispute, THEN the system SHALL accept an optional
   description of up to 500 characters. (REQ-008)

## Requirement 2 — Validate input on client and server

**User Story:** As an operations user, I want clear validation feedback, so
that invalid data never reaches the database.

#### Acceptance Criteria

1. IF a required field is missing, THEN the system SHALL reject the submission
   and return an error naming the missing field. (REQ-003)
2. IF `paymentType`, `issueCategory`, or `transactionStatus` is outside its
   enumeration, THEN the system SHALL reject the submission with an invalid-value
   error. (REQ-004)
3. IF the amount is zero, negative, or non-numeric, THEN the system SHALL reject
   with "Amount must be a positive value." (REQ-005)
4. IF the transaction date is in the future, THEN the system SHALL reject with
   "Transaction date cannot be in the future." (REQ-006)
5. THE system SHALL validate all input on both client and server. (REQ-009)
6. WHEN form validation fails, THEN the client SHALL show inline errors adjacent
   to the affected fields within 500 ms, using `role="alert"`. (REQ-125)
7. THE capture form SHALL populate payment type, issue category, and transaction
   status as dropdowns sourced from `GET /api/enums`. (REQ-007)

## Requirement 3 — Compute age band and priority

**User Story:** As the system, I need to derive age band and base priority, so
that downstream rules and the queue behave consistently.

#### Acceptance Criteria

1. WHEN a dispute is captured or retrieved, THEN the system SHALL compute age in
   calendar days from the transaction date. (REQ-010)
2. WHERE age < `AGE_AGEING_DAYS` (2) the band SHALL be `NEW`; WHERE age is
   ≥ 2 and < `SLA_DAYS` (7) the band SHALL be `AGEING`; WHERE age ≥ 7 the band
   SHALL be `BREACHED`. (REQ-011–013)
3. THE system SHALL assign base priority per REQ-014 to REQ-017 (CRITICAL,
   HIGH, MEDIUM, LOW). (REQ-014–017)

## Requirement 4 — Assign routing queue

**User Story:** As the system, I need to route each dispute to the correct
team, so that ownership is clear.

#### Acceptance Criteria

1. WHEN payment type is `CARD`, THEN the queue SHALL be `CARD_DISPUTES`. (REQ-025)
2. WHEN payment type is `EFT`, THEN the queue SHALL be `PAYMENTS_INVESTIGATIONS`. (REQ-026)
3. WHEN payment type is `INTERNAL_TRANSFER`, THEN the queue SHALL be
   `INTERNAL_PAYMENTS_OPS`. (REQ-027)
4. WHEN issue category is `UNAUTHORISED_TRANSACTION`, THEN the queue SHALL be
   `FRAUD_OPERATIONS`, overriding the payment-type default. (REQ-028)

## Requirement 5 — Evaluate triage rules in precedence order

**User Story:** As an operations user, I want a single recommended next action,
so that I know what to do with each dispute.

#### Acceptance Criteria

1. THE engine SHALL evaluate rules top-to-bottom and apply the first match, using
   the precedence in `.kiro/steering/rules.md` (forced-age escalation → high
   value → unauthorised → SLA breach → pending → duplicate debit → failed
   transfer → incorrect amount → missing payment → card catch-all → default).
   (REQ-030)
2. THE engine SHALL implement each of REQ-031 through REQ-048 exactly as
   specified, returning the action, priority, and queue for the matched rule.
3. WHEN amount ≥ `HIGH_VALUE_THRESHOLD` (R50,000) and no higher rule matched,
   THEN the action SHALL be `ESCALATE` with priority `CRITICAL`. (REQ-032)
4. WHEN issue category is `UNAUTHORISED_TRANSACTION` AND payment type is `CARD`,
   THEN the system SHALL set `fraudFlag = true` in addition to the matched
   action/priority. (REQ-035)
5. THE system SHALL never hard-code thresholds; it SHALL reference the named
   business parameters. (REQ-111, conventions)

## Requirement 6 — Apply age-based modifiers

#### Acceptance Criteria

1. WHEN a dispute is older than `SLA_DAYS` (7), THEN priority SHALL be bumped one
   level (LOW→MEDIUM, MEDIUM→HIGH, HIGH→CRITICAL, CRITICAL unchanged). (REQ-018)
2. WHEN a dispute is older than `ESCALATION_DAYS` (14), THEN the action SHALL be
   forced to `ESCALATE` regardless of the matched rule. (REQ-019, REQ-031)

## Requirement 7 — Explain every recommendation

**User Story:** As an operations user, I want to see why an action was
recommended, so that I can trust and audit the decision.

#### Acceptance Criteria

1. WHEN the system returns a recommendation, THEN it SHALL include the `ruleId`
   of the matched rule (e.g. `REQ-038`). (REQ-050)
2. THE response SHALL include decision factors: issue category, transaction
   status, amount, amount-relative-to-threshold, age band, priority, queue.
   (REQ-051)
3. THE response SHALL include a plain-language explanation in business terms,
   containing no variable names or REQ identifiers in the user-facing text.
   (REQ-052)
4. WHEN the action is `ESCALATE` or `REFER`, THEN the response SHALL include the
   target routing queue. (REQ-053)
5. THE engine SHALL be deterministic: identical decision factors SHALL produce
   identical recommendations. (REQ-054)
6. THE system SHALL log input data, rules evaluated, rules triggered, and the
   output recommendation for audit. (REQ-055)

## Requirement 8 — Seed demonstrable mock data

**User Story:** As a developer, I want realistic seeded disputes, so that every
rule path can be demonstrated.

#### Acceptance Criteria

1. WHEN the system seeds via `POST /api/seed`, THEN it SHALL create at least 25
   disputes spanning all payment types, issue categories, priorities, and
   statuses. (REQ-100)
2. THE seed SHALL use South African names, 10-digit account numbers, and
   references; dates spread across the last 30 days. (REQ-101, REQ-102)
3. THE seed SHALL include ≥3 disputes triggering the 7-day rule, ≥2 triggering
   the 14-day rule, and at least one dispute per triage rule REQ-031–048.
   (REQ-103, REQ-104)

## Requirement 9 — Constraints & presentation

#### Acceptance Criteria

1. THE system SHALL use only mock data and SHALL NOT connect to external banking
   systems. (REQ-110, REQ-127)
2. THE system SHALL store data in local SQLite. (REQ-112)
3. THE system SHALL format amounts as `R X,XXX.XX` and dates as `DD MMM YYYY`
   via shared utilities. (REQ-123, REQ-124)
4. THE capture form SHALL provide ARIA labels and keyboard navigation. (REQ-126)
