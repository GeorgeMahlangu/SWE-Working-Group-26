# Project Structure — Payment Dispute Triage

#[[file:../../docs/requirements.md]]
#[[file:../../docs/user-journeys.md]]
#[[file:../../docs/api-spec.md]]
#[[file:../../docs/ui-spec.md]]

```
payment-dispute-triage/
├── server/
│   ├── src/
│   │   ├── index.ts                    # Server entry point
│   │   ├── routes/
│   │   │   ├── index.ts                # Route aggregator
│   │   │   ├── health.ts               # Health check endpoints
│   │   │   └── disputes.ts             # Dispute API endpoints
│   │   ├── services/
│   │   │   ├── triageEngine.ts         # Rules engine logic
│   │   │   └── disputeService.ts       # Dispute CRUD operations
│   │   ├── rules/
│   │   │   └── triageRules.ts          # Business rule definitions
│   │   ├── types/
│   │   │   └── dispute.ts              # TypeScript interfaces
│   │   └── middleware/
│   │       └── errorHandler.ts         # Error handling middleware
│   ├── prisma/
│   │   ├── schema.prisma               # Database schema (SQLite)
│   │   └── seed.ts                     # Mock data seeding (25+ disputes)
│   ├── tests/
│   │   ├── triageEngine.test.ts        # Rules engine tests
│   │   └── disputes.test.ts            # API endpoint tests
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── main.tsx                    # App entry point
│   │   ├── App.tsx                     # Root component with routing
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # Journey 8: Monitor Dashboard
│   │   │   ├── DisputeQueue.tsx        # Journey 3: Work the Queue
│   │   │   ├── CaptureDispute.tsx      # Journey 1: Capture Dispute
│   │   │   └── DisputeDetail.tsx       # Journey 4, 5, 6: Detail, Override, Status
│   │   ├── components/
│   │   │   ├── TopBar.tsx              # 52px fixed header: wordmark, user, New Dispute button
│   │   │   ├── Sidebar.tsx             # 220px nav: All Cases, Pending, Escalated, Resolved, Reports
│   │   │   ├── DisputeRow.tsx          # 48px table row with 3px left-border in action color
│   │   │   ├── StatusTag.tsx           # [3px border][Action label] — no pill, no background
│   │   │   ├── ActionPanel.tsx         # Focal recommendation block (3px border + 8% tint)
│   │   │   ├── FraudIndicator.tsx      # Plain text fraud marker when fraudFlag=true (REQ-070)
│   │   │   ├── ExplanationPanel.tsx    # Rule text + ruleId + factors (REQ-050–052)
│   │   │   ├── FilterBar.tsx           # Button groups + Issue Category dropdown
│   │   │   ├── OverrideModal.tsx       # Journey 5: Override action/priority/reason
│   │   │   ├── StatusTransition.tsx    # Journey 6: Status controls + resolution note
│   │   │   └── LoadingBar.tsx          # 2px progress bar — no spinners, no skeletons
│   │   ├── hooks/
│   │   │   └── useDisputes.ts          # Data fetching hooks
│   │   ├── types/
│   │   │   └── dispute.ts              # Shared TypeScript interfaces
│   │   └── index.css                   # Tailwind styles
│   ├── tests/
│   │   └── components/                 # Component tests
│   ├── e2e/
│   │   └── disputeFlow.spec.ts         # E2E tests
│   └── package.json
│
├── docs/
│   ├── requirements.md                 # EARS requirements (93 total, v4.0)
│   ├── user-journeys.md                # User journeys (8 journeys)
│   ├── api-spec.md                     # API specification (9 endpoints, v2.0)
│   ├── ui-spec.md                      # UI screen specifications (4 screens, v1.0)
│   ├── architecture.md                 # System design (v1.0)
│   └── test-cases.md                   # Test case definitions (103 cases, 100% coverage)
│
└── .kiro/
    ├── steering/                       # Project context for Kiro
    ├── specs/                          # Kiro spec workflows
    └── hooks/                          # Automated quality triggers
```

## Key Conventions

- **API routes:** Dispute CRUD routes prefixed with `/api/disputes`; utility routes at `/api/dashboard`, `/api/enums`, `/api/rules`, `/api/seed`
- **Services:** Business logic separated from route handlers
- **Rules:** Triage rules defined declaratively in `rules/`
- **Types:** Shared interfaces in `types/` directories
- **Pages:** One file per screen in `pages/`
- **Components:** Reusable UI elements in `components/`
- **Database:** SQLite for zero-infrastructure local operation

## API Endpoints

