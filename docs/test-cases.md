# Test Cases — Intelligent Triage of Customer Payment Disputes

**Artefact:** `docs/test-cases.md`
**Owner:** Group 26 — Test Architect
**Version:** 1.0
**Date:** 22 June 2026
**Traces to:** `docs/requirements.md` v4.0

---

## Related Documents

- [Requirements](./requirements.md) — EARS requirements specification (v4.0)
- [User Journeys](./user-journeys.md) — End-to-end user flows
- [API Specification](./api-spec.md) — Endpoint definitions
- [UI Specification](./ui-spec.md) — Screen specifications

---

## 1. Dispute Capture

**User Journey:** Journey 1 (Capture a New Dispute)

### TC-001: Successful dispute creation with all valid fields
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with customerName="Thabo Molefe", accountNumber="1234567890", transactionRef="TXN-20260615-001", amount=2500.00, transactionDate="2026-06-20", paymentType="EFT", issueCategory="DUPLICATE_DEBIT", transactionStatus="SETTLED"
- **THEN** the system creates a dispute record with status `OPEN`
- **AND** returns a unique case reference in format `DSP-20260622-0001`
- **AND** the response is returned within 2 seconds
- **Traces:** REQ-001, REQ-002

### TC-002: Reject dispute without customer name
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with customerName missing and all other fields valid
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message contains "Customer name is required"
- **Traces:** REQ-003

### TC-003: Reject dispute without account number
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with accountNumber missing and all other fields valid
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message contains "Account number is required"
- **Traces:** REQ-003

### TC-004: Reject dispute without transaction reference
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with transactionRef missing and all other fields valid
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message contains "Transaction reference is required"
- **Traces:** REQ-003

### TC-005: Reject dispute with zero amount
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with amount=0 and all other fields valid
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message contains "Amount must be a positive value"
- **Traces:** REQ-005

### TC-006: Reject dispute with negative amount
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with amount=-500.00 and all other fields valid
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message contains "Amount must be a positive value"
- **Traces:** REQ-005

### TC-007: Reject dispute with future transaction date
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a dispute with transactionDate="2026-12-31" (in the future) and all other fields valid
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message contains "Transaction date cannot be in the future"
- **Traces:** REQ-006

### TC-008: Reject dispute with invalid payment type
- **GIVEN** an operations user submits a dispute via API
- **WHEN** paymentType="CRYPTO" (not in enumeration)
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message indicates the invalid payment type value
- **Traces:** REQ-004

### TC-009: Reject dispute with invalid issue category
- **GIVEN** an operations user submits a dispute via API
- **WHEN** issueCategory="CHARGEBACK" (not in enumeration)
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message indicates the invalid issue category value
- **Traces:** REQ-004

### TC-010: Reject dispute with invalid transaction status
- **GIVEN** an operations user submits a dispute via API
- **WHEN** transactionStatus="CANCELLED" (not in enumeration)
- **THEN** the system rejects the submission with HTTP 400
- **AND** the error message indicates the invalid transaction status value
- **Traces:** REQ-004

### TC-011: Accept dispute with optional description
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they submit a valid dispute with description="Customer called to report duplicate charge on grocery purchase"
- **THEN** the system creates the dispute successfully
- **AND** the description is persisted and retrievable
- **Traces:** REQ-008

### TC-012: Form dropdowns restrict to valid enumerations
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they interact with the payment type, issue category, and transaction status fields
- **THEN** each field presents only values from the defined enumerations
- **AND** no free-text entry is possible for these fields
- **Traces:** REQ-007

### TC-013: Client-side validation prevents submission
- **GIVEN** an operations user is on the dispute capture form
- **WHEN** they attempt to submit with amount field empty
- **THEN** the client displays an inline error message within 500ms
- **AND** the form is not submitted to the server
- **Traces:** REQ-009, REQ-125

---

## 2. Age, Priority & Due Date

**User Journeys:** Journey 2 (Automatic Triage), Journey 7 (Auto-Escalation)

### TC-020: Age band NEW — dispute less than 2 days old
- **GIVEN** a dispute with transactionDate = today
- **WHEN** the system evaluates the dispute
- **THEN** the age is 0 days
- **AND** the age band is set to `NEW`
- **Traces:** REQ-010, REQ-011

### TC-021: Age band AGEING — dispute 3 days old
- **GIVEN** a dispute with transactionDate = 3 days ago
- **WHEN** the system evaluates the dispute
- **THEN** the age is 3 days
- **AND** the age band is set to `AGEING`
- **Traces:** REQ-010, REQ-012

### TC-022: Age band BREACHED — dispute 7 days old
- **GIVEN** a dispute with transactionDate = 7 days ago
- **WHEN** the system evaluates the dispute
- **THEN** the age is 7 days
- **AND** the age band is set to `BREACHED`
- **Traces:** REQ-010, REQ-013

### TC-023: Priority CRITICAL — amount at R50,000
- **GIVEN** a dispute with amount=50000.00, issueCategory="DUPLICATE_DEBIT"
- **WHEN** the system evaluates priority
- **THEN** priority is set to `CRITICAL`
- **Traces:** REQ-014

