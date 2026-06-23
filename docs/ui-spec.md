# UI Screen Specifications — Intelligent Triage of Customer Payment Disputes

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.1 |
| Date | 22 June 2026 |
| Author | Group 26 — UI/UX Designer |
| Traces to | `docs/requirements.md` v4.0 |

---

## Related Documents

- [Requirements](./requirements.md) — EARS requirements (v4.0)
- [User Journeys](./user-journeys.md) — End-to-end user flows
- [API Specification](./api-spec.md) — Endpoint contracts

---

## Design Principles

- **Structured authority** — internal financial tool; dense but not cluttered, fast to scan
- **Recommendation is the hero** — the action + explanation must be impossible to miss
- **Left-border as signal** — every table row has a `3px solid` left border in its action color for quick scanning
- **Pill badges for action and priority labels** — colored pill badges with a light tinted background (`--color-status-*-bg`) and matching text color (`--color-status-*`). Max `border-radius: 4px`. No box shadows
- **Transparency** — every recommendation shows the rule that fired, the ruleId, and why
- **Accessibility** — ARIA labels on every interactive element (REQ-126)
- **Formatting** — amounts as `R X,XXX.XX`, dates as `DD MMM YYYY` (REQ-123, REQ-124)
- **Light theme** — white surfaces, light grey page background, Standard Bank navy (`#0033A0`) top bar

> Visual and interaction authority: **`.kiro/skills/ui-design.md`** — invoke with `#ui-design` before generating any UI component. That file wins all visual conflicts.

---

## Design Tokens

All colors reference CSS custom properties defined in `client/src/index.css`. No hardcoded Tailwind color classes (`bg-red-100`, `text-amber-800`, etc.).

```css
/* Base — Light theme */
--color-bg:             #F5F7FA   /* page background */
--color-surface:        #FFFFFF   /* cards, modals, panels */
--color-surface-raised: #F9FAFB   /* table headers, hover states */
--color-border:         #E5E7EB   /* card and table borders */
--color-border-subtle:  #F3F4F6   /* dividers, inner separators */
--color-text-primary:   #111827   /* headings, values */
--color-text-secondary: #6B7280   /* labels, secondary info */
--color-text-muted:     #9CA3AF   /* placeholder, counters, timestamps */

/* Action colors — badge text and left-border accents */
--color-status-immediate:   #DC2626   /* RESOLVE_NOW */
--color-status-investigate: #D97706   /* INVESTIGATE */
--color-status-escalate:    #2563EB   /* ESCALATE */
--color-status-refer:       #6B7280   /* REFER */
--color-status-closed:      #16A34A   /* RESOLVED / CLOSED */

/* Action badge backgrounds — 8% tint of action color */
--color-status-immediate-bg:   #FEF2F2
--color-status-investigate-bg: #FFFBEB
--color-status-escalate-bg:    #EFF6FF
--color-status-refer-bg:       #F9FAFB
--color-status-closed-bg:      #F0FDF4

/* Priority colors */
--color-priority-critical: #DC2626   /* CRITICAL */
--color-priority-high:     #EA580C   /* HIGH */
--color-priority-medium:   #D97706   /* MEDIUM */
--color-priority-low:      #6B7280   /* LOW */

/* Primary action */
--color-accent:       #0033A0
--color-accent-hover: #002580
--color-accent-bg:    #EFF6FF   /* accent tint for active states */

/* Top bar */
--color-topbar-bg:   #0033A0
--color-topbar-text: #FFFFFF
```

## Action → Display Label Mapping

The API returns UPPERCASE enum values. The UI renders these exact human labels with pill badge styling:

