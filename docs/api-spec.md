# API Specification — Intelligent Triage of Customer Payment Disputes

## Document Information

| Field | Value |
|-------|-------|
| Version | 2.0 |
| Date | 22 June 2026 |
| Author | Group 26 — API Designer |
| Base URL | `http://localhost:3001/api` |
| Format | REST / JSON |
| Traces to | `docs/requirements.md` v4.0 |

---

## Related Documents

- [Requirements](./requirements.md) — EARS requirements specification (v4.0)
- [User Journeys](./user-journeys.md) — End-to-end user flows
- [Test Cases](./test-cases.md) — Verification test cases
- [UI Specification](./ui-spec.md) — Screen specifications

---

## Overview

This API serves the internal Dispute Triage prototype. All endpoints are
consumed by the React frontend client. No authentication is required for the
prototype (mock environment).

**Conventions:**
- All request/response bodies are JSON (`Content-Type: application/json`)
- Dates are ISO 8601 format (`YYYY-MM-DD` for dates, full ISO for timestamps)
- Amounts are numeric (not strings), in South African Rand (ZAR)
- Errors return structured JSON with field-level detail
- IDs use UUID format internally; case references use `DSP-YYYYMMDD-XXXX` format
- Results are paginated where applicable

---

## Enumerations

| Set | Values |
|-----|--------|
| **PaymentType** | `CARD`, `EFT`, `INTERNAL_TRANSFER` |
| **IssueCategory** | `DUPLICATE_DEBIT`, `FAILED_TRANSFER`, `MISSING_PAYMENT`, `UNAUTHORISED_TRANSACTION`, `INCORRECT_AMOUNT` |
| **TransactionStatus** | `SETTLED`, `PENDING`, `FAILED`, `REVERSED` |
| **RecommendedAction** | `RESOLVE_NOW`, `INVESTIGATE`, `ESCALATE`, `REFER` |
| **Priority** | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| **AgeBand** | `NEW`, `AGEING`, `BREACHED` |
| **DisputeStatus** | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| **RoutingQueue** | `CARD_DISPUTES`, `PAYMENTS_INVESTIGATIONS`, `INTERNAL_PAYMENTS_OPS`, `FRAUD_OPERATIONS` |

---

## Endpoints Summary

| Method | Path | Description | User Journey | Traces |
|--------|------|-------------|--------------|--------|
| POST | `/api/disputes` | Create a new dispute | Journey 1, 2 | REQ-001–009, REQ-030 |
| GET | `/api/disputes` | List/filter all disputes | Journey 3 | REQ-060–066 |
| GET | `/api/disputes/:id` | Get single dispute detail | Journey 4 | REQ-068–070 |
| PATCH | `/api/disputes/:id/status` | Update dispute status | Journey 6 | REQ-080–084 |
| POST | `/api/disputes/:id/override` | Override recommendation | Journey 5 | REQ-075–079 |
| GET | `/api/dashboard` | Get dashboard metrics | Journey 8 | REQ-090–096 |
| GET | `/api/enums` | Get reference data enumerations | Journey 1 | REQ-007 |
| GET | `/api/rules` | Get active triage rules | Journey 4 | REQ-050 |
| POST | `/api/seed` | Seed mock data (dev only) | N/A | REQ-100–104 |


---

## 1. Create Dispute

### `POST /api/disputes`

**User Journey:** Journey 1 (Capture a New Dispute) → triggers Journey 2 (Automatic Triage)

Creates a new dispute record, triggers triage evaluation, and returns the
complete dispute with recommendation.

**Traces:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-008, REQ-009, REQ-030

#### Request Body

```json
{
  "customerName": "Thabo Molefe",
  "accountNumber": "1234567890",
  "transactionRef": "TXN-20260615-001",
  "amount": 2500.00,
  "transactionDate": "2026-06-20",
  "paymentType": "EFT",
  "issueCategory": "DUPLICATE_DEBIT",
  "transactionStatus": "SETTLED",
  "description": "Customer reports duplicate charge on grocery purchase"
}
```