| Method | Endpoint | User Journey | Description | Traces |
|--------|----------|--------------|-------------|--------|
| POST | `/api/disputes` | Journey 1, 2 | Create dispute — validates input, triggers triage, returns case reference + full recommendation | REQ-001–009, REQ-030 |
| GET | `/api/disputes` | Journey 3 | List disputes for queue with filtering (priority, paymentType, issueCategory, action, status) and pagination | REQ-060–066 |
| GET | `/api/disputes/:id` | Journey 4 | Full dispute detail — recommendation, explanation, triggered rules, status history, escalation thresholds | REQ-068–070, REQ-050–053 |
| PATCH | `/api/disputes/:id/status` | Journey 6 | Transition dispute status (OPEN→IN_PROGRESS→RESOLVED→CLOSED), requires resolution note for RESOLVED | REQ-080–084 |
| POST | `/api/disputes/:id/override` | Journey 5 | Override recommended action and/or priority, requires reason (10–300 chars), preserves original for audit | REQ-075–079 |
| GET | `/api/dashboard` | Journey 8 | Dashboard metrics — counts by priority/action/queue/payment type, average age, early warnings, override rate | REQ-090–096 |
| GET | `/api/enums` | Journey 1 | Reference data enumerations for form dropdowns (paymentTypes, issueCategories, statuses, etc.) | REQ-007 |
| GET | `/api/rules` | Journey 4 | Active triage rules list for rules reference panel | REQ-050, REQ-030 |
| POST | `/api/seed` | N/A | Seed 25+ mock disputes (dev only) | REQ-100–104 |

## Data Model

### Dispute
- `id` — unique identifier
- `caseReference` — format DSP-YYYYMMDD-XXXX (REQ-001)
- `customerName` — required (REQ-003)
- `accountNumber` — required, 10 digits (REQ-003)
- `transactionReference` — required (REQ-003)
- `transactionAmount` — required, > 0 (REQ-005)
- `transactionDate` — required, not in future (REQ-006)
- `paymentType` — CARD | EFT | INTERNAL_TRANSFER (enumeration)
- `issueCategory` — DUPLICATE_DEBIT | FAILED_TRANSFER | MISSING_PAYMENT | UNAUTHORISED_TRANSACTION | INCORRECT_AMOUNT (enumeration)
- `transactionStatus` — SETTLED | PENDING | FAILED | REVERSED (enumeration)
- `description` — optional, max 500 characters (REQ-008)
- `status` — OPEN | IN_PROGRESS | RESOLVED | CLOSED (REQ-080)
- `priority` — LOW | MEDIUM | HIGH | CRITICAL (REQ-014 to REQ-017)
- `ageBand` — NEW | AGEING | BREACHED (REQ-011 to REQ-013)
- `recommendedAction` — RESOLVE_NOW | INVESTIGATE | ESCALATE | REFER (REQ-030 to REQ-048)
- `routingQueue` — CARD_DISPUTES | PAYMENTS_INVESTIGATIONS | INTERNAL_PAYMENTS_OPS | FRAUD_OPERATIONS (REQ-025 to REQ-028)
- `ruleId` — identifier of the rule that determined the action (REQ-050)
- `explanation` — plain-language rule match description (REQ-052)
- `decisionFactors` — issue category, status, amount, age band, priority, queue (REQ-051)
- `fraudFlag` — boolean for CARD + UNAUTHORISED_TRANSACTION (REQ-035)
- `dueDate` — transactionDate + SLA_DAYS (REQ-020)
- `ageInDays` — calculated from transactionDate
- `originalRecommendation` — preserved for audit when overridden (REQ-078)
- `originalPriority` — preserved for audit when overridden (REQ-078)
- `overrideReason` — 10-300 characters when action overridden (REQ-077)
- `isOverridden` — boolean flag for visual indicator (REQ-079)
- `resolutionNote` — minimum 10 characters to move to RESOLVED (REQ-081)
- `createdAt` — ISO 8601 timestamp (REQ-002)
- `updatedAt` — timestamp

### Audit Trail (REQ-084)
- All status transitions recorded with timestamp and operator identifier
- Override history preserved with original recommendation, priority, new action, reason

## UI Screens

| Screen | File | User Journeys | Requirements |
|--------|------|---------------|--------------|
| Dashboard | `Dashboard.tsx` | Journey 8 | REQ-090–096 |
| DisputeQueue | `DisputeQueue.tsx` | Journey 3 | REQ-060–070 |
| CaptureDispute | `CaptureDispute.tsx` | Journey 1 | REQ-001–009 |
| DisputeDetail | `DisputeDetail.tsx` | Journey 4, 5, 6 | REQ-068–070, REQ-075–084 |

1. **Dashboard** — Counts by priority/action/queue/payment type, average age, override rate, early warnings (5–7 day, 12–14 day thresholds)
2. **DisputeQueue** — Sorted by priority then age, filterable by priority/paymentType/issueCategory/action/status, colour-coded priority badges, age band badges, fraud indicator icons, summary bar
3. **CaptureDispute** — Form with client+server validation, enum dropdowns from `/api/enums`, triage result shown on success
4. **DisputeDetail** — Full fields, recommendation panel with ruleId + explanation + factors, SLA breach indicators, override modal, status transition controls

## Formatting (REQ-123, REQ-124)
- Amounts: `R X,XXX.XX` (South African Rand) — use shared `formatAmount()` utility
- Dates: `DD MMM YYYY` — use shared `formatDate()` utility

## Accessibility (REQ-126)
- ARIA labels on all interactive elements
- Keyboard navigation support
- Error messages use `role="alert"`
