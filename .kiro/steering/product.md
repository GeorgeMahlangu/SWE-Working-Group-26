# Product Overview — Payment Dispute Triage

#[[file:../../docs/requirements.md]]
#[[file:../../docs/user-journeys.md]]

## Project Context

An internal prototype for Standard Bank operations users to triage customer payment disputes. The system captures disputes, applies business rules, and recommends the next action with full transparency.

## Problem Statement

Bank customers expect payment issues resolved quickly and accurately. Frontline staff currently gather information manually, interpret issues, and decide next actions. This causes delays, inconsistent handling, and frustration.

## What This Prototype Does

1. Captures customer payment disputes (Card Payment, EFT, Internal Transfer) — **Journey 1**
2. Applies deterministic business rules to evaluate each case — **Journey 2**
3. Recommends one of: RESOLVE_NOW, INVESTIGATE, ESCALATE, REFER
4. Assigns priority (CRITICAL, HIGH, MEDIUM, LOW) and routes to a queue (CARD_DISPUTES, PAYMENTS_INVESTIGATIONS, INTERNAL_PAYMENTS_OPS, FRAUD_OPERATIONS)
5. Flags potential fraud cases for CARD + UNAUTHORISED_TRANSACTION
6. Shows a plain-language explanation with ruleId and decision factors — **Journey 4**
7. Tracks dispute lifecycle through statuses: OPEN → IN_PROGRESS → RESOLVED → CLOSED — **Journey 6**
8. Supports recommendation overrides with full audit trail — **Journey 5**
9. Automatically escalates ageing disputes (7-day priority bump, 14-day forced escalation) — **Journey 7**
10. Provides dashboard overview for operational monitoring — **Journey 8**

## The One Question It Answers

> "Given this payment dispute, what is the most appropriate next step right now, and why?"

## Domain Values

### Payment Types
- `CARD`
- `EFT`
- `INTERNAL_TRANSFER`

### Issue Categories
- `DUPLICATE_DEBIT`
- `FAILED_TRANSFER`
- `MISSING_PAYMENT`
- `UNAUTHORISED_TRANSACTION`
- `INCORRECT_AMOUNT`

### Transaction Statuses
- `SETTLED`
- `PENDING`
- `FAILED`
- `REVERSED`

### Recommended Actions
- `RESOLVE_NOW`
- `INVESTIGATE`
- `ESCALATE`
- `REFER`

### Priority Levels
- `LOW` (green)
- `MEDIUM` (amber)
- `HIGH` (orange)
- `CRITICAL` (red)

### Age Bands
- `NEW` (neutral badge)
- `AGEING` (warning badge)
- `BREACHED` (alert badge)

### Dispute Statuses
- `OPEN` (initial)
- `IN_PROGRESS`
- `RESOLVED` (requires resolution note, minimum 10 characters)
- `CLOSED` (only from RESOLVED, immutable after)

### Routing Queues
- `CARD_DISPUTES`
- `PAYMENTS_INVESTIGATIONS`
- `INTERNAL_PAYMENTS_OPS`
- `FRAUD_OPERATIONS`

## Validation Rules

### Required Fields (REQ-003 to REQ-010)
- Customer name
- Account number (exactly 10 digits)
- Transaction reference
- Transaction amount (> 0)
- Transaction date (not in future)
- Payment type
- Issue category

### Optional Fields (REQ-015)
- Description (max 500 characters)

### Case Reference Format (REQ-002)
`DSP-YYYYMMDD-XXXX` where XXXX is zero-padded sequential number for that day

## Constraints

- Mock data only — no real banking integrations
- Rules-based decisions — no AI/ML
- SQLite database for zero-infrastructure local operation
- South African context (Rand currency R X,XXX.XX, dates DD MMM YYYY)
- All data is synthetic for demonstration purposes only

## Users

- **Primary:** Banking operations users (frontline staff)
- **Secondary:** Supervisors (for escalation queue)

## User Journeys

The system supports 8 user journeys (see [user-journeys.md](../../Conference/payment-dispute-triage/docs/user-journeys.md)):

| Journey | Actor | Description |
|---------|-------|-------------|
| 1. Capture Dispute | Operations User | Log a new customer payment dispute |
| 2. Automatic Triage | System | Evaluate rules and assign priority/action |
| 3. Work the Queue | Operations User | Review and select disputes to work on |
| 4. Review Detail | Operations User | Understand triage reasoning |
| 5. Override Recommendation | Operations User | Set alternative action with audit trail |
| 6. Progress Status | Operations User | Move dispute through Open → Closed |
| 7. Auto-Escalation | System | Escalate ageing disputes automatically |
| 8. Monitor Dashboard | Operations User | Operational overview and early warnings |

## Success Criteria

- User can capture a dispute in under 60 seconds
- System returns recommendation within 2 seconds (triage within 1 second)
- Every recommendation includes a visible explanation with triggered rules
- Priority colour-coded: Critical (red), High (orange), Medium (yellow), Low (green)
- Fraud flag displayed for Card Payment + Unauthorized Transaction cases
- All status transitions and overrides recorded with timestamp for audit
- Client and server-side validation
- ARIA labels and keyboard navigation support