#### Field Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| customerName | string | Yes | Non-empty |
| accountNumber | string | Yes | Exactly 10 digits |
| transactionRef | string | Yes | Non-empty |
| amount | number | Yes | Greater than 0 |
| transactionDate | string (date) | Yes | ISO 8601 date, not in future |
| paymentType | string (enum) | Yes | `CARD`, `EFT`, `INTERNAL_TRANSFER` |
| issueCategory | string (enum) | Yes | `DUPLICATE_DEBIT`, `FAILED_TRANSFER`, `MISSING_PAYMENT`, `UNAUTHORISED_TRANSACTION`, `INCORRECT_AMOUNT` |
| transactionStatus | string (enum) | Yes | `SETTLED`, `PENDING`, `FAILED`, `REVERSED` |
| description | string | No | Max 500 characters |

#### Success Response — `201 Created`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "caseReference": "DSP-20260622-0001",
  "customerName": "Thabo Molefe",
  "accountNumber": "1234567890",
  "transactionRef": "TXN-20260615-001",
  "amount": 2500.00,
  "transactionDate": "2026-06-20",
  "paymentType": "EFT",
  "issueCategory": "DUPLICATE_DEBIT",
  "transactionStatus": "SETTLED",
  "description": "Customer reports duplicate charge on grocery purchase",
  "status": "OPEN",
  "createdAt": "2026-06-22T10:30:00.000Z",
  "age": 2,
  "ageBand": "AGEING",
  "dueDate": "2026-06-27",
  "queue": "PAYMENTS_INVESTIGATIONS",
  "fraudFlag": false,
  "triage": {
    "recommendedAction": "RESOLVE_NOW",
    "priority": "MEDIUM",
    "ruleId": "REQ-038",
    "targetQueue": "PAYMENTS_INVESTIGATIONS",
    "explanation": "This is a low-value duplicate debit on a settled transaction. Recommended to reverse immediately.",
    "factors": {
      "issueCategory": "DUPLICATE_DEBIT",
      "transactionStatus": "SETTLED",
      "amount": 2500.00,
      "amountBand": "ABOVE_LOW_THRESHOLD",
      "ageBand": "AGEING",
      "priority": "MEDIUM",
      "queue": "PAYMENTS_INVESTIGATIONS"
    },
    "rulesEvaluated": ["REQ-031", "REQ-032", "REQ-033", "REQ-038"],
    "isOverridden": false
  }
}
```

#### Error Response — `400 Bad Request`

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "accountNumber", "message": "Account number must be 10 digits" },
    { "field": "amount", "message": "Amount must be a positive value" }
  ]
}
```

#### Error Response — `422 Unprocessable Entity`

