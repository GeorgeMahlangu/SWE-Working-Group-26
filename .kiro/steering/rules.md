# Triage Rules — Payment Dispute Triage

**Traces to:** `docs/requirements.md` v4.0

This document defines the deterministic triage rules evaluated immediately when
a dispute is created. The engine returns a recommended action, priority, routing
queue, and plain-language explanation within 2 seconds (REQ-120).

---

## Business Parameters

| Constant | Value | Used In |
|----------|-------|---------|
| `HIGH_VALUE_THRESHOLD` | R50,000 | REQ-032 |
| `MEDIUM_VALUE_THRESHOLD` | R5,000 | REQ-033, REQ-034 |
| `LOW_VALUE_THRESHOLD` | R1,000 | REQ-038 |
| `INCORRECT_AMOUNT_THRESHOLD` | R10,000 | REQ-042, REQ-043 |
| `AGE_AGEING_DAYS` | 2 days | REQ-012 |
| `SLA_DAYS` | 7 days | REQ-013, REQ-018, REQ-020 |
| `ESCALATION_DAYS` | 14 days | REQ-019, REQ-031 |
| `FAILED_TRANSFER_HOURS` | 48 hours | REQ-040, REQ-041 |

Never hard-code these values — always reference the constants.

---

## Enumerations

```
PaymentType:         CARD | EFT | INTERNAL_TRANSFER
IssueCategory:       DUPLICATE_DEBIT | FAILED_TRANSFER | MISSING_PAYMENT | UNAUTHORISED_TRANSACTION | INCORRECT_AMOUNT
TransactionStatus:   SETTLED | PENDING | FAILED | REVERSED
RecommendedAction:   RESOLVE_NOW | INVESTIGATE | ESCALATE | REFER
Priority:            CRITICAL | HIGH | MEDIUM | LOW
AgeBand:             NEW | AGEING | BREACHED
RoutingQueue:        CARD_DISPUTES | PAYMENTS_INVESTIGATIONS | INTERNAL_PAYMENTS_OPS | FRAUD_OPERATIONS
```

---

## Age Band Calculation (REQ-010 to REQ-013)

Age = current date − transaction date (calendar days)

| Age | Band |
|-----|------|
| < `AGE_AGEING_DAYS` (2) | `NEW` |
| ≥ `AGE_AGEING_DAYS` and < `SLA_DAYS` (7) | `AGEING` |
| ≥ `SLA_DAYS` (7) | `BREACHED` |

---

## Queue Assignment (REQ-025 to REQ-028)

Evaluated before triage rules. `UNAUTHORISED_TRANSACTION` always overrides the payment-type default.

| Condition | Queue |
|-----------|-------|
| issueCategory = `UNAUTHORISED_TRANSACTION` | `FRAUD_OPERATIONS` (overrides all below) |
| paymentType = `CARD` | `CARD_DISPUTES` |
| paymentType = `EFT` | `PAYMENTS_INVESTIGATIONS` |
| paymentType = `INTERNAL_TRANSFER` | `INTERNAL_PAYMENTS_OPS` |

---

## Rule Precedence Order (REQ-030)

Rules are evaluated top-to-bottom. **The first matching rule wins.**
Where multiple rules could apply, the engine uses the highest priority and most urgent action:
`ESCALATE > REFER > INVESTIGATE > RESOLVE_NOW`

| # | Rule | REQ |
|---|------|-----|
| 1 | Forced escalation by age | REQ-031 |
| 2 | High-value transaction | REQ-032 |
| 3 | Unauthorised transaction (high value) | REQ-033 |
| 4 | Unauthorised transaction (low value) | REQ-034 |
| 5 | SLA breach | REQ-036 |
| 6 | Pending settlement | REQ-037 |
| 7 | Duplicate debit (settled, low value) | REQ-038 |
| 8 | Duplicate debit (pending) | REQ-039 |
| 9 | Failed transfer (old) | REQ-040 |
| 10 | Failed transfer (recent) | REQ-041 |
| 11 | Incorrect amount (high) | REQ-042 |
| 12 | Incorrect amount (low) | REQ-043 |
| 13 | Missing payment — Card | REQ-044 |
| 14 | Missing payment — EFT | REQ-045 |
| 15 | Missing payment — Internal Transfer | REQ-046 |
| 16 | Card dispute routing (catch-all) | REQ-047 |
| 17 | Default | REQ-048 |

---

## Triage Rules

### REQ-031 — Forced Escalation by Age

**Condition:** dispute age > `ESCALATION_DAYS` (14)

| Priority | Action | Queue |
|----------|--------|-------|
| Bumped per REQ-018 | `ESCALATE` | Assigned queue |