### TC-024: Priority CRITICAL — unauthorised transaction above R5,000
- **GIVEN** a dispute with amount=7500.00, issueCategory="UNAUTHORISED_TRANSACTION"
- **WHEN** the system evaluates priority
- **THEN** priority is set to `CRITICAL`
- **Traces:** REQ-014

### TC-025: Priority HIGH — unauthorised transaction at R5,000
- **GIVEN** a dispute with amount=5000.00, issueCategory="UNAUTHORISED_TRANSACTION"
- **WHEN** the system evaluates priority
- **THEN** priority is set to `HIGH`
- **Traces:** REQ-015

### TC-026: Priority HIGH — age band BREACHED
- **GIVEN** a dispute with amount=500.00, issueCategory="MISSING_PAYMENT", transactionDate=8 days ago
- **WHEN** the system evaluates priority
- **THEN** priority is set to `HIGH`
- **Traces:** REQ-015

### TC-027: Priority HIGH — failed transfer older than 48 hours
- **GIVEN** a dispute with issueCategory="FAILED_TRANSFER", transactionDate=3 days ago, amount=800.00
- **WHEN** the system evaluates priority
- **THEN** priority is set to `HIGH`
- **Traces:** REQ-015

### TC-028: Priority MEDIUM — amount at R1,000
- **GIVEN** a dispute with amount=1000.00, issueCategory="MISSING_PAYMENT", transactionDate=today
- **WHEN** the system evaluates priority
- **THEN** priority is set to `MEDIUM`
- **Traces:** REQ-016

### TC-029: Priority MEDIUM — age band AGEING
- **GIVEN** a dispute with amount=200.00, issueCategory="MISSING_PAYMENT", transactionDate=3 days ago
- **WHEN** the system evaluates priority
- **THEN** priority is set to `MEDIUM`
- **Traces:** REQ-016

### TC-030: Priority LOW — no escalation conditions met
- **GIVEN** a dispute with amount=200.00, issueCategory="MISSING_PAYMENT", transactionDate=today, paymentType="INTERNAL_TRANSFER"
- **WHEN** the system evaluates priority
- **THEN** priority is set to `LOW`
- **Traces:** REQ-017

### TC-031: Priority bump after SLA_DAYS
- **GIVEN** a dispute with amount=200.00, issueCategory="MISSING_PAYMENT", transactionDate=8 days ago (original priority would be LOW)
- **WHEN** the system evaluates the dispute
- **THEN** priority is bumped from LOW to MEDIUM (one level up)
- **Traces:** REQ-018

### TC-032: Forced ESCALATE after ESCALATION_DAYS
- **GIVEN** a dispute with amount=200.00, issueCategory="MISSING_PAYMENT", transactionDate=15 days ago
- **WHEN** the system evaluates the dispute
- **THEN** recommended action is overridden to `ESCALATE`
- **AND** this applies regardless of what other rules would recommend
- **Traces:** REQ-019

### TC-033: Due date calculation
- **GIVEN** a dispute with transactionDate="2026-06-15"
- **WHEN** the system creates the dispute
- **THEN** dueDate is set to "2026-06-22" (transactionDate + 7 days)
- **Traces:** REQ-020

---

## 3. Queue Assignment

**User Journey:** Journey 2 (Automatic Triage), Journey 3 (Work the Queue)

### TC-040: Card payment assigned to CARD_DISPUTES
- **GIVEN** a dispute with paymentType="CARD", issueCategory="DUPLICATE_DEBIT"
- **WHEN** the system assigns the queue
- **THEN** the dispute is routed to `CARD_DISPUTES`
- **Traces:** REQ-025

### TC-041: EFT payment assigned to PAYMENTS_INVESTIGATIONS
- **GIVEN** a dispute with paymentType="EFT", issueCategory="MISSING_PAYMENT"
- **WHEN** the system assigns the queue
- **THEN** the dispute is routed to `PAYMENTS_INVESTIGATIONS`
- **Traces:** REQ-026

### TC-042: Internal transfer assigned to INTERNAL_PAYMENTS_OPS
- **GIVEN** a dispute with paymentType="INTERNAL_TRANSFER", issueCategory="FAILED_TRANSFER"
- **WHEN** the system assigns the queue
- **THEN** the dispute is routed to `INTERNAL_PAYMENTS_OPS`
- **Traces:** REQ-027

### TC-043: Unauthorised transaction overrides queue to FRAUD_OPERATIONS
- **GIVEN** a dispute with paymentType="EFT", issueCategory="UNAUTHORISED_TRANSACTION"
- **WHEN** the system assigns the queue
- **THEN** the dispute is routed to `FRAUD_OPERATIONS` (overriding the EFT default)
- **Traces:** REQ-028

---

## 4. Triage Decision Engine

**User Journeys:** Journey 2 (Automatic Triage), Journey 7 (Auto-Escalation)

### TC-050: Rule 1 — Forced escalation by age (>14 days)
- **GIVEN** a dispute with transactionDate=16 days ago, amount=500.00, issueCategory="MISSING_PAYMENT"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE`
- **AND** the rule identifier returned is `REQ-031`
- **Traces:** REQ-030, REQ-031

### TC-051: Rule 2 — High-value transaction (≥R50,000)
- **GIVEN** a dispute with amount=75000.00, issueCategory="DUPLICATE_DEBIT", transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE`
- **AND** priority is `CRITICAL`
- **AND** the rule identifier returned is `REQ-032`
- **Traces:** REQ-030, REQ-032