Returned when an enum value is not recognised:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "paymentType", "message": "Invalid payment type: CRYPTO" }
  ]
}
```

#### Error Scenarios

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| Missing customerName | 400 | "Customer name is required" |
| Missing accountNumber | 400 | "Account number is required" |
| Invalid accountNumber length | 400 | "Account number must be 10 digits" |
| Missing transactionRef | 400 | "Transaction reference is required" |
| Amount ≤ 0 or non-numeric | 400 | "Amount must be a positive value" |
| Future transactionDate | 400 | "Transaction date cannot be in the future" |
| Missing paymentType | 400 | "Payment type is required" |
| Invalid paymentType | 422 | "Invalid payment type: {value}" |
| Missing issueCategory | 400 | "Issue category is required" |
| Invalid issueCategory | 422 | "Invalid issue category: {value}" |
| Invalid transactionStatus | 422 | "Invalid transaction status: {value}" |
| Description > 500 chars | 400 | "Description must not exceed 500 characters" |


---

## 2. List Disputes

### `GET /api/disputes`

**User Journey:** Journey 3 (Review and Work the Dispute Queue)

Returns all disputes with optional filtering and pagination. Results are sorted
by priority (`CRITICAL` first) then by age (oldest first).

**Traces:** REQ-060, REQ-061, REQ-062, REQ-063, REQ-064, REQ-065, REQ-066

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| priority | string | No | — | Filter: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| paymentType | string | No | — | Filter: `CARD`, `EFT`, `INTERNAL_TRANSFER` |
| issueCategory | string | No | — | Filter by issue category enum value |
| action | string | No | — | Filter: `RESOLVE_NOW`, `INVESTIGATE`, `ESCALATE`, `REFER` |
| status | string | No | — | Filter: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| page | number | No | 1 | Page number |
| limit | number | No | 20 | Results per page (max 100) |

#### Example Request

```
GET /api/disputes?priority=HIGH&paymentType=CARD&page=1&limit=10
```

#### Success Response — `200 OK`

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "caseReference": "DSP-20260620-0002",
      "customerName": "Naledi Khumalo",
      "paymentType": "CARD",
      "issueCategory": "UNAUTHORISED_TRANSACTION",
      "amount": 8500.00,
      "priority": "CRITICAL",
      "recommendedAction": "ESCALATE",
      "queue": "FRAUD_OPERATIONS",
      "status": "OPEN",
      "fraudFlag": true,
      "age": 4,
      "ageBand": "AGEING",
      "dueDate": "2026-06-25",
      "createdAt": "2026-06-20T09:15:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Error Responses

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| Invalid filter value | 400 | "Invalid filter value for {parameter}: {value}" |

---

## 3. Get Dispute Detail

### `GET /api/disputes/:id`

**User Journey:** Journey 4 (Review Dispute Detail and Recommendation)

Returns full dispute detail including the complete recommendation, explanation,
triggered rules, and status history.

**Traces:** REQ-068, REQ-069, REQ-070, REQ-050, REQ-051, REQ-052, REQ-053

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Dispute unique identifier |

#### Success Response — `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "caseReference": "DSP-20260620-0002",
  "customerName": "Naledi Khumalo",
  "accountNumber": "9876543210",
  "transactionRef": "TXN-20260618-044",
  "amount": 8500.00,
  "transactionDate": "2026-06-18",
  "paymentType": "CARD",
  "issueCategory": "UNAUTHORISED_TRANSACTION",
  "transactionStatus": "SETTLED",
  "description": "Customer did not authorise this card transaction at POS terminal",
  "status": "OPEN",
  "createdAt": "2026-06-20T09:15:00.000Z",
  "updatedAt": "2026-06-20T09:15:00.000Z",
  "age": 4,
  "ageBand": "AGEING",
  "dueDate": "2026-06-25",
  "queue": "FRAUD_OPERATIONS",
  "fraudFlag": true,
  "escalationThresholds": {
    "slaBreached": false,
    "escalationBreached": false
  },
  "triage": {
    "recommendedAction": "ESCALATE",
    "priority": "CRITICAL",
    "ruleId": "REQ-033",
    "targetQueue": "FRAUD_OPERATIONS",
    "explanation": "This dispute involves an unauthorised transaction exceeding R5,000 on a card payment. Escalated to Fraud Operations for immediate investigation.",
    "factors": {
      "issueCategory": "UNAUTHORISED_TRANSACTION",
      "transactionStatus": "SETTLED",
      "amount": 8500.00,
      "amountBand": "ABOVE_MEDIUM_THRESHOLD",
      "ageBand": "AGEING",
      "priority": "CRITICAL",
      "queue": "FRAUD_OPERATIONS"
    },
    "rulesEvaluated": ["REQ-031", "REQ-032", "REQ-033"],
    "isOverridden": false
  },
  "override": null,
  "statusHistory": [
    {
      "from": null,
      "to": "OPEN",
      "timestamp": "2026-06-20T09:15:00.000Z",
      "operatorId": "system",
      "note": null
    }
  ]
}
```

#### Error Responses

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| ID not found | 404 | "Dispute not found" |


---

## 4. Update Dispute Status

### `PATCH /api/disputes/:id/status`

**User Journey:** Journey 6 (Progress Dispute Through Statuses)

Transitions a dispute to a new status. Enforces the lifecycle:
OPEN → IN_PROGRESS → RESOLVED → CLOSED.

**Traces:** REQ-080, REQ-081, REQ-082, REQ-083, REQ-084

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Dispute unique identifier |

#### Request Body

```json
{
  "status": "RESOLVED",
  "note": "Duplicate debit confirmed. Reversal processed under ref REV-20260622-001.",
  "operatorId": "ops-user-001"
}
```

#### Field Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| status | string (enum) | Yes | `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| note | string | Conditional | Required when status = `RESOLVED`. Min 10 chars |
| operatorId | string | Yes | Identifies the acting operator |

