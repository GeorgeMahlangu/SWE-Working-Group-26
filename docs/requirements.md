# Requirements — Intelligent Triage of Customer Payment Disputes

## Document Information

| Field | Value |
|-------|-------|
| Version | 4.0 |
| Date | 22 June 2026 |
| Author | Group 26 |
| Format | EARS (Easy Approach to Requirements Syntax) |
| Status | Final merged |

---

## Related Documents

- [User Journeys](./user-journeys.md) — End-to-end user flows
- [Test Cases](./test-cases.md) — Verification test cases (103 cases)
- [API Specification](./api-spec.md) — Endpoint definitions
- [UI Specification](./ui-spec.md) — Screen specifications
- [Architecture](./architecture.md) — System design

---

## Purpose

These requirements define a lightweight internal tool that lets a banking
operations user capture a customer payment dispute and receive a **recommended
next action** derived from transparent, rules-based logic over **mock data**.
The single journey in scope: *given this dispute, what is the most appropriate
next step right now — and why?*

---

## Reference Data (Enumerations)

| Set | Values |
|---|---|
| **PaymentType** | `CARD`, `EFT`, `INTERNAL_TRANSFER` |
| **IssueCategory** | `DUPLICATE_DEBIT`, `FAILED_TRANSFER`, `MISSING_PAYMENT`, `UNAUTHORISED_TRANSACTION`, `INCORRECT_AMOUNT` |
| **TransactionStatus** | `SETTLED`, `PENDING`, `FAILED`, `REVERSED` |
| **RecommendedAction** | `RESOLVE_NOW`, `INVESTIGATE`, `ESCALATE`, `REFER` |
| **Priority** | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| **AgeBand** | `NEW`, `AGEING`, `BREACHED` |
| **DisputeStatus** | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| **RoutingQueue** | `CARD_DISPUTES`, `PAYMENTS_INVESTIGATIONS`, `INTERNAL_PAYMENTS_OPS`, `FRAUD_OPERATIONS` |

---

## Tunable Business Parameters

| Parameter | Default | Meaning |
|---|---|---|
| `HIGH_VALUE_THRESHOLD` | R50,000 | At or above this, dispute is Critical regardless of category |
| `MEDIUM_VALUE_THRESHOLD` | R5,000 | At or above this, unauthorised transactions escalate |
| `LOW_VALUE_THRESHOLD` | R1,000 | Below this, clear-cut cases may auto-resolve |
| `INCORRECT_AMOUNT_THRESHOLD` | R10,000 | Difference threshold for incorrect amount escalation |
| `AGE_AGEING_DAYS` | 2 | Days open before a dispute is `AGEING` |
| `SLA_DAYS` | 7 | Days open before priority is bumped one level |
| `ESCALATION_DAYS` | 14 | Days open before action is forced to `ESCALATE` |
| `FAILED_TRANSFER_HOURS` | 48 | Hours after which a failed transfer becomes High priority |

---

## 1. Dispute Capture

**User Journey:** Journey 1 (Capture a New Dispute)

- **REQ-001:** When an operations user submits a dispute with a valid customer
  name, account number, transaction reference, transaction amount (greater than
  zero), transaction date (not in future), payment type, issue category, and
  transaction status, the system shall create a dispute record with status `OPEN`
  and return a unique case reference in format `DSP-YYYYMMDD-XXXX` within 2
  seconds.

- **REQ-002:** The system shall persist each captured dispute together with its
  computed age band, priority, recommended action, assigned queue, due date, and
  creation timestamp (ISO 8601 format) so it can be retrieved later. (ubiquitous)

- **REQ-003:** If a dispute is submitted without a required field (customer
  name, account number, transaction reference, amount, transaction date, payment
  type, issue category, or transaction status), then the system shall reject the
  submission and return an error naming the missing field.

- **REQ-004:** If a dispute is submitted with a `paymentType`, `issueCategory`,
  or `transactionStatus` value outside the defined enumeration, then the system
  shall reject the submission and return an error indicating the invalid value.

- **REQ-005:** If a dispute is submitted with an amount that is zero, negative,
  or non-numeric, then the system shall reject the submission and return an
  error indicating "Amount must be a positive value."

- **REQ-006:** If a dispute is submitted with a transaction date in the future,
  then the system shall reject the submission and return an error indicating
  "Transaction date cannot be in the future."

- **REQ-007:** The system shall present the dispute capture form with dropdown
  selectors for payment type, issue category, and transaction status populated
  from the defined enumerations, so that the operator cannot enter free-text
  values for these fields. (ubiquitous)