| API value | Display label | Text color | Badge background |
|-----------|--------------|------------|-----------------|
| `RESOLVE_NOW` | Resolve Immediately | `--color-status-immediate` (`#DC2626`) | `--color-status-immediate-bg` (`#FEF2F2`) |
| `INVESTIGATE` | Investigate Further | `--color-status-investigate` (`#D97706`) | `--color-status-investigate-bg` (`#FFFBEB`) |
| `ESCALATE` | Escalate | `--color-status-escalate` (`#2563EB`) | `--color-status-escalate-bg` (`#EFF6FF`) |
| `REFER` | Refer to Another Team | `--color-status-refer` (`#6B7280`) | `--color-status-refer-bg` (`#F9FAFB`) |
| `RESOLVED` / `CLOSED` | Closed | `--color-status-closed` (`#16A34A`) | `--color-status-closed-bg` (`#F0FDF4`) |

## Priority → Display Label Mapping

| API value | Display label | Text color | Badge background |
|-----------|--------------|------------|-----------------|
| `CRITICAL` | Critical | `--color-priority-critical` (`#DC2626`) | `#FEF2F2` |
| `HIGH` | High | `--color-priority-high` (`#EA580C`) | `#FFF7ED` |
| `MEDIUM` | Medium | `--color-priority-medium` (`#D97706`) | `#FFFBEB` |
| `LOW` | Low | `--color-priority-low` (`#6B7280`) | `#F9FAFB` |

## Typography

- **`--font-display`:** `'Inter', system-ui` — headings, labels, body, form fields, badge text
- **`--font-data`:** `'JetBrains Mono', monospace` — case IDs, amounts, account numbers, dates, references, character counters

Never mix fonts within a single UI element.

---

## Application Shell Layout

```
┌─────────────────────────────────────────────────────── 52px fixed ─┐
│  TOP BAR: "Standard Bank"   [user name]      [+ New Dispute]        │
├──────────────────┬──────────────────────────────────────────────────┤
│ SIDEBAR  220px   │  MAIN CONTENT AREA  (fluid, padding 24px 32px)   │
│                  │                                                  │
│ All Cases        │                                                  │
│ Pending          │                                                  │
│ Escalated        │                                                  │
│ Resolved         │                                                  │
│ Reports          │                                                  │
│                  │                                                  │
└──────────────────┴──────────────────────────────────────────────────┘
```

- Active nav item: `border-left: 3px solid var(--color-accent)`, `--color-text-primary`
- No icons in sidebar. No tooltips.
- Max `border-radius: 4px` anywhere in the app. No box shadows.

---

## Shared Components

| Component | File | Description |
|-----------|------|-------------|
| `TopBar` | `components/TopBar.tsx` | 52px fixed header: wordmark, user name, "New Dispute" button |
| `Sidebar` | `components/Sidebar.tsx` | 220px nav: All Cases, Pending, Escalated, Resolved, Reports |
| `DisputeRow` | `components/DisputeRow.tsx` | 48px table row with 3px left-border in action color |
| `StatusTag` | `components/StatusTag.tsx` | `[ 3px left border ] [ Action label text ]` — no pill, no background |
| `ActionPanel` | `components/ActionPanel.tsx` | Focal recommendation block with 3px border + 8% tint background |
| `ExplanationPanel` | `components/ExplanationPanel.tsx` | Rule explanation: ruleId, plain-language text, decision factors |
| `FilterBar` | `components/FilterBar.tsx` | Button groups + Issue Category dropdown |
| `OverrideModal` | `components/OverrideModal.tsx` | Modal: action select, priority select, reason textarea |
| `StatusTransition` | `components/StatusTransition.tsx` | Status controls + resolution note input |
| `FraudIndicator` | `components/FraudIndicator.tsx` | Plain text marker shown when `fraudFlag=true` |
| `LoadingBar` | `components/LoadingBar.tsx` | 2px progress bar at top of content area — no spinners, no skeletons |

---

## Screen 1: Dashboard

**Purpose:** Give the operations user (or team lead) an instant read of the dispute landscape — volume, priority distribution, queue load, and which cases are about to breach SLA. Entry point for navigating to the queue.