#### Success Response — `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "RESOLVED",
  "previousStatus": "IN_PROGRESS",
  "updatedAt": "2026-06-22T14:45:00.000Z",
  "note": "Duplicate debit confirmed. Reversal processed under ref REV-20260622-001.",
  "operatorId": "ops-user-001"
}
```

#### Error Scenarios

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| Dispute not found | 404 | "Dispute not found" |
| Invalid status value | 400 | "Invalid status: {value}" |
| Missing note for RESOLVED | 400 | "Resolution note is required (minimum 10 characters)" |
| Note < 10 chars | 400 | "Resolution note must be at least 10 characters" |
| Invalid transition (e.g. OPEN→RESOLVED) | 400 | "Invalid status transition from {current} to {target}" |
| Close from non-RESOLVED | 400 | "Dispute must be resolved before closing" |
| Modify CLOSED dispute | 409 | "Closed disputes cannot be modified" |

**Valid transitions:** OPEN → IN_PROGRESS → RESOLVED → CLOSED only. Cannot skip statuses.

---

## 5. Override Recommendation

### `POST /api/disputes/:id/override`

**User Journey:** Journey 5 (Override a Recommendation)

Allows an operator to override the system-recommended action and/or priority.
Preserves the original recommendation for audit.

**Traces:** REQ-075, REQ-076, REQ-077, REQ-078, REQ-079, REQ-084

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Dispute unique identifier |

#### Request Body

```json
{
  "action": "ESCALATE",
  "priority": "HIGH",
  "reason": "Customer is a VIP private banking client requiring senior attention",
  "operatorId": "ops-user-001"
}
```

#### Field Validation

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| action | string (enum) | No | `RESOLVE_NOW`, `INVESTIGATE`, `ESCALATE`, `REFER` |
| priority | string (enum) | No | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| reason | string | Yes | Min 10, max 300 characters |
| operatorId | string | Yes | Identifies the acting operator |

*At least one of `action` or `priority` must be provided.*

#### Success Response — `200 OK`

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "originalAction": "INVESTIGATE",
  "originalPriority": "MEDIUM",
  "newAction": "ESCALATE",
  "newPriority": "HIGH",
  "reason": "Customer is a VIP private banking client requiring senior attention",
  "overriddenAt": "2026-06-22T15:00:00.000Z",
  "overriddenBy": "ops-user-001"
}
```

#### Error Scenarios

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| Dispute not found | 404 | "Dispute not found" |
| Missing reason | 400 | "Override reason is required" |
| Reason < 10 characters | 400 | "Override reason must be at least 10 characters" |
| Reason > 300 characters | 400 | "Override reason must not exceed 300 characters" |
| Neither action nor priority provided | 400 | "At least one of action or priority must be provided" |
| Invalid action value | 422 | "Invalid action: {value}" |
| Invalid priority value | 422 | "Invalid priority: {value}" |
| Dispute is CLOSED | 409 | "Closed disputes cannot be modified" |