### TC-052: Rule 3 — Unauthorised transaction above R5,000
- **GIVEN** a dispute with issueCategory="UNAUTHORISED_TRANSACTION", amount=8000.00, transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE`
- **AND** queue is `FRAUD_OPERATIONS`
- **AND** the rule identifier returned is `REQ-033`
- **Traces:** REQ-030, REQ-033

### TC-053: Rule 3 — Unauthorised transaction at or below R5,000
- **GIVEN** a dispute with issueCategory="UNAUTHORISED_TRANSACTION", amount=3000.00, transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** queue is `FRAUD_OPERATIONS`
- **AND** the rule identifier returned is `REQ-034`
- **Traces:** REQ-030, REQ-034

### TC-054: Fraud referral flag — Card + Unauthorised
- **GIVEN** a dispute with paymentType="CARD", issueCategory="UNAUTHORISED_TRANSACTION", amount=2000.00
- **WHEN** the triage engine evaluates the dispute
- **THEN** the dispute record includes a fraud referral flag
- **AND** queue is `FRAUD_OPERATIONS`
- **Traces:** REQ-035

### TC-055: Rule 4 — SLA breach escalation
- **GIVEN** a dispute with transactionDate=9 days ago, amount=400.00, issueCategory="INCORRECT_AMOUNT", transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE`
- **AND** the explanation indicates SLA breach
- **AND** the rule identifier returned is `REQ-036`
- **Traces:** REQ-030, REQ-036

### TC-056: Rule 5 — Pending settlement
- **GIVEN** a dispute with transactionStatus="PENDING", amount=400.00, issueCategory="MISSING_PAYMENT", transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** the explanation indicates transaction has not yet settled
- **AND** the rule identifier returned is `REQ-037`
- **Traces:** REQ-030, REQ-037

### TC-057: Rule 6 — Duplicate debit, settled, below R1,000
- **GIVEN** a dispute with issueCategory="DUPLICATE_DEBIT", transactionStatus="SETTLED", amount=750.00, transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `RESOLVE_NOW`
- **AND** priority is `MEDIUM`
- **AND** the rule identifier returned is `REQ-038`
- **Traces:** REQ-030, REQ-038

### TC-058: Rule 6 — Duplicate debit, pending
- **GIVEN** a dispute with issueCategory="DUPLICATE_DEBIT", transactionStatus="PENDING", amount=750.00, transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** priority is `LOW`
- **AND** the rule identifier returned is `REQ-039`
- **Traces:** REQ-030, REQ-039

### TC-059: Rule 7 — Failed transfer older than 48 hours
- **GIVEN** a dispute with issueCategory="FAILED_TRANSFER", transactionStatus="FAILED", transactionDate=3 days ago, amount=800.00
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE`
- **AND** priority is `HIGH`
- **AND** the rule identifier returned is `REQ-040`
- **Traces:** REQ-030, REQ-040

### TC-060: Rule 7 — Failed transfer within 48 hours
- **GIVEN** a dispute with issueCategory="FAILED_TRANSFER", transactionStatus="FAILED", transactionDate=1 day ago, amount=800.00
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** priority is `MEDIUM`
- **AND** the rule identifier returned is `REQ-041`
- **Traces:** REQ-030, REQ-041

### TC-061: Rule 8 — Incorrect amount above R10,000
- **GIVEN** a dispute with issueCategory="INCORRECT_AMOUNT", amount=15000.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE`
- **AND** priority is `HIGH`
- **AND** the rule identifier returned is `REQ-042`
- **Traces:** REQ-030, REQ-042

### TC-062: Rule 8 — Incorrect amount at or below R10,000
- **GIVEN** a dispute with issueCategory="INCORRECT_AMOUNT", amount=5000.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** priority is `MEDIUM`
- **AND** the rule identifier returned is `REQ-043`
- **Traces:** REQ-030, REQ-043

### TC-063: Rule 9 — Missing payment, Card
- **GIVEN** a dispute with issueCategory="MISSING_PAYMENT", paymentType="CARD", amount=2000.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `REFER`
- **AND** queue is `CARD_DISPUTES`
- **AND** priority is `HIGH`
- **AND** the rule identifier returned is `REQ-044`
- **Traces:** REQ-030, REQ-044

### TC-064: Rule 9 — Missing payment, EFT
- **GIVEN** a dispute with issueCategory="MISSING_PAYMENT", paymentType="EFT", amount=2000.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** priority is `MEDIUM`
- **AND** the rule identifier returned is `REQ-045`
- **Traces:** REQ-030, REQ-045

### TC-065: Rule 9 — Missing payment, Internal Transfer
- **GIVEN** a dispute with issueCategory="MISSING_PAYMENT", paymentType="INTERNAL_TRANSFER", amount=200.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** priority is `LOW`
- **AND** the rule identifier returned is `REQ-046`
- **Traces:** REQ-030, REQ-046