**Explanation template:** "Dispute has been open for {age} days, exceeding the 14-day escalation threshold. Action forced to Escalate."

---

### REQ-032 — High-Value Transaction

**Condition:** amount ≥ `HIGH_VALUE_THRESHOLD` (R50,000)

| Priority | Action | Queue |
|----------|--------|-------|
| `CRITICAL` | `ESCALATE` | Assigned queue |

**Explanation template:** "Transaction amount of R{amount} meets or exceeds the R50,000 high-value threshold. Critical priority assigned with Escalate action regardless of issue category."

---

### REQ-033 — Unauthorised Transaction (High Value)

**Condition:** issueCategory = `UNAUTHORISED_TRANSACTION` AND amount > `MEDIUM_VALUE_THRESHOLD` (R5,000)

| Priority | Action | Queue |
|----------|--------|-------|
| `CRITICAL` | `ESCALATE` | `FRAUD_OPERATIONS` |

**Explanation template:** "Unauthorised transaction of R{amount} exceeds the R5,000 threshold. Critical priority assigned. Escalated to Fraud Operations."

---

### REQ-034 — Unauthorised Transaction (Low Value)

**Condition:** issueCategory = `UNAUTHORISED_TRANSACTION` AND amount ≤ `MEDIUM_VALUE_THRESHOLD` (R5,000)

| Priority | Action | Queue |
|----------|--------|-------|
| `HIGH` | `INVESTIGATE` | `FRAUD_OPERATIONS` |

**Explanation template:** "Unauthorised transaction of R{amount} is at or below the R5,000 threshold. High priority assigned. Routed to Fraud Operations for investigation."

---

### REQ-035 — Card Fraud Flag

**Condition:** paymentType = `CARD` AND issueCategory = `UNAUTHORISED_TRANSACTION`

**Effect:** Sets `fraudFlag = true` on the dispute record. Displayed as a fraud indicator icon in the queue (REQ-070).

This flag is applied in addition to the action/priority from REQ-033 or REQ-034 — it does not override them.

**Explanation template:** "Card payment disputed as unauthorised. Flagged for potential fraud referral."

---

### REQ-036 — SLA Breach Escalation

**Condition:** ageBand = `BREACHED` (age ≥ `SLA_DAYS`) AND no higher-precedence rule matched

| Priority | Action | Queue |
|----------|--------|-------|
| `HIGH` | `ESCALATE` | Assigned queue |

**Explanation template:** "Dispute has been open for {age} days, breaching the 7-day SLA threshold. Escalated to ensure timely resolution."

---

### REQ-037 — Pending Settlement

**Condition:** transactionStatus = `PENDING` AND no higher-precedence rule matched

| Priority | Action | Queue |
|----------|--------|-------|
| Per amount/age | `INVESTIGATE` | Assigned queue |

**Explanation template:** "Transaction has not yet settled (status: PENDING). Recommended to investigate once settlement is confirmed."

---

### REQ-038 — Duplicate Debit (Settled, Low Value)

**Condition:** issueCategory = `DUPLICATE_DEBIT` AND transactionStatus = `SETTLED` AND amount < `LOW_VALUE_THRESHOLD` (R1,000) AND no higher-precedence rule matched

| Priority | Action | Queue |
|----------|--------|-------|
| `MEDIUM` | `RESOLVE_NOW` | Assigned queue |

**Explanation template:** "Low-value duplicate debit on a settled transaction. Amount of R{amount} is below the R1,000 threshold. Recommended to reverse immediately."

---

### REQ-039 — Duplicate Debit (Pending)

**Condition:** issueCategory = `DUPLICATE_DEBIT` AND transactionStatus = `PENDING`

| Priority | Action | Queue |
|----------|--------|-------|
| `LOW` | `INVESTIGATE` | Assigned queue |

**Explanation template:** "Duplicate debit dispute with transaction still pending. Recommended to investigate once transaction status is confirmed."

---

### REQ-040 — Failed Transfer (Older than 48 hours)

**Condition:** issueCategory = `FAILED_TRANSFER` AND transactionStatus = `FAILED` AND age > `FAILED_TRANSFER_HOURS` (48h)

| Priority | Action | Queue |
|----------|--------|-------|
| `HIGH` | `ESCALATE` | Assigned queue |

**Explanation template:** "Failed transfer is {age} days old, exceeding the 48-hour threshold. High priority assigned. Escalated for resolution."

---

### REQ-041 — Failed Transfer (Within 48 hours)

**Condition:** issueCategory = `FAILED_TRANSFER` AND transactionStatus = `FAILED` AND age ≤ `FAILED_TRANSFER_HOURS` (48h)