- **REQ-008:** When an operations user submits a dispute, the system shall
  accept an optional description field (free text, maximum 500 characters) for
  the user to provide additional context about the dispute.

- **REQ-009:** The system shall validate all input on both client and server to
  prevent invalid data from reaching the database. (ubiquitous)

---

## 2. Age, Priority & Due Date

**User Journeys:** Journey 2 (Automatic Triage), Journey 7 (Auto-Escalation)

- **REQ-010:** When a dispute is captured or retrieved, the system shall compute
  its age in calendar days as the difference between the current date and the
  transaction date.

- **REQ-011:** Where the dispute age is less than `AGE_AGEING_DAYS`, the system
  shall set the age band to `NEW`.

- **REQ-012:** Where the dispute age is at least `AGE_AGEING_DAYS` and less than
  `SLA_DAYS`, the system shall set the age band to `AGEING`.

- **REQ-013:** Where the dispute age is at least `SLA_DAYS`, the system shall
  set the age band to `BREACHED`.

- **REQ-014:** When a dispute is evaluated, the system shall set priority to
  `CRITICAL` if the amount is at or above `HIGH_VALUE_THRESHOLD`, or if the
  issue category is `UNAUTHORISED_TRANSACTION` and the amount exceeds
  `MEDIUM_VALUE_THRESHOLD`.

- **REQ-015:** Where priority is not `CRITICAL`, the system shall set priority
  to `HIGH` if any of the following hold: the issue category is
  `UNAUTHORISED_TRANSACTION`, the age band is `BREACHED`, or the issue category
  is `FAILED_TRANSFER` and the dispute is older than `FAILED_TRANSFER_HOURS`.

- **REQ-016:** Where priority is not `CRITICAL` or `HIGH`, the system shall set
  priority to `MEDIUM` if the amount is at or above `LOW_VALUE_THRESHOLD` or the
  age band is `AGEING`.

- **REQ-017:** Where none of the `CRITICAL`, `HIGH`, or `MEDIUM` conditions
  apply, the system shall set priority to `LOW`.

- **REQ-018:** When a dispute has been open longer than `SLA_DAYS`, the system
  shall bump its priority by one level (LOW→MEDIUM, MEDIUM→HIGH, HIGH→CRITICAL).

- **REQ-019:** When a dispute has been open longer than `ESCALATION_DAYS`, the
  system shall override the recommended action to `ESCALATE` regardless of other
  rules.

- **REQ-020:** When a dispute is created, the system shall compute a due date
  as the transaction date plus `SLA_DAYS` calendar days, representing the target
  resolution date.

---

## 3. Queue Assignment

**User Journey:** Journey 2 (Automatic Triage), Journey 3 (Work the Queue)

- **REQ-025:** When a dispute's payment type is `CARD`, the system shall assign
  it to queue `CARD_DISPUTES`.

- **REQ-026:** When a dispute's payment type is `EFT`, the system shall assign
  it to queue `PAYMENTS_INVESTIGATIONS`.

- **REQ-027:** When a dispute's payment type is `INTERNAL_TRANSFER`, the system
  shall assign it to queue `INTERNAL_PAYMENTS_OPS`.

- **REQ-028:** When a dispute's issue category is `UNAUTHORISED_TRANSACTION`,
  the system shall override the queue to `FRAUD_OPERATIONS` regardless of
  payment type.

---

## 4. Triage Decision Engine

**User Journeys:** Journey 2 (Automatic Triage), Journey 7 (Auto-Escalation)

The decision engine evaluates rules in a fixed precedence order and the **first
matching rule wins**. Where multiple rules could apply, the system uses the
highest priority and most urgent action (ESCALATE > REFER > INVESTIGATE >
RESOLVE_NOW).

- **REQ-030:** The system shall evaluate triage rules in the following
  precedence order and apply the first rule whose conditions are met: (1)
  forced escalation by age, (2) high-value transaction, (3) unauthorised
  transaction, (4) SLA breach, (5) pending settlement, (6) duplicate debit,
  (7) failed transfer, (8) incorrect amount, (9) missing payment, (10)
  card-dispute routing, (11) default. (ubiquitous)

- **REQ-031:** When the dispute age exceeds `ESCALATION_DAYS`, the system shall
  recommend `ESCALATE` (per REQ-019) with priority bumped per REQ-018.

- **REQ-032:** When the amount is at or above `HIGH_VALUE_THRESHOLD` and no
  higher-precedence rule has matched, the system shall recommend `ESCALATE` with
  priority `CRITICAL` regardless of issue category.