### TC-066: Rule 10 — Card dispute routing (not unauthorised/missing)
- **GIVEN** a dispute with paymentType="CARD", issueCategory="INCORRECT_AMOUNT", amount=500.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `REFER`
- **AND** queue is `CARD_DISPUTES`
- **AND** the rule identifier returned is `REQ-047`
- **Traces:** REQ-030, REQ-047

### TC-067: Rule 11 — Default action (no rule matches)
- **GIVEN** a dispute with paymentType="EFT", issueCategory="INCORRECT_AMOUNT", amount=500.00, transactionDate=today, transactionStatus="SETTLED"
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `INVESTIGATE`
- **AND** the rule identifier returned is `REQ-048`
- **Traces:** REQ-030, REQ-048

### TC-068: Precedence — high-value overrides unauthorised
- **GIVEN** a dispute with issueCategory="UNAUTHORISED_TRANSACTION", amount=55000.00, transactionDate=today
- **WHEN** the triage engine evaluates the dispute
- **THEN** recommended action is `ESCALATE` (high-value rule wins over unauthorised rule)
- **AND** priority is `CRITICAL`
- **AND** the rule identifier returned is `REQ-032`
- **Traces:** REQ-030, REQ-032

### TC-069: Deterministic — identical inputs produce identical outputs
- **GIVEN** two disputes with identical decision factors (same amount, issueCategory, transactionStatus, paymentType, transactionDate)
- **WHEN** the triage engine evaluates both
- **THEN** both receive the same recommended action, priority, queue, and rule identifier
- **Traces:** REQ-054

---

## 5. Recommendation Explainability

**User Journey:** Journey 4 (Review Dispute Detail and Recommendation)

### TC-070: Explanation includes rule identifier
- **GIVEN** a dispute that triggers rule REQ-038 (duplicate debit auto-resolve)
- **WHEN** the system returns the triage result
- **THEN** the response includes ruleId="REQ-038"
- **Traces:** REQ-050

### TC-071: Explanation includes all decision factors
- **GIVEN** a dispute with issueCategory="DUPLICATE_DEBIT", transactionStatus="SETTLED", amount=750.00, ageBand="NEW"
- **WHEN** the system returns the triage result
- **THEN** the response includes issueCategory, transactionStatus, amount, amountBand (below LOW_VALUE_THRESHOLD), ageBand, priority, and queue
- **Traces:** REQ-051

### TC-072: Plain-language explanation uses business terminology
- **GIVEN** a dispute that triggers the duplicate debit auto-resolve rule
- **WHEN** the system returns the explanation
- **THEN** the explanation reads in business language (e.g. "This is a low-value duplicate debit on a settled transaction. Recommended to reverse immediately.")
- **AND** does not contain technical jargon or code references
- **Traces:** REQ-052

### TC-073: REFER action includes target routing queue
- **GIVEN** a dispute that triggers REQ-044 (missing payment on Card)
- **WHEN** the system returns the triage result
- **THEN** the response includes targetQueue="CARD_DISPUTES"
- **Traces:** REQ-053

### TC-074: ESCALATE action includes target routing queue
- **GIVEN** a dispute that triggers REQ-033 (unauthorised above R5,000)
- **WHEN** the system returns the triage result
- **THEN** the response includes targetQueue="FRAUD_OPERATIONS"
- **Traces:** REQ-053

### TC-075: Triage decision is logged for audit
- **GIVEN** a dispute is submitted and triaged
- **WHEN** the system completes the triage
- **THEN** a log entry is created containing input data, rules evaluated, rules triggered, and output recommendation
- **Traces:** REQ-055

---

## 6. Dispute Queue & List

**User Journey:** Journey 3 (Review and Work the Dispute Queue), Journey 4 (Review Detail)

### TC-080: Queue displays all required columns
- **GIVEN** at least 5 disputes exist in the system
- **WHEN** the operations user views the dispute queue
- **THEN** each row shows: case reference, customer name, payment type, issue category, amount (R), priority (colour-coded), recommended action, assigned queue, due date, age in days, and status
- **Traces:** REQ-060

### TC-081: Queue sorted by priority then age
- **GIVEN** disputes exist with priorities CRITICAL (age 2), HIGH (age 5), HIGH (age 3), MEDIUM (age 1)
- **WHEN** the operations user views the dispute queue
- **THEN** the order is: CRITICAL(2d), HIGH(5d), HIGH(3d), MEDIUM(1d)
- **Traces:** REQ-061

### TC-082: Filter by priority
- **GIVEN** disputes exist with priorities CRITICAL, HIGH, MEDIUM, LOW
- **WHEN** the operations user filters by priority="HIGH"
- **THEN** only HIGH priority disputes are displayed
- **Traces:** REQ-062

### TC-083: Filter by payment type
- **GIVEN** disputes exist with all three payment types
- **WHEN** the operations user filters by paymentType="CARD"
- **THEN** only Card payment disputes are displayed
- **Traces:** REQ-063

### TC-084: Filter by issue category
- **GIVEN** disputes exist with multiple issue categories
- **WHEN** the operations user filters by issueCategory="FAILED_TRANSFER"
- **THEN** only Failed Transfer disputes are displayed
- **Traces:** REQ-064