---

## 6. Dashboard Metrics

### `GET /api/dashboard`

**User Journey:** Journey 8 (Monitor the Dashboard)

Returns aggregated operational metrics for the dashboard view.

**Traces:** REQ-090, REQ-091, REQ-092

#### Success Response — `200 OK`

```json
{
  "totalOpen": 18,
  "byPriority": { "CRITICAL": 3, "HIGH": 5, "MEDIUM": 7, "LOW": 3 },
  "byAction": { "RESOLVE_NOW": 2, "INVESTIGATE": 8, "ESCALATE": 5, "REFER": 3 },
  "byQueue": {
    "CARD_DISPUTES": 6,
    "PAYMENTS_INVESTIGATIONS": 5,
    "INTERNAL_PAYMENTS_OPS": 4,
    "FRAUD_OPERATIONS": 3
  },
  "byPaymentType": { "CARD": 7, "EFT": 6, "INTERNAL_TRANSFER": 5 },
  "averageAge": 4.7,
  "earlyWarnings": {
    "approachingSla": 4,
    "approachingEscalation": 2
  },
  "overrideRate": 15.0,
  "overrideCount": 3,
  "totalDisputes": 20
}
```

#### Response Field Descriptions

| Field | Description |
|-------|-------------|
| totalOpen | Count of disputes with status OPEN or IN_PROGRESS |
| byPriority | Count per priority level |
| byAction | Count per recommended action |
| byQueue | Count per routing queue |
| byPaymentType | Count per payment type |
| averageAge | Mean age in days of open disputes |
| earlyWarnings.approachingSla | Disputes aged 5–7 days (approaching SLA_DAYS) |
| earlyWarnings.approachingEscalation | Disputes aged 12–14 days (approaching ESCALATION_DAYS) |
| overrideRate | Percentage of disputes that have been overridden |
| overrideCount | Absolute count of overridden disputes |
| totalDisputes | Total disputes in system (all statuses) |

---

## 7. Reference Data (Enumerations)

### `GET /api/enums`

**User Journey:** Journey 1 (populates form dropdowns on CaptureDispute screen)

Returns all valid enumeration values for form dropdowns and client-side validation.

**Traces:** REQ-007

#### Success Response — `200 OK`

```json
{
  "paymentTypes": [
    { "value": "CARD", "label": "Card Payment" },
    { "value": "EFT", "label": "EFT (Electronic Funds Transfer)" },
    { "value": "INTERNAL_TRANSFER", "label": "Internal Transfer" }
  ],
  "issueCategories": [
    { "value": "DUPLICATE_DEBIT", "label": "Duplicate Debit" },
    { "value": "FAILED_TRANSFER", "label": "Failed Transfer" },
    { "value": "MISSING_PAYMENT", "label": "Missing Payment" },
    { "value": "UNAUTHORISED_TRANSACTION", "label": "Unauthorised Transaction" },
    { "value": "INCORRECT_AMOUNT", "label": "Incorrect Amount" }
  ],
  "transactionStatuses": [
    { "value": "SETTLED", "label": "Settled" },
    { "value": "PENDING", "label": "Pending" },
    { "value": "FAILED", "label": "Failed" },
    { "value": "REVERSED", "label": "Reversed" }
  ],
  "priorities": [
    { "value": "CRITICAL", "label": "Critical" },
    { "value": "HIGH", "label": "High" },
    { "value": "MEDIUM", "label": "Medium" },
    { "value": "LOW", "label": "Low" }
  ],
  "actions": [
    { "value": "RESOLVE_NOW", "label": "Resolve Immediately" },
    { "value": "INVESTIGATE", "label": "Investigate Further" },
    { "value": "ESCALATE", "label": "Escalate" },
    { "value": "REFER", "label": "Refer to Another Team" }
  ],
  "statuses": [
    { "value": "OPEN", "label": "Open" },
    { "value": "IN_PROGRESS", "label": "In Progress" },
    { "value": "RESOLVED", "label": "Resolved" },
    { "value": "CLOSED", "label": "Closed" }
  ]
}
```