- **REQ-033:** When the issue category is `UNAUTHORISED_TRANSACTION` and the
  amount exceeds `MEDIUM_VALUE_THRESHOLD`, the system shall recommend `ESCALATE`
  to `FRAUD_OPERATIONS` with priority `CRITICAL`.

- **REQ-034:** When the issue category is `UNAUTHORISED_TRANSACTION` and the
  amount is at or below `MEDIUM_VALUE_THRESHOLD`, the system shall recommend
  `INVESTIGATE` routed to `FRAUD_OPERATIONS` with priority `HIGH`.

- **REQ-035:** When the issue category is `UNAUTHORISED_TRANSACTION` and the
  payment type is `CARD`, the system shall add a fraud referral flag to the
  dispute record for visual identification in the queue.

- **REQ-036:** When the age band is `BREACHED` and no higher-precedence rule has
  matched, the system shall recommend `ESCALATE` and indicate an SLA breach.

- **REQ-037:** When the transaction status is `PENDING` and no higher-precedence
  rule has matched, the system shall recommend `INVESTIGATE` and indicate that
  the transaction has not yet settled.

- **REQ-038:** When the issue category is `DUPLICATE_DEBIT`, the transaction
  status is `SETTLED`, the amount is below `LOW_VALUE_THRESHOLD`, and no
  higher-precedence rule has matched, the system shall recommend `RESOLVE_NOW`
  to reverse the duplicate debit with priority `MEDIUM`.

- **REQ-039:** When the issue category is `DUPLICATE_DEBIT` and the transaction
  status is `PENDING`, the system shall recommend `INVESTIGATE` with priority
  `LOW`.

- **REQ-040:** When the issue category is `FAILED_TRANSFER`, the transaction
  status is `FAILED`, and the dispute is older than `FAILED_TRANSFER_HOURS`, the
  system shall recommend `ESCALATE` with priority `HIGH`.

- **REQ-041:** When the issue category is `FAILED_TRANSFER`, the transaction
  status is `FAILED`, and the dispute is within `FAILED_TRANSFER_HOURS`, the
  system shall recommend `INVESTIGATE` with priority `MEDIUM`.

- **REQ-042:** When the issue category is `INCORRECT_AMOUNT` and the transaction
  amount exceeds `INCORRECT_AMOUNT_THRESHOLD`, the system shall recommend
  `ESCALATE` with priority `HIGH`.

- **REQ-043:** When the issue category is `INCORRECT_AMOUNT` and the transaction
  amount is at or below `INCORRECT_AMOUNT_THRESHOLD`, the system shall recommend
  `INVESTIGATE` with priority `MEDIUM`.

- **REQ-044:** When the issue category is `MISSING_PAYMENT` and the payment type
  is `CARD`, the system shall recommend `REFER` to `CARD_DISPUTES` with priority
  `HIGH`.

- **REQ-045:** When the issue category is `MISSING_PAYMENT` and the payment type
  is `EFT`, the system shall recommend `INVESTIGATE` with priority `MEDIUM`.

- **REQ-046:** When the issue category is `MISSING_PAYMENT` and the payment type
  is `INTERNAL_TRANSFER`, the system shall recommend `INVESTIGATE` with priority
  `LOW`.

- **REQ-047:** When the payment type is `CARD`, the issue category is not
  `UNAUTHORISED_TRANSACTION` or `MISSING_PAYMENT`, and no higher-precedence rule
  has matched, the system shall recommend `REFER` to `CARD_DISPUTES`.

- **REQ-048:** If no other rule matches, then the system shall recommend
  `INVESTIGATE` as the default action.

---

## 5. Recommendation Explainability

**User Journey:** Journey 4 (Review Dispute Detail and Recommendation)

- **REQ-050:** When the system returns a recommended action, it shall also
  return the identifier of the rule that determined the action (e.g. `REQ-038`).

- **REQ-051:** When the system returns a recommended action, it shall also
  return the decision factors that drove it: issue category, transaction status,
  amount, amount relative to thresholds, age band, priority, and queue.

- **REQ-052:** When the system returns a recommended action, it shall include a
  plain-language explanation stating which rule matched and which facts triggered
  it, using business terminology rather than technical language.

- **REQ-053:** When the recommended action is `REFER` or `ESCALATE`, the system
  shall return the target routing queue.

- **REQ-054:** The system shall produce an identical recommendation for two
  disputes whose decision factors are identical, so that decisions are repeatable
  and auditable. (ubiquitous)