### TC-085: Filter by recommended action
- **GIVEN** disputes exist with various recommended actions
- **WHEN** the operations user filters by action="ESCALATE"
- **THEN** only disputes with ESCALATE recommendation are displayed
- **Traces:** REQ-065

### TC-086: Filter by status
- **GIVEN** disputes exist with statuses OPEN, IN_PROGRESS, RESOLVED, CLOSED
- **WHEN** the operations user filters by status="OPEN"
- **THEN** only OPEN disputes are displayed
- **Traces:** REQ-066

### TC-087: Click row navigates to detail
- **GIVEN** disputes are displayed in the queue
- **WHEN** the operations user clicks a dispute row
- **THEN** the system navigates to the dispute detail view for that case
- **Traces:** REQ-067

### TC-088: Dispute detail shows full recommendation
- **GIVEN** a dispute exists with a triage recommendation
- **WHEN** the operations user opens the dispute detail
- **THEN** the detail view displays the recommendation panel with action, priority, queue, explanation, and rule identifier
- **Traces:** REQ-068

### TC-089: SLA threshold highlighting
- **GIVEN** a dispute with age=8 days (SLA_DAYS breached)
- **WHEN** the operations user opens the dispute detail
- **THEN** the system visually highlights the SLA breach
- **Traces:** REQ-069

### TC-090: Escalation threshold highlighting
- **GIVEN** a dispute with age=15 days (ESCALATION_DAYS breached)
- **WHEN** the operations user opens the dispute detail
- **THEN** the system visually highlights the escalation breach
- **Traces:** REQ-069

### TC-091: Fraud indicator in queue
- **GIVEN** a dispute with paymentType="CARD" and issueCategory="UNAUTHORISED_TRANSACTION" (fraud flag set)
- **WHEN** the operations user views the dispute queue
- **THEN** a visual fraud indicator is displayed in that dispute's row
- **Traces:** REQ-070

---

## 7. Override & Status Management

**User Journeys:** Journey 5 (Override a Recommendation), Journey 6 (Progress Dispute Through Statuses)

### TC-100: Override recommended action
- **GIVEN** an operations user is viewing a dispute with action=`INVESTIGATE`
- **WHEN** they override the action to `ESCALATE` with reason="Customer is a VIP client requiring immediate attention"
- **THEN** the system saves the override
- **AND** the current action is now `ESCALATE`
- **AND** the original recommendation `INVESTIGATE` is preserved for audit
- **Traces:** REQ-075, REQ-078

### TC-101: Override priority
- **GIVEN** an operations user is viewing a dispute with priority=`MEDIUM`
- **WHEN** they override the priority to `HIGH` with reason="Customer escalated through branch manager"
- **THEN** the system saves the override
- **AND** the current priority is now `HIGH`
- **AND** the original priority `MEDIUM` is preserved for audit
- **Traces:** REQ-076, REQ-078

### TC-102: Override requires reason (minimum 10 characters)
- **GIVEN** an operations user is overriding a recommendation
- **WHEN** they provide a reason of "Too short" (9 characters)
- **THEN** the system rejects the override
- **AND** displays an error indicating minimum 10 characters required
- **Traces:** REQ-077

### TC-103: Override reason maximum 300 characters
- **GIVEN** an operations user is overriding a recommendation
- **WHEN** they provide a reason exceeding 300 characters
- **THEN** the system rejects the override or truncates at 300 characters
- **Traces:** REQ-077

### TC-104: Visual indicator for overridden dispute
- **GIVEN** a dispute has been overridden
- **WHEN** the operations user views the dispute detail
- **THEN** the system visually indicates the action was set manually (not by the rules engine)
- **Traces:** REQ-079

### TC-105: Status transition OPEN to IN_PROGRESS
- **GIVEN** a dispute with status=`OPEN`
- **WHEN** the operations user changes status to `IN_PROGRESS`
- **THEN** the system updates the status
- **AND** records the transition with timestamp and operator ID
- **Traces:** REQ-080, REQ-084

### TC-106: Status transition IN_PROGRESS to RESOLVED requires note
- **GIVEN** a dispute with status=`IN_PROGRESS`
- **WHEN** the operations user changes status to `RESOLVED` without a resolution note
- **THEN** the system rejects the transition
- **AND** displays an error requiring a resolution note of at least 10 characters
- **Traces:** REQ-081

### TC-107: Status transition IN_PROGRESS to RESOLVED with valid note
- **GIVEN** a dispute with status=`IN_PROGRESS`
- **WHEN** the operations user changes status to `RESOLVED` with resolutionNote="Duplicate confirmed and reversed via internal process ref IR-4421"
- **THEN** the system updates the status to `RESOLVED`
- **AND** records the transition with timestamp and operator ID
- **Traces:** REQ-080, REQ-081, REQ-084

### TC-108: Closure only from RESOLVED status
- **GIVEN** a dispute with status=`IN_PROGRESS`
- **WHEN** the operations user attempts to change status to `CLOSED`
- **THEN** the system rejects the transition
- **AND** displays an error indicating closure is only allowed from RESOLVED status
- **Traces:** REQ-082

