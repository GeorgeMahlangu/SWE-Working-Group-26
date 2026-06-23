# Tasks — Operations Dashboard

- [ ] 1. Implement metrics aggregation in disputeService
  - [ ] 1.1 Counts by priority, action, queue, payment type; total open
    - _Requirements: REQ-090_
  - [ ] 1.2 Average dispute age
    - _Requirements: REQ-090_
  - [ ] 1.3 Early-warning bands (5–7 days, 12–14 days)
    - _Requirements: REQ-091_
  - [ ] 1.4 Override rate (count + percentage of total)
    - _Requirements: REQ-092_

- [ ] 2. Implement the dashboard endpoint
  - `GET /api/dashboard` thin handler returning the DashboardMetrics DTO
  - _Requirements: REQ-090–092_

- [ ] 3. API tests
  - Seeded fixture: each group-by count, average age, early-warning boundaries
    (4/5/7/8, 11/12/14/15), override-rate rounding
  - _Requirements: REQ-090–092_

- [ ] 4. Build the useDashboard hook
  - Fetch metrics; no fetch in components
  - _Requirements: REQ-090_

- [ ] 5. Build the Dashboard screen
  - [ ] 5.1 Metric cards for priority/action/queue/payment-type + total + avg age
    - _Requirements: REQ-090, REQ-095_
  - [ ] 5.2 Early-warning panel
    - _Requirements: REQ-091_
  - [ ] 5.3 Override-rate display
    - _Requirements: REQ-092_
  - [ ] 5.4 Priority colour-coding and age-band badges
    - _Requirements: REQ-093, REQ-094_
  - [ ] 5.5 Click-through navigation to pre-filtered queue
    - _Requirements: REQ-062–066_
  - [ ] 5.6 Amount/date formatting, ARIA, LoadingBar
    - _Requirements: REQ-123, REQ-124, REQ-126_

- [ ] 6. Component tests
  - Colour-coding/badges render; grouping click navigates with correct filter
  - _Requirements: REQ-093, REQ-094_