- **REQ-055:** The system shall log all triage decisions including input data,
  rules evaluated, rules triggered, and output recommendation for traceability
  and audit. (ubiquitous)

---

## 6. Dispute Queue & List

**User Journey:** Journey 3 (Review and Work the Dispute Queue), Journey 4 (Review Detail)

- **REQ-060:** When an operations user requests the dispute queue, the system
  shall display all disputes showing: case reference, customer name, payment
  type, issue category, amount (R), priority (colour-coded), recommended action,
  assigned queue, due date, age in days, and status.

- **REQ-061:** The system shall sort the queue by priority (`CRITICAL` first,
  then `HIGH`, `MEDIUM`, `LOW`) and within priority by age (oldest first).

- **REQ-062:** When an operations user filters the dispute list by priority,
  the system shall display only disputes matching the selected priority level.

- **REQ-063:** When an operations user filters the dispute list by payment type,
  the system shall display only disputes matching the selected payment type.

- **REQ-064:** When an operations user filters the dispute list by issue
  category, the system shall display only disputes matching the selected
  category.

- **REQ-065:** When an operations user filters the dispute list by recommended
  action, the system shall display only disputes matching the selected action.

- **REQ-066:** When an operations user filters the dispute list by status, the
  system shall display only disputes matching the selected status.

- **REQ-067:** When an operations user clicks a dispute row in the queue, the
  system shall navigate to the dispute detail view.

- **REQ-068:** When an operations user opens a single dispute, the system shall
  display its full detail including the recommendation panel and its explanation
  (REQ-050 to REQ-053).

- **REQ-069:** When an operations user opens a dispute, the system shall
  visually highlight if the `SLA_DAYS` or `ESCALATION_DAYS` threshold has been
  crossed.

- **REQ-070:** Where a dispute has been flagged for fraud referral (REQ-035),
  the system shall display a visual fraud indicator in the queue row.

---

## 7. Override & Status Management

**User Journeys:** Journey 5 (Override a Recommendation), Journey 6 (Progress Dispute Through Statuses)

- **REQ-075:** While viewing a dispute, the operations user shall be able to
  override the recommended action by selecting an alternative action from the
  `RecommendedAction` enumeration.

- **REQ-076:** While viewing a dispute, the operations user shall be able to
  override the priority level by selecting an alternative from the `Priority`
  enumeration.

- **REQ-077:** When an operations user overrides a recommendation, the system
  shall require a reason (free text, minimum 10 characters, maximum 300
  characters) before accepting the override.

- **REQ-078:** When an override is applied, the system shall preserve the
  original recommendation and priority alongside the override for audit purposes.

- **REQ-079:** While viewing a dispute that has been overridden, the system
  shall visually indicate that the current action was set manually rather than
  by the rules engine.

- **REQ-080:** The system shall support dispute statuses: `OPEN`, `IN_PROGRESS`,
  `RESOLVED`, `CLOSED`. Transitions are: OPEN→IN_PROGRESS, IN_PROGRESS→RESOLVED,
  RESOLVED→CLOSED. (ubiquitous)

- **REQ-081:** When an operations user moves a dispute to `RESOLVED`, the system
  shall require a resolution note of at least 10 characters.

- **REQ-082:** The system shall only allow closure from `RESOLVED` status; if a
  user attempts to close from any other status, the system shall reject with an
  error.

- **REQ-083:** While a dispute is in `CLOSED` status, the system shall not allow
  any further modifications to the dispute record.

- **REQ-084:** The system shall record all status transitions and overrides with
  timestamp and operator identifier. (ubiquitous)

---

## 8. Dashboard

**User Journey:** Journey 8 (Monitor the Dashboard)

- **REQ-090:** When the operations user opens the application, the system shall
  display a dashboard showing: total open disputes, counts grouped by priority,
  counts grouped by recommended action, counts grouped by queue, counts grouped
  by payment type, and average dispute age.

- **REQ-091:** The system shall display the count of disputes approaching
  escalation thresholds (5–7 days old and 12–14 days old) as early warnings.

- **REQ-092:** The system shall display the count of overridden recommendations
  as a percentage of total disputes.

- **REQ-093:** When the system displays priority, it shall use colour-coded
  indicators: red for `CRITICAL`, orange for `HIGH`, amber for `MEDIUM`, and
  green for `LOW`.

- **REQ-094:** When the system displays age band, it shall use visual badges: a
  neutral badge for `NEW`, a warning badge for `AGEING`, and an alert badge for
  `BREACHED`.

- **REQ-095:** When the system displays a recommended action, it shall present
  it as a prominent call-to-action label alongside its explanation text.