**User Journey:** Journey 8 (Monitor the Dashboard)
**Page file:** `client/src/pages/Dashboard.tsx`
**API:** `GET /api/dashboard`
**Traces:** REQ-090, REQ-091, REQ-092, REQ-093, REQ-094, REQ-095, REQ-096

---

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  "Payment Dispute Triage"    [New Dispute]  [View Queue]        │
├────────────┬────────────┬────────────┬──────────────────────────┤
│ Total Open │ Avg Age    │ Override % │  Early Warnings          │
│   18       │  4.7 days  │   15%      │  ⚠ 4 approaching SLA     │
│            │            │            │  🔴 2 approaching ESCL   │
├────────────┴────────────┴────────────┴──────────────────────────┤
│  BY PRIORITY                   │  BY ACTION                    │
│  ● CRITICAL  3  ████           │  ESCALATE         5  █████    │
│  ● HIGH      5  ████████       │  INVESTIGATE      8  ████████ │
│  ● MEDIUM    7  ████████████   │  REFER            3  ███      │
│  ● LOW       3  ████           │  RESOLVE_NOW      2  ██       │
├────────────────────────────────┴───────────────────────────────┤
│  BY QUEUE                      │  BY PAYMENT TYPE              │
│  CARD_DISPUTES         6       │  Card Payment      7          │
│  PAYMENTS_INVESTIGATIONS 5     │  EFT               6          │
│  INTERNAL_PAYMENTS_OPS  4      │  Internal Transfer  5         │
│  FRAUD_OPERATIONS       3      │                               │
└────────────────────────────────┴───────────────────────────────┘
```

**Components:**
- `Header` — App title, "New Dispute" primary button (links to CaptureDispute), "View Queue" secondary button
- `StatCard` — Reusable metric tile: label + large number + optional sub-label (used for Total Open, Avg Age, Override %)
- `EarlyWarningBanner` — Amber banner for approaching SLA (5–7 days); red banner for approaching escalation (12–14 days). Hidden when counts are 0
- `PriorityDistribution` — Horizontal bar chart with colour-coded bars, count labels (REQ-093)
- `ActionDistribution` — Horizontal bar chart for RESOLVE_NOW / INVESTIGATE / ESCALATE / REFER
- `QueueDistribution` — Count list for each routing queue
- `PaymentTypeDistribution` — Count list for each payment type

**Data displayed:**

| Field | Format | Source |
|-------|--------|--------|
| totalOpen | Plain number | `dashboard.totalOpen` |
| Average age | `X.X days` | `dashboard.averageAge` |
| Override rate | `XX%` | `dashboard.overrideRate` |
| Approaching SLA | `X disputes aged 5–7 days` | `dashboard.earlyWarnings.approachingSla` |
| Approaching escalation | `X disputes aged 12–14 days` | `dashboard.earlyWarnings.approachingEscalation` |
| By priority | Count per level | `dashboard.byPriority` |
| By action | Count per action | `dashboard.byAction` |
| By queue | Count per queue | `dashboard.byQueue` |
| By payment type | Count per type | `dashboard.byPaymentType` |

**Interactions:**
- Click "New Dispute" → navigate to `/disputes/new` (CaptureDispute screen)
- Click "View Queue" → navigate to `/disputes` (DisputeQueue screen)
- Click a priority row → navigate to queue pre-filtered by that priority
- Click a queue row → navigate to queue pre-filtered by that queue

**States:**
- Loading: four skeleton stat cards + shimmer bars for distributions
- Error: `"Unable to load dashboard metrics. Try again."` with retry button
- Empty: stat cards showing zeros; early warning banners hidden

---

## Screen 2: Dispute Queue

**Purpose:** The operations user scans all open disputes, filters to their workload, and selects a case to act on. Priority and age must be immediately visible without opening any individual case.

**User Journey:** Journey 3 (Review and Work the Dispute Queue)
**Page file:** `client/src/pages/DisputeQueue.tsx`
**API:** `GET /api/disputes?{filters}&page=1&limit=20`
**Traces:** REQ-060, REQ-061, REQ-062, REQ-063, REQ-064, REQ-065, REQ-066, REQ-067, REQ-070, REQ-093, REQ-094, REQ-096

---

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  "Dispute Queue"                           [+ New Dispute]      │
├─────────────────────────────────────────────────────────────────┤
│  SUMMARY BAR  (REQ-096)                                         │
│  🔴 CRITICAL 3   🟠 HIGH 5   🟡 MEDIUM 7   🟢 LOW 3            │
├─────────────────────────────────────────────────────────────────┤
│  FILTER BAR                                                     │
│  Priority [▼]  Payment Type [▼]  Category [▼]  Action [▼]       │
│  Status [▼]                               [Clear filters]       │
├──────┬───────────┬──────────┬────────────┬──────┬───────┬──────┤
│ Ref  │ Customer  │ Type     │ Category   │  Amt │ Pri   │ Age  │
│      │           │          │            │      │       │      │
├──────┼───────────┼──────────┼────────────┼──────┼───────┼──────┤
│DSP…  │Naledi K.  │CARD   🚨 │UNAUTHORISED│R8,500│CRITICAL│4d  │
│DSP…  │Thabo M.   │EFT       │DUPLICATE   │R2,500│MEDIUM  │2d  │
│DSP…  │Sipho N.   │INTERNAL  │FAILED_TRAN │R1,200│HIGH    │9d⚠ │
└──────┴───────────┴──────────┴────────────┴──────┴───────┴──────┘
  Showing 3 of 18 disputes                    [< 1 2 >]
```