### TC-109: Successful closure from RESOLVED
- **GIVEN** a dispute with status=`RESOLVED`
- **WHEN** the operations user changes status to `CLOSED`
- **THEN** the system updates the status to `CLOSED`
- **AND** records the transition with timestamp and operator ID
- **Traces:** REQ-080, REQ-082, REQ-084

### TC-110: Closed dispute is immutable
- **GIVEN** a dispute with status=`CLOSED`
- **WHEN** the operations user attempts to modify any field (action, priority, status, or notes)
- **THEN** the system rejects the modification
- **AND** displays an error indicating closed disputes cannot be modified
- **Traces:** REQ-083

---

## 8. Dashboard

**User Journey:** Journey 8 (Monitor the Dashboard)

### TC-120: Dashboard displays operational metrics
- **GIVEN** the database contains 25 seeded disputes
- **WHEN** the operations user opens the dashboard
- **THEN** the system displays: total open disputes, counts by priority, counts by recommended action, counts by queue, counts by payment type, and average dispute age
- **Traces:** REQ-090

### TC-121: Dashboard shows early warning counts
- **GIVEN** disputes exist with ages of 5, 6, 7, 12, 13, and 14 days
- **WHEN** the operations user views the dashboard
- **THEN** the system shows count of disputes approaching SLA (5–7 days) and escalation (12–14 days) thresholds
- **Traces:** REQ-091

### TC-122: Dashboard shows override percentage
- **GIVEN** 10 disputes exist, 3 of which have been overridden
- **WHEN** the operations user views the dashboard
- **THEN** the system displays override rate as 30%
- **Traces:** REQ-092

### TC-123: Priority colour coding
- **GIVEN** disputes exist at all four priority levels
- **WHEN** the operations user views the queue or dashboard
- **THEN** CRITICAL displays in red, HIGH in orange, MEDIUM in amber, LOW in green
- **Traces:** REQ-093

### TC-124: Age band visual badges
- **GIVEN** disputes exist in all three age bands
- **WHEN** the operations user views the queue
- **THEN** NEW shows a neutral badge, AGEING shows a warning badge, BREACHED shows an alert badge
- **Traces:** REQ-094

### TC-125: Recommended action label prominence
- **GIVEN** a dispute detail view is open
- **WHEN** the operations user views the recommendation
- **THEN** the action is displayed as a prominent call-to-action label with explanation text
- **Traces:** REQ-095

### TC-126: Summary bar above queue
- **GIVEN** disputes exist at various priority levels
- **WHEN** the operations user views the queue
- **THEN** a summary bar above the list shows counts per priority level
- **Traces:** REQ-096

---

## 9. Mock Data & Seeding

**User Journey:** N/A (System seeding)

### TC-130: Seed data covers all payment types
- **GIVEN** the system is initialised with seed data
- **WHEN** the operations user views the dispute queue
- **THEN** disputes with paymentType CARD, EFT, and INTERNAL_TRANSFER are all present
- **Traces:** REQ-100

### TC-131: Seed data covers all issue categories
- **GIVEN** the system is initialised with seed data
- **WHEN** the operations user filters by each issue category
- **THEN** at least one dispute exists for each of: DUPLICATE_DEBIT, FAILED_TRANSFER, MISSING_PAYMENT, UNAUTHORISED_TRANSACTION, INCORRECT_AMOUNT
- **Traces:** REQ-100

### TC-132: Seed data covers all priority levels
- **GIVEN** the system is initialised with seed data
- **WHEN** the operations user filters by each priority
- **THEN** at least one dispute exists at CRITICAL, HIGH, MEDIUM, and LOW
- **Traces:** REQ-100

### TC-133: Seed data includes realistic SA data
- **GIVEN** the system is initialised with seed data
- **WHEN** the operations user views dispute details
- **THEN** customer names are realistic South African names, account numbers are 10 digits, and transaction references follow a consistent format
- **Traces:** REQ-101

### TC-134: Seed data has distributed dates
- **GIVEN** the system is initialised with seed data
- **WHEN** the disputes are examined
- **THEN** transaction dates are distributed across the last 30 days
- **Traces:** REQ-102

### TC-135: Seed data triggers 7-day escalation
- **GIVEN** the system is initialised with seed data
- **WHEN** the operations user checks the queue
- **THEN** at least 3 disputes have triggered the 7-day priority bump (REQ-018)
- **Traces:** REQ-103

### TC-136: Seed data triggers 14-day escalation
- **GIVEN** the system is initialised with seed data
- **WHEN** the operations user checks the queue
- **THEN** at least 2 disputes have triggered the 14-day forced escalation (REQ-019)
- **Traces:** REQ-103

### TC-137: Seed data covers all triage rules
- **GIVEN** the system is initialised with seed data
- **WHEN** the disputes are examined
- **THEN** at least one dispute triggered each rule from REQ-031 through REQ-048
- **Traces:** REQ-104

---

## 10. Non-Functional Requirements

**User Journey:** Applicable across all journeys

### TC-140: Dispute creation response time
- **GIVEN** the system is running under normal load
- **WHEN** an operations user submits a valid dispute
- **THEN** the response (including triage result) is returned within 2 seconds
- **Traces:** REQ-120