- **REQ-096:** The system shall display a summary bar above the dispute queue
  showing counts of disputes per priority level.

---

## 9. Mock Data & Seeding

**User Journey:** N/A (System seeding, no user interaction)

- **REQ-100:** When the system is initialised for the first time, it shall seed
  the database with at least 25 mock dispute records spanning all three payment
  types, all five issue categories, all four priority levels, and all four
  statuses.

- **REQ-101:** The seeded mock data shall include realistic South African
  customer names, 10-digit account numbers, and transaction references.

- **REQ-102:** The seeded mock data shall include transaction dates distributed
  across the last 30 days to demonstrate age-based rule triggers.

- **REQ-103:** The seeded mock data shall include at least 3 disputes that
  trigger the 7-day escalation rule and at least 2 disputes that trigger the
  14-day escalation rule.

- **REQ-104:** The seeded mock data shall include at least one dispute that
  triggers each triage rule (REQ-031 through REQ-048) so that all recommendation
  paths are exercisable in a demo.

---

## 10. Data & Environment Constraints

**User Journey:** Applicable across all journeys

- **REQ-110:** The system shall use only mock dispute, customer, and transaction
  data and shall not connect to any core banking, card processing, case
  management, or customer platform. (ubiquitous)

- **REQ-111:** The system shall determine every recommendation using
  deterministic business rules only and shall not use machine learning or
  probabilistic models. (ubiquitous)

- **REQ-112:** The system shall store all dispute data in a local SQLite
  database so that no external database infrastructure is required. (ubiquitous)

---

## 11. Non-Functional Requirements

**User Journey:** Applicable across all journeys

- **REQ-120:** When an operations user submits a dispute, the system shall
  return the triage result (recommendation + explanation) within 2 seconds.

- **REQ-121:** When an operations user loads the dispute queue, the system shall
  render the list within 1 second for up to 100 dispute records.

- **REQ-122:** The system shall be accessible via a modern web browser (Chrome,
  Firefox, Edge) without requiring additional plugins or desktop installation.
  (ubiquitous)

- **REQ-123:** The system shall display all monetary amounts formatted in South
  African Rand (R) with thousands separators and two decimal places. (ubiquitous)

- **REQ-124:** The system shall display all dates in DD MMM YYYY format (e.g.
  15 Jun 2026) for readability. (ubiquitous)

- **REQ-125:** When a dispute form submission fails validation, the system shall
  display inline error messages adjacent to the relevant form fields within 500
  milliseconds of submission.

- **REQ-126:** The system shall render all UI components with appropriate ARIA
  labels and keyboard navigation support for accessibility. (ubiquitous)

- **REQ-127:** The system shall not store or process any real customer data. All
  data is synthetic and for demonstration purposes only. (ubiquitous)

---

## Requirements Traceability Summary

| Section | Requirements | Count |
|---|---|---|
| 1. Dispute Capture | REQ-001 to REQ-009 | 9 |
| 2. Age, Priority & Due Date | REQ-010 to REQ-020 | 11 |
| 3. Queue Assignment | REQ-025 to REQ-028 | 4 |
| 4. Triage Decision Engine | REQ-030 to REQ-048 | 19 |
| 5. Recommendation Explainability | REQ-050 to REQ-055 | 6 |
| 6. Dispute Queue & List | REQ-060 to REQ-070 | 11 |
| 7. Override & Status Management | REQ-075 to REQ-084 | 10 |
| 8. Dashboard | REQ-090 to REQ-096 | 7 |
| 9. Mock Data & Seeding | REQ-100 to REQ-104 | 5 |
| 10. Data & Environment Constraints | REQ-110 to REQ-112 | 3 |
| 11. Non-Functional | REQ-120 to REQ-127 | 8 |
| **Total** | | **93** |

---

## Open Questions for Review

1. Are the threshold values (R50,000 / R5,000 / R1,000) realistic for the target operations team?
2. Is the two-tier age escalation (7-day bump + 14-day forced escalate) appropriately aggressive, or should thresholds be longer?
3. Should override reasons be free-text or selected from a predefined list?
4. Is the `DSP-YYYYMMDD-XXXX` identifier format acceptable, or does the team prefer UUIDs?
5. Should EFT-specific disputes route to `EFT_OPERATIONS` via a dedicated rule, or is the current `PAYMENTS_INVESTIGATIONS` queue sufficient?
6. For `INCORRECT_AMOUNT` disputes, should the threshold be based on the absolute amount or the difference between disputed and actual amount?