**Components:**
- `TopBar` — "New Dispute" button in `--color-accent` (top bar, not inline)
- `SummaryBar` — Flat count labels per action type, using action color tokens (REQ-096)
- `FilterBar` — Button groups: Payment Type, Age, Priority. Dropdown for Issue Category. Active filter: `border-bottom: 2px solid --color-accent` (REQ-062–066)
- `DisputeTable` — Sortable table. Default sort: priority DESC, age DESC
- `DisputeRow` — 48px row with 3px left-border in action color (`--color-status-*`)
- `StatusTag` — Action label in matching color, no pill, no background
- `FraudIndicator` — Plain text "⚠ Fraud" marker beside payment type when `fraudFlag=true` (REQ-070)
- `LoadingBar` — 2px progress bar at top of content area while fetching
- `Pagination` — Page controls at bottom

**Table Columns:**

| Column | Source field | Format |
|--------|-------------|--------|
| Case Ref | `caseReference` | `DSP-YYYYMMDD-XXXX` |
| Customer | `customerName` | Plain text |
| Payment Type | `paymentType` | Label + 🚨 if fraudFlag |
| Issue Category | `issueCategory` | Readable label |
| Amount | `amount` | `R X,XXX.XX` |
| Priority | `priority` | `PriorityBadge` (colour-coded) |
| Action | `recommendedAction` | `ActionBadge` |
| Age | `age` + `ageBand` | `Xd` + `AgeBadge` |
| Due | `dueDate` | `DD MMM YYYY` |
| Status | `status` | Plain label |

**Interactions:**
- Select filter value → call `GET /api/disputes?{filter}=value` and re-render table
- Click "Clear filters" → remove all filters, reload full list
- Click a table row → navigate to `/disputes/:id` (DisputeDetail screen)
- Click "New Dispute" → navigate to `/disputes/new` (CaptureDispute screen)
- Click page number → load that page

**States:**
- Loading: skeleton table rows (5 shimmer rows) while fetching
- Empty (no disputes): `"No disputes found. Create the first one or adjust your filters."`
- Empty (filters active): `"No disputes match the selected filters."` + "Clear filters" link
- Error: `"Unable to load disputes. Try again."` with retry button

---

## Screen 3: Capture Dispute

