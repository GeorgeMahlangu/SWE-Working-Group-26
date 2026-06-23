# Design — Operations Dashboard

## Overview

A single aggregation endpoint computes all dashboard metrics in one pass over the
dispute table; the Dashboard screen renders metric cards and early-warning
indicators, with each grouping linking through to a pre-filtered queue.

## Architecture

```
Dashboard.tsx ──(useDashboard)──▶ GET /api/dashboard
   metric cards · early-warning panel · override-rate · summary
        │ (click grouping)
        ▼ navigate → /queue?priority=… | ?paymentType=… (reuses queue filters)

routes/dashboard.ts (thin) ──▶ disputeService.getDashboardMetrics() ──▶ Prisma/SQLite
```

## Components and Interfaces

### API: `GET /api/dashboard` (REQ-090–096)
Returns a single metrics object:
```
{
  totalOpen: number,
  byPriority:    { CRITICAL, HIGH, MEDIUM, LOW },
  byAction:      { RESOLVE_NOW, INVESTIGATE, ESCALATE, REFER },
  byQueue:       { CARD_DISPUTES, PAYMENTS_INVESTIGATIONS, INTERNAL_PAYMENTS_OPS, FRAUD_OPERATIONS },
  byPaymentType: { CARD, EFT, INTERNAL_TRANSFER },
  averageAgeDays: number,
  earlyWarnings: { approaching7Day: number, approaching14Day: number },
  overrideRate:  { overridden: number, total: number, percentage: number }
}
```

### Aggregation: `disputeService.getDashboardMetrics()`
- Single query/scan; group-by counts computed in memory for SQLite simplicity.
- `averageAgeDays` = mean of `ageInDays` across open disputes.
- `approaching7Day` counts age 5–7; `approaching14Day` counts age 12–14.
- `overrideRate.percentage` = round(overridden / total × 100).

### Frontend components
- `Dashboard.tsx` — page; calls `useDashboard`; renders metric groups.
- Metric cards reuse priority colour-coding and age-band badges per
  `.kiro/skills/ui-design.md` (no pill badges beyond the approved system, no
  shadows, max 4px radius).
- Each grouping is a button/link that routes to the queue with the matching
  filter query param.

## Data Models

Read-only over the existing `Dispute` model; no schema changes. Introduces a
transient `DashboardMetrics` DTO (shape above) shared via `types/`.

## Error Handling

- On query failure, return 500 `{ error: "Unable to load dashboard metrics" }`;
  the client shows an inline error region with `role="alert"`.

## Testing Strategy

- API tests with a seeded fixture: verify each group-by count, average age,
  early-warning bands (boundary ages 4/5/7/8 and 11/12/14/15), and override-rate
  percentage rounding.
- Component tests: colour-coding and badges render correctly; clicking a
  grouping navigates with the expected filter query param.
