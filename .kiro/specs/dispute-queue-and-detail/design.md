# Design — Dispute Queue & Detail

## Overview

Two read-only screens backed by list and detail endpoints. The queue fetches a
filtered, sorted, paginated set of disputes; the detail screen fetches one
dispute and renders its recommendation and explanation. All data fetching goes
through hooks; components are presentational and receive data via props.

## Architecture

```
DisputeQueue.tsx ──(useDisputes)──▶ GET /api/disputes?priority=&paymentType=&...
   │  FilterBar, summary bar, DisputeRow[]
   ▼ (row click → route)
DisputeDetail.tsx ──(useDispute)──▶ GET /api/disputes/:id
                  └─(useRules)────▶ GET /api/rules
      ActionPanel, ExplanationPanel, FraudIndicator, StatusTag

routes/disputes.ts (thin) ──▶ disputeService.list()/get() ──▶ Prisma/SQLite
```

## Components and Interfaces

### API: `GET /api/disputes` (REQ-060–066, REQ-121)
- Query params: `priority`, `paymentType`, `issueCategory`, `action`, `status`,
  `page`, `pageSize` — all optional and combinable.
- Server applies filters, sorts by priority rank then age (oldest first), and
  paginates. Returns `{ items: Dispute[], total, page, pageSize }`.

### API: `GET /api/disputes/:id` (REQ-068–070)
- Returns the full dispute including recommendation, explanation, decision
  factors, triggered rule, fraud flag, and SLA/escalation threshold flags.

### API: `GET /api/rules` (REQ-050)
- Returns the active triage rules (id, title, summary) for the reference panel.

### Frontend components
- `DisputeQueue.tsx` — page; owns filter state, calls `useDisputes`.
- `FilterBar.tsx` — button groups + issue-category dropdown.
- `DisputeRow.tsx` — one row with 3px left-border action colour, priority badge,
  age badge, fraud indicator.
- `StatusTag.tsx`, `ActionPanel.tsx`, `ExplanationPanel.tsx`,
  `FraudIndicator.tsx` — presentational; per `.kiro/skills/ui-design.md`.
- `DisputeDetail.tsx` — page; calls `useDispute` and `useRules`.

## Data Models

Consumes the `Dispute` model defined in the capture-and-triage spec; no schema
changes. Adds a derived `summaryByPriority` aggregate for the summary bar.

## Sorting & Filtering Logic

- Priority rank: `CRITICAL=0, HIGH=1, MEDIUM=2, LOW=3`; ascending, then age
  descending (oldest first). (REQ-061)
- Filtering is applied server-side for correct pagination across the full set.

## Error Handling

- Unknown `:id` returns 404 `{ error: "Dispute not found" }`.
- Invalid filter values return 400 `{ error, field }`.

## Testing Strategy

- API tests: sort order, each filter, combined filters, pagination, 404.
- Component tests: row renders correct colour-coding/badges/labels; fraud
  indicator appears only when `fraudFlag` is true; SLA/escalation highlight in
  detail.
- Performance check: 100-record render within budget (REQ-121).