---

## 8. Triage Rules Reference

### `GET /api/rules`

**User Journey:** Journey 4 (operations user reviews triggered rules in detail view)

Returns all active triage rules for the rules reference panel.

**Traces:** REQ-050, REQ-030

#### Success Response — `200 OK`

```json
{
  "rules": [
    {
      "ruleId": "REQ-031",
      "name": "14-day forced escalation",
      "description": "Disputes open longer than 14 days have their action forced to ESCALATE.",
      "conditions": ["age > 14"],
      "priority": null,
      "action": "ESCALATE",
      "flag": null
    },
    {
      "ruleId": "REQ-032",
      "name": "High-value transaction",
      "description": "Any dispute involving a transaction at or above R50,000 is automatically critical.",
      "conditions": ["amount >= 50000"],
      "priority": "CRITICAL",
      "action": "ESCALATE",
      "flag": null
    },
    {
      "ruleId": "REQ-033",
      "name": "Unauthorised transaction high value",
      "description": "Unauthorised transactions above R5,000 are escalated to Fraud Operations.",
      "conditions": ["issueCategory = UNAUTHORISED_TRANSACTION", "amount > 5000"],
      "priority": "CRITICAL",
      "action": "ESCALATE",
      "flag": null
    },
    {
      "ruleId": "REQ-035",
      "name": "Card fraud flag",
      "description": "Card payments disputed as unauthorised are flagged for potential fraud referral.",
      "conditions": ["paymentType = CARD", "issueCategory = UNAUTHORISED_TRANSACTION"],
      "priority": null,
      "action": null,
      "flag": "FRAUD_REFERRAL"
    },
    {
      "ruleId": "REQ-018",
      "name": "7-day priority bump",
      "description": "Disputes open longer than 7 days have their priority bumped by one level.",
      "conditions": ["age > 7"],
      "priority": "BUMP_BY_ONE_LEVEL",
      "action": null,
      "flag": null
    }
  ]
}
```

---

## 9. Seed Mock Data

### `POST /api/seed`

**User Journey:** N/A (development/demo use only)

Populates the database with 25+ mock dispute records. Only available in development mode.

**Traces:** REQ-100, REQ-101, REQ-102, REQ-103, REQ-104

#### Success Response — `200 OK`

```json
{
  "seeded": 25,
  "message": "Database seeded with 25 mock disputes across all payment types, categories, and statuses.",
  "coverage": {
    "paymentTypes": ["CARD", "EFT", "INTERNAL_TRANSFER"],
    "issueCategories": ["DUPLICATE_DEBIT", "FAILED_TRANSFER", "MISSING_PAYMENT", "UNAUTHORISED_TRANSACTION", "INCORRECT_AMOUNT"],
    "priorities": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
    "ageBands": ["NEW", "AGEING", "BREACHED"]
  }
}
```

#### Error Responses

| Condition | HTTP Status | Error Message |
|-----------|-------------|---------------|
| Database already seeded | 409 | "Database already contains data. Clear first or skip." |
| Production environment | 403 | "Seed endpoint is only available in development mode" |


---

## Error Response Format

### Single Error
```json
{ "error": "Human-readable error message" }
```