**Purpose:** The operations user logs a new customer payment dispute during or after a customer call. Opens as a **560px modal** — not a full-page route. Triage runs automatically on submit and the result replaces the form content.

**User Journey:** Journey 1 (Capture a New Dispute)
**Page file:** `client/src/pages/CaptureDispute.tsx`
**API:** `POST /api/disputes`, `GET /api/enums`
**Traces:** REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-125

> ⚠ **Conflict note:** REQ-008 specifies max 500 characters for description. The UI design skill caps the description field at **400 characters**. The server accepts up to 500. The UI enforces the stricter 400-char limit. Team to confirm which value is canonical.

---

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  ← Back to Queue      "Capture New Dispute"                     │
├─────────────────────────────────────────────────────────────────┤
│  CUSTOMER DETAILS                                               │
│  Customer Name *          Account Number * (10 digits)          │
│  [________________________] [__________________]                │
│                                                                 │
│  TRANSACTION DETAILS                                            │
│  Transaction Reference *  Amount (ZAR) *    Transaction Date *  │
│  [____________________]   [R ___________]  [DD/MM/YYYY ___]     │
│                                                                 │
│  CLASSIFICATION                                                 │
│  Payment Type *           Issue Category *  Transaction Status *│
│  [CARD ▼]                 [Duplicate Debit ▼] [Settled ▼]       │
│                                                                 │
│  DESCRIPTION (optional)                                         │
│  [________________________________________________]             │
│                                             245 / 500 chars     │
│                                                                 │
│  [Cancel]                         [Submit Dispute →]            │
└─────────────────────────────────────────────────────────────────┘
```

**After successful submission — triage result inline:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ✅  Dispute created: DSP-20260622-0003                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │  RECOMMENDATION                                      │      │
│  │  🟡 MEDIUM priority  ·  RESOLVE NOW                  │      │
│  │  Queue: Payments Investigations                      │      │
│  │                                                      │      │
│  │  "Low-value duplicate debit on a settled             │      │
│  │   transaction. Recommended to reverse immediately."  │      │
│  │                                                      │      │
│  │  Rule matched: REQ-038                               │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  [View Full Detail →]              [Capture Another Dispute]    │
└─────────────────────────────────────────────────────────────────┘
```

**Components:**
- `Header` — Back navigation to queue
- `FormField` — Labelled input with inline error state and aria-describedby for error message
- `AmountInput` — Numeric input prefixed with "R", formats as `R X,XXX.XX` on blur
- `DateInput` — Date picker constrained to today or earlier
- `EnumSelect` — Dropdown populated from `GET /api/enums`. Renders `{ value, label }` pairs
- `CharacterCounter` — Live `X / 500` counter below description textarea
- `TriageResultCard` — Shown after successful submission: case reference, priority badge, action badge, queue, explanation, ruleId

**Form Fields:**

| Field | Input type | Required | Validation |
|-------|-----------|----------|------------|
| Customer Name | Text | Yes | Non-empty |
| Account Number | Text | Yes | Exactly 10 digits |
| Transaction Reference | Text | Yes | Non-empty |
| Amount | Number | Yes | > 0 |
| Transaction Date | Date | Yes | Not in future |
| Payment Type | Select | Yes | CARD, EFT, INTERNAL_TRANSFER |
| Issue Category | Select | Yes | 5 options |
| Transaction Status | Select | Yes | SETTLED, PENDING, FAILED, REVERSED |
| Description | Textarea | No | Max **400 characters** (see conflict note above) |

**Interactions:**
- Page loads → call `GET /api/enums` to populate dropdowns
- User types in field → real-time client-side validation, inline error below field
- User types in description → character counter updates live
- Click "Submit Dispute" → run full client validation; if errors show them; if valid call `POST /api/disputes`
- Successful response → hide form, show `TriageResultCard` with case reference and triage result
- Click "View Full Detail →" → navigate to `/disputes/:id`
- Click "Capture Another Dispute" → reset form, hide result card, show blank form
- Click "Cancel" or "← Back to Queue" → navigate to `/disputes`