### TC-141: Queue load response time
- **GIVEN** the database contains 100 dispute records
- **WHEN** the operations user loads the dispute queue
- **THEN** the list renders within 1 second
- **Traces:** REQ-121

### TC-142: Browser compatibility
- **GIVEN** the system is deployed
- **WHEN** accessed via Chrome, Firefox, or Edge (latest versions)
- **THEN** all features render and function correctly without plugins
- **Traces:** REQ-122

### TC-143: Currency formatting
- **GIVEN** a dispute with amount=12500.50
- **WHEN** displayed anywhere in the UI
- **THEN** the amount is formatted as "R 12,500.50"
- **Traces:** REQ-123

### TC-144: Date formatting
- **GIVEN** a dispute with transactionDate="2026-06-15"
- **WHEN** displayed in the UI
- **THEN** the date is formatted as "15 Jun 2026"
- **Traces:** REQ-124

### TC-145: Inline validation error timing
- **GIVEN** the operations user is on the dispute capture form
- **WHEN** they submit with invalid data
- **THEN** inline error messages appear within 500 milliseconds
- **Traces:** REQ-125

### TC-146: Accessibility — ARIA labels
- **GIVEN** the system is rendered in a browser
- **WHEN** inspected with accessibility tools
- **THEN** all interactive elements have appropriate ARIA labels
- **AND** the UI is navigable via keyboard only
- **Traces:** REQ-126

### TC-147: No real customer data
- **GIVEN** the system is running
- **WHEN** the database is inspected
- **THEN** all customer data is synthetic and clearly identifiable as mock data
- **Traces:** REQ-127

---

## Test Cases Summary

| Section | Test Cases | Count |
|---|---|---|
| 1. Dispute Capture | TC-001 to TC-013 | 13 |
| 2. Age, Priority & Due Date | TC-020 to TC-033 | 14 |
| 3. Queue Assignment | TC-040 to TC-043 | 4 |
| 4. Triage Decision Engine | TC-050 to TC-069 | 20 |
| 5. Recommendation Explainability | TC-070 to TC-075 | 6 |
| 6. Dispute Queue & List | TC-080 to TC-091 | 12 |
| 7. Override & Status Management | TC-100 to TC-110 | 11 |
| 8. Dashboard | TC-120 to TC-126 | 7 |
| 9. Mock Data & Seeding | TC-130 to TC-137 | 8 |
| 10. Non-Functional | TC-140 to TC-147 | 8 |
| **Total** | | **103** |

---

## User Journey Traceability

| User Journey | Test Cases |
|--------------|------------|
| Journey 1: Capture Dispute | TC-001 to TC-013 |
| Journey 2: Automatic Triage | TC-020 to TC-033, TC-040 to TC-043, TC-050 to TC-069 |
| Journey 3: Work the Queue | TC-080 to TC-091 |
| Journey 4: Review Detail | TC-070 to TC-075, TC-088 to TC-090 |
| Journey 5: Override Recommendation | TC-100 to TC-104 |
| Journey 6: Progress Status | TC-105 to TC-110 |
| Journey 7: Auto-Escalation | TC-031, TC-032, TC-050 |
| Journey 8: Monitor Dashboard | TC-120 to TC-126 |

---

## Requirements-to-Test Coverage

| Requirement Section | Total REQs | REQs Covered | Coverage |
|---|---|---|---|
| 1. Dispute Capture (REQ-001 to REQ-009) | 9 | 9 | 100% |
| 2. Age, Priority & Due Date (REQ-010 to REQ-020) | 11 | 11 | 100% |
| 3. Queue Assignment (REQ-025 to REQ-028) | 4 | 4 | 100% |
| 4. Triage Decision Engine (REQ-030 to REQ-048) | 19 | 19 | 100% |
| 5. Recommendation Explainability (REQ-050 to REQ-055) | 6 | 6 | 100% |
| 6. Dispute Queue & List (REQ-060 to REQ-070) | 11 | 11 | 100% |
| 7. Override & Status Management (REQ-075 to REQ-084) | 10 | 10 | 100% |
| 8. Dashboard (REQ-090 to REQ-096) | 7 | 7 | 100% |
| 9. Mock Data & Seeding (REQ-100 to REQ-104) | 5 | 5 | 100% |
| 10. Data & Environment Constraints (REQ-110 to REQ-112) | 3 | 3 | 100% |
| 11. Non-Functional (REQ-120 to REQ-127) | 8 | 8 | 100% |
| **TOTAL** | **93** | **93** | **100%** |

---

## Requirements Traceability Matrix