### Validation Errors (Multiple Fields)
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "accountNumber", "message": "Account number must be 10 digits" },
    { "field": "amount", "message": "Amount must be a positive value" }
  ]
}
```

### Transition / Conflict Error
```json
{
  "error": "Invalid status transition from OPEN to RESOLVED",
  "details": {
    "currentStatus": "OPEN",
    "requestedStatus": "RESOLVED",
    "allowedTransitions": ["IN_PROGRESS"]
  }
}
```

### Standard HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH, POST (seed, override) |
| 201 | Created | Successful POST (dispute creation) |
| 400 | Bad Request | Validation failure, invalid transitions |
| 403 | Forbidden | Dev-only endpoint in production |
| 404 | Not Found | Dispute ID does not exist |
| 409 | Conflict | Closed dispute modification, already seeded |
| 422 | Unprocessable Entity | Unrecognised enum value |
| 500 | Internal Server Error | Unexpected server error |

---

## Data Types Reference

### Dispute Object (Full)

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Internal unique identifier |
| caseReference | string | Formatted reference `DSP-YYYYMMDD-XXXX` |
| customerName | string | Customer full name |
| accountNumber | string | 10-digit account number |
| transactionRef | string | Original transaction reference |
| amount | number | Transaction amount in ZAR |
| transactionDate | string | ISO date `YYYY-MM-DD` |
| paymentType | enum | `CARD`, `EFT`, `INTERNAL_TRANSFER` |
| issueCategory | enum | Issue category value |
| transactionStatus | enum | `SETTLED`, `PENDING`, `FAILED`, `REVERSED` |
| description | string\|null | Optional free-text (max 500) |
| status | enum | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |
| age | number | Days since transaction date |
| ageBand | enum | `NEW`, `AGEING`, `BREACHED` |
| dueDate | string | ISO date (transactionDate + SLA_DAYS) |
| queue | enum | Assigned routing queue |
| fraudFlag | boolean | True if CARD + UNAUTHORISED_TRANSACTION |
| escalationThresholds | object | `{ slaBreached: boolean, escalationBreached: boolean }` |
| triage | object | See Triage Object below |
| override | object\|null | Override details if applied |
| statusHistory | array | Array of status transitions |

### Triage Object

| Field | Type | Description |
|-------|------|-------------|
| recommendedAction | enum | `RESOLVE_NOW`, `INVESTIGATE`, `ESCALATE`, `REFER` |
| priority | enum | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| ruleId | string | Matched rule identifier (e.g. `REQ-038`) |
| targetQueue | string | Queue the action targets |
| explanation | string | Plain-language business explanation |
| factors | object | All decision factors (issueCategory, transactionStatus, amount, amountBand, ageBand, priority, queue) |
| rulesEvaluated | array | List of rule IDs evaluated before match |
| isOverridden | boolean | Whether an override has been applied |

### Override Object

| Field | Type | Description |
|-------|------|-------------|
| action | enum | Overridden action |
| priority | enum | Overridden priority |
| reason | string | Operator's reason (10–300 chars) |
| operatorId | string | Who performed the override |
| overriddenAt | string | ISO 8601 timestamp |
| originalAction | enum | System's original recommendation |
| originalPriority | enum | System's original priority |

### Status History Entry

| Field | Type | Description |
|-------|------|-------------|
| from | string\|null | Previous status (null on creation) |
| to | string | New status |
| timestamp | string | ISO 8601 timestamp |
| operatorId | string | Who made the change |
| note | string\|null | Present only on RESOLVED transition |

---

## Configuration Constants

| Constant | Value | Triage Rules |
|----------|-------|--------------|
| HIGH_VALUE_THRESHOLD | 50,000 | REQ-032 |
| MEDIUM_VALUE_THRESHOLD | 5,000 | REQ-033, REQ-034 |
| LOW_VALUE_THRESHOLD | 1,000 | REQ-038 |
| INCORRECT_AMOUNT_THRESHOLD | 10,000 | REQ-042, REQ-043 |
| AGE_AGEING_DAYS | 2 | Age band calculation |
| SLA_DAYS | 7 | Priority bump, due date |
| ESCALATION_DAYS | 14 | Forced escalation |
| FAILED_TRANSFER_HOURS | 48 | REQ-040, REQ-041 |