| Priority | Action | Queue |
|----------|--------|-------|
| `MEDIUM` | `INVESTIGATE` | Assigned queue |

**Explanation template:** "Failed transfer is within the 48-hour window. Medium priority assigned. Recommended to investigate and retry."

---

### REQ-042 — Incorrect Amount (High)

**Condition:** issueCategory = `INCORRECT_AMOUNT` AND amount > `INCORRECT_AMOUNT_THRESHOLD` (R10,000)

| Priority | Action | Queue |
|----------|--------|-------|
| `HIGH` | `ESCALATE` | Assigned queue |

**Explanation template:** "Incorrect amount dispute of R{amount} exceeds the R10,000 threshold. High priority assigned. Escalated for resolution."

---

### REQ-043 — Incorrect Amount (Low)

**Condition:** issueCategory = `INCORRECT_AMOUNT` AND amount ≤ `INCORRECT_AMOUNT_THRESHOLD` (R10,000)

| Priority | Action | Queue |
|----------|--------|-------|
| `MEDIUM` | `INVESTIGATE` | Assigned queue |

**Explanation template:** "Incorrect amount dispute of R{amount} is at or below the R10,000 threshold. Medium priority assigned. Recommended to investigate."

---

### REQ-044 — Missing Payment (Card)

**Condition:** issueCategory = `MISSING_PAYMENT` AND paymentType = `CARD`

| Priority | Action | Queue |
|----------|--------|-------|
| `HIGH` | `REFER` | `CARD_DISPUTES` |

**Explanation template:** "Missing payment on a Card transaction. High priority assigned. Referred to the Card Disputes team."

---

### REQ-045 — Missing Payment (EFT)

**Condition:** issueCategory = `MISSING_PAYMENT` AND paymentType = `EFT`

| Priority | Action | Queue |
|----------|--------|-------|
| `MEDIUM` | `INVESTIGATE` | `PAYMENTS_INVESTIGATIONS` |

**Explanation template:** "Missing payment on an EFT transaction. Medium priority assigned. Recommended to investigate with the payments team."

---

### REQ-046 — Missing Payment (Internal Transfer)

**Condition:** issueCategory = `MISSING_PAYMENT` AND paymentType = `INTERNAL_TRANSFER`

| Priority | Action | Queue |
|----------|--------|-------|
| `LOW` | `INVESTIGATE` | `INTERNAL_PAYMENTS_OPS` |

**Explanation template:** "Missing payment on an Internal Transfer. Low priority assigned. Recommended to investigate with Internal Payments Operations."

---

### REQ-047 — Card Dispute Routing (Catch-all)

**Condition:** paymentType = `CARD` AND issueCategory ≠ `UNAUTHORISED_TRANSACTION` AND issueCategory ≠ `MISSING_PAYMENT` AND no higher-precedence rule matched

| Priority | Action | Queue |
|----------|--------|-------|
| Per amount/age | `REFER` | `CARD_DISPUTES` |

**Explanation template:** "Card payment dispute. Referred to the Card Disputes team for specialist handling."

---

### REQ-048 — Default

**Condition:** No other rule matched

| Priority | Action | Queue |
|----------|--------|-------|
| Per amount/age | `INVESTIGATE` | Assigned queue |

**Explanation template:** "No specific triage rule matched. Recommended to investigate the dispute."

---

## Age-Based Modifiers

These are applied after the primary rule match.

### REQ-018 — Priority Bump (7-day SLA)

**Condition:** dispute age > `SLA_DAYS` (7)

**Effect:** Bump priority one level:

| From | To |
|------|----|
| `LOW` | `MEDIUM` |
| `MEDIUM` | `HIGH` |
| `HIGH` | `CRITICAL` |
| `CRITICAL` | `CRITICAL` (no change) |

### REQ-019 — Forced Escalate (14-day)

**Condition:** dispute age > `ESCALATION_DAYS` (14)

**Effect:** Override `recommendedAction` to `ESCALATE` regardless of the matched rule's action. (This is also evaluated as Rule 1 in the precedence chain via REQ-031.)

---

## Explainability Requirements (REQ-050 to REQ-055)

Every triage result MUST return:

| Field | Content |
|-------|---------|
| `ruleId` | The REQ identifier of the matched rule (e.g. `"REQ-038"`) |
| `explanation` | Plain-language sentence using business terms, not code |
| `factors` | issueCategory, transactionStatus, amount, amountBand, ageBand, priority, queue |
| `targetQueue` | The routing queue (for `ESCALATE` and `REFER` actions) |
| `rulesEvaluated` | Ordered list of rule IDs checked before the match |

Explanations must NOT contain technical jargon, variable names, or REQ identifiers in the user-facing text.