| Requirement | Test Case(s) | Status |
|-------------|-------------|--------|
| REQ-001 | TC-001 | ✓ Covered |
| REQ-002 | TC-001 | ✓ Covered |
| REQ-003 | TC-002, TC-003, TC-004 | ✓ Covered |
| REQ-004 | TC-008, TC-009, TC-010 | ✓ Covered |
| REQ-005 | TC-005, TC-006 | ✓ Covered |
| REQ-006 | TC-007 | ✓ Covered |
| REQ-007 | TC-012 | ✓ Covered |
| REQ-008 | TC-011 | ✓ Covered |
| REQ-009 | TC-013 | ✓ Covered |
| REQ-010 | TC-020, TC-021, TC-022 | ✓ Covered |
| REQ-011 | TC-020 | ✓ Covered |
| REQ-012 | TC-021 | ✓ Covered |
| REQ-013 | TC-022 | ✓ Covered |
| REQ-014 | TC-023, TC-024 | ✓ Covered |
| REQ-015 | TC-025, TC-026, TC-027 | ✓ Covered |
| REQ-016 | TC-028, TC-029 | ✓ Covered |
| REQ-017 | TC-030 | ✓ Covered |
| REQ-018 | TC-031 | ✓ Covered |
| REQ-019 | TC-032 | ✓ Covered |
| REQ-020 | TC-033 | ✓ Covered |
| REQ-025 | TC-040 | ✓ Covered |
| REQ-026 | TC-041 | ✓ Covered |
| REQ-027 | TC-042 | ✓ Covered |
| REQ-028 | TC-043 | ✓ Covered |
| REQ-030 | TC-050, TC-051, TC-068 | ✓ Covered |
| REQ-031 | TC-050 | ✓ Covered |
| REQ-032 | TC-051, TC-068 | ✓ Covered |
| REQ-033 | TC-052 | ✓ Covered |
| REQ-034 | TC-053 | ✓ Covered |
| REQ-035 | TC-054 | ✓ Covered |
| REQ-036 | TC-055 | ✓ Covered |
| REQ-037 | TC-056 | ✓ Covered |
| REQ-038 | TC-057 | ✓ Covered |
| REQ-039 | TC-058 | ✓ Covered |
| REQ-040 | TC-059 | ✓ Covered |
| REQ-041 | TC-060 | ✓ Covered |
| REQ-042 | TC-061 | ✓ Covered |
| REQ-043 | TC-062 | ✓ Covered |
| REQ-044 | TC-063 | ✓ Covered |
| REQ-045 | TC-064 | ✓ Covered |
| REQ-046 | TC-065 | ✓ Covered |
| REQ-047 | TC-066 | ✓ Covered |
| REQ-048 | TC-067 | ✓ Covered |
| REQ-050 | TC-070 | ✓ Covered |
| REQ-051 | TC-071 | ✓ Covered |
| REQ-052 | TC-072 | ✓ Covered |
| REQ-053 | TC-073, TC-074 | ✓ Covered |
| REQ-054 | TC-069 | ✓ Covered |
| REQ-055 | TC-075 | ✓ Covered |
| REQ-060 | TC-080 | ✓ Covered |
| REQ-061 | TC-081 | ✓ Covered |
| REQ-062 | TC-082 | ✓ Covered |
| REQ-063 | TC-083 | ✓ Covered |
| REQ-064 | TC-084 | ✓ Covered |
| REQ-065 | TC-085 | ✓ Covered |
| REQ-066 | TC-086 | ✓ Covered |
| REQ-067 | TC-087 | ✓ Covered |
| REQ-068 | TC-088 | ✓ Covered |
| REQ-069 | TC-089, TC-090 | ✓ Covered |
| REQ-070 | TC-091 | ✓ Covered |
| REQ-075 | TC-100 | ✓ Covered |
| REQ-076 | TC-101 | ✓ Covered |
| REQ-077 | TC-102, TC-103 | ✓ Covered |
| REQ-078 | TC-100, TC-101 | ✓ Covered |
| REQ-079 | TC-104 | ✓ Covered |
| REQ-080 | TC-105, TC-107, TC-109 | ✓ Covered |
| REQ-081 | TC-106, TC-107 | ✓ Covered |
| REQ-082 | TC-108, TC-109 | ✓ Covered |
| REQ-083 | TC-110 | ✓ Covered |
| REQ-084 | TC-105, TC-107, TC-109 | ✓ Covered |
| REQ-090 | TC-120 | ✓ Covered |
| REQ-091 | TC-121 | ✓ Covered |
| REQ-092 | TC-122 | ✓ Covered |
| REQ-093 | TC-123 | ✓ Covered |
| REQ-094 | TC-124 | ✓ Covered |
| REQ-095 | TC-125 | ✓ Covered |
| REQ-096 | TC-126 | ✓ Covered |
| REQ-100 | TC-130, TC-131, TC-132 | ✓ Covered |
| REQ-101 | TC-133 | ✓ Covered |
| REQ-102 | TC-134 | ✓ Covered |
| REQ-103 | TC-135, TC-136 | ✓ Covered |
| REQ-104 | TC-137 | ✓ Covered |
| REQ-110 | TC-147 | ✓ Covered |
| REQ-111 | TC-069 | ✓ Covered |
| REQ-112 | TC-147 | ✓ Covered |
| REQ-120 | TC-140 | ✓ Covered |
| REQ-121 | TC-141 | ✓ Covered |
| REQ-122 | TC-142 | ✓ Covered |
| REQ-123 | TC-143 | ✓ Covered |
| REQ-124 | TC-144 | ✓ Covered |
| REQ-125 | TC-013, TC-145 | ✓ Covered |
| REQ-126 | TC-146 | ✓ Covered |
| REQ-127 | TC-147 | ✓ Covered |

**Coverage: 93/93 requirements (100%) — 103 test cases total**