**States:**
- Default: blank form, dropdowns populated from `/api/enums` on open
- Submitting: submit button disabled + `LoadingBar` at modal top, fields read-only
- Validation error: `1px solid --color-status-immediate` border on invalid field, error text below (within 500ms, REQ-125)
- Success: form content replaced by `ActionPanel` showing triage result + case reference
- Server error: inline error text beneath submit button in `--color-status-immediate`

---

## Screen 4: Dispute Detail

**Purpose:** The operations user reads the full dispute record, understands exactly why the system made its recommendation, and then acts — either accepting it by updating status, or overriding it with a documented reason. Opens as a **right-side sliding panel (480px)** — the queue list remains visible behind it.

**User Journey:** Journey 4 (Review Detail), Journey 5 (Override), Journey 6 (Progress Status)
**Page file:** `client/src/pages/DisputeDetail.tsx`
**API:** `GET /api/disputes/:id`, `PATCH /api/disputes/:id/status`, `POST /api/disputes/:id/override`
**Traces:** REQ-068, REQ-069, REQ-070, REQ-075, REQ-076, REQ-077, REQ-078, REQ-079, REQ-080, REQ-081, REQ-082, REQ-083, REQ-084

---

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                         │
│  ← Back to Queue      DSP-20260620-0002          🚨 FRAUD FLAG  │
├──────────────────────────────┬──────────────────────────────────┤
│  DISPUTE DETAILS             │  RECOMMENDATION                  │
│                              │  ┌──────────────────────────┐   │
│  Customer: Naledi Khumalo    │  │  🔴 CRITICAL              │   │
│  Account:  ••••••3210        │  │  ESCALATE                 │   │
│  Ref:      TXN-20260618-044  │  │  → FRAUD_OPERATIONS       │   │
│  Amount:   R 8,500.00        │  │                           │   │
│  Date:     18 Jun 2026       │  │  ⚠ SLA breach: 4 of 7 days│   │
│  Payment:  Card Payment      │  │                           │   │
│  Category: Unauthorised Txn  │  │  WHY THIS RECOMMENDATION  │   │
│  Status:   Settled           │  │  "This dispute involves an│   │
│  Age:      4 days  [AGEING]  │  │   unauthorised transaction│   │
│  Due:      25 Jun 2026       │  │   exceeding R5,000 on a   │   │
│  Description: Customer did   │  │   card payment. Escalated │   │
│  not authorise POS charge    │  │   to Fraud Operations."   │   │
│                              │  │                           │   │
│                              │  │  Rule: REQ-033            │   │
│                              │  │  Rules checked:           │   │
│                              │  │  REQ-031, REQ-032, ✓033   │   │
│                              │  │                           │   │
│                              │  │  [Override Recommendation]│   │
│                              │  └──────────────────────────┘   │
├──────────────────────────────┴──────────────────────────────────┤
│  STATUS MANAGEMENT                                              │
│  Current: OPEN                                                  │
│  [Mark In Progress]                                             │
├─────────────────────────────────────────────────────────────────┤
│  STATUS HISTORY                                                 │
│  22 Jun 2026 10:30 — Created as OPEN by system                  │
└─────────────────────────────────────────────────────────────────┘
```

**When dispute is overridden:**
```
│  RECOMMENDATION  ⚙ MANUALLY SET                                 │
│  🟠 HIGH  ·  ESCALATE  (overridden from MEDIUM · INVESTIGATE)   │
│  Reason: "Customer is a VIP private banking client..."          │
│  By ops-user-001 on 22 Jun 2026 15:00                           │
```

**When dispute is CLOSED:**
```
│  🔒 This dispute is closed. No further changes are permitted.   │
```

---

**Components:**
- `DisputeInfoPanel` — Case ID in `--font-data`, all captured fields. Account number masked. Amount in `--font-data`. Date as `DD MMM YYYY`
- `FraudIndicator` — Plain text "⚠ Fraud" shown in panel header when `fraudFlag=true` (REQ-070)
- `SlaWarning` — Inline text below age: `--color-status-immediate` if `slaBreached`, `--color-status-escalate` if `escalationBreached` (REQ-069)
- `ActionPanel` — Focal block: `3px left border` in action color + `rgba 8% tint` background (only element with tint). Shows: display label, `ExplanationPanel`, target queue
- `ExplanationPanel` — Rule text + ruleId + rulesEvaluated list. Plain text, no icons
- `OverrideIndicator` — "⚙ MANUALLY SET" + original values + reason + operator when `isOverridden=true`. Plain text, no pill (REQ-079)
- `OverrideModal` — 560px modal: action select, priority select, reason textarea (10–300 chars) (REQ-075–077)
- `StatusTransition` — Current status, next available buttons. Resolved expands resolution note input (REQ-080–083)
- `StatusHistory` — Chronological list, timestamps in `--font-data` (REQ-084)
- `ImmutableBanner` — Full-width banner in `--color-border` style when status=`CLOSED`. Text only, no icons (REQ-083)

**Interactions:**

| Action | Trigger | System response |
|--------|---------|-----------------|
| Load page | Navigate from queue | `GET /api/disputes/:id` → render all panels |
| "Mark In Progress" | Button click | `PATCH /api/disputes/:id/status` `{status:"IN_PROGRESS"}` → update status badge + history |
| "Mark Resolved" | Button click | Expand resolution note textarea → require min 10 chars |
| Submit resolution note | "Confirm" button | `PATCH /api/disputes/:id/status` `{status:"RESOLVED", note}` → update status + history |
| "Close Dispute" | Button click (only from RESOLVED) | Confirmation prompt → `PATCH .../status` `{status:"CLOSED"}` → all controls disabled |
| "Override Recommendation" | Button click | Open `OverrideModal` |
| Submit override | Modal "Confirm" button | `POST /api/disputes/:id/override` `{action, priority, reason}` → reload recommendation panel |
| Close modal | "Cancel" or outside click | Dismiss modal, no changes |
| Click "← Back to Queue" | Link | Navigate to `/disputes` |

**States:**
- Loading: `LoadingBar` at top of panel while fetching
- Error loading: inline text `"Unable to load dispute. Try again."` with retry link
- CLOSED: `ImmutableBanner` shown, all action buttons hidden
- Override active: `OverrideIndicator` replaces action panel header
- SLA breached (age ≥ 7): `--color-status-immediate` text line under age
- Escalation breached (age ≥ 14): `--color-status-escalate` text line under age

---

## Screen Summary

| Screen | File | Journeys | Primary API calls |
|--------|------|----------|-------------------|
| Dashboard | `Dashboard.tsx` | 8 | `GET /api/dashboard` |
| DisputeQueue | `DisputeQueue.tsx` | 3 | `GET /api/disputes` |
| CaptureDispute | `CaptureDispute.tsx` | 1 | `POST /api/disputes`, `GET /api/enums` |
| DisputeDetail | `DisputeDetail.tsx` | 4, 5, 6 | `GET /api/disputes/:id`, `PATCH .../status`, `POST .../override` |

## Requirements Coverage

| Requirement Set | Screen | Count |
|----------------|--------|-------|
| REQ-001–009 (Capture) | CaptureDispute | 9 |
| REQ-060–070 (Queue) | DisputeQueue | 11 |
| REQ-068–070 (Detail view) | DisputeDetail | 3 |
| REQ-075–084 (Override + Status) | DisputeDetail | 10 |
| REQ-090–096 (Dashboard) | Dashboard | 7 |
| REQ-093, REQ-094 (Visual badges) | DisputeQueue, DisputeDetail | 2 |
| REQ-123–126 (Non-functional) | All screens | 4 |
