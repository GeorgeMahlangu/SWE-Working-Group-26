# Tasks — Dispute Queue & Detail

- [ ] 1. Implement list query in disputeService
  - Filtering (priority, paymentType, issueCategory, action, status), sort by
    priority rank then age, pagination
  - _Requirements: REQ-061, REQ-062–066, REQ-121_

- [ ] 2. Implement queue and detail endpoints
  - [ ] 2.1 `GET /api/disputes` with query params and paginated response
    - _Requirements: REQ-060, REQ-062–066_
  - [ ] 2.2 `GET /api/disputes/:id` returning full detail + threshold flags
    - _Requirements: REQ-068, REQ-069_
  - [ ] 2.3 `GET /api/rules` returning active rules
    - _Requirements: REQ-050_
  - [ ] 2.4 API tests: sorting, filters, pagination, 404
    - _Requirements: REQ-061, REQ-062–066_

- [ ] 3. Build data hooks
  - `useDisputes(filters)`, `useDispute(id)`, `useRules()` — no fetch in components
  - _Requirements: REQ-060, REQ-068_

- [ ] 4. Build the DisputeQueue screen
  - [ ] 4.1 Summary bar with per-priority counts
    - _Requirements: REQ-096_
  - [ ] 4.2 FilterBar (button groups + issue-category dropdown)
    - _Requirements: REQ-062–066_
  - [ ] 4.3 DisputeRow with priority/age badges, fraud indicator, action label
    - _Requirements: REQ-060, REQ-070, REQ-093, REQ-094_
  - [ ] 4.4 Row click navigates to detail
    - _Requirements: REQ-067_
  - [ ] 4.5 Amount/date formatting, ARIA, LoadingBar
    - _Requirements: REQ-123, REQ-124, REQ-126_

- [ ] 5. Build the DisputeDetail screen
  - [ ] 5.1 Full field display
    - _Requirements: REQ-068_
  - [ ] 5.2 ActionPanel + ExplanationPanel (ruleId, factors, target queue)
    - _Requirements: REQ-050–053, REQ-095_
  - [ ] 5.3 SLA / escalation breach highlight
    - _Requirements: REQ-069_
  - [ ] 5.4 Rules reference panel from useRules
    - _Requirements: REQ-050_

- [ ] 6. Component tests
  - Colour-coding, badges, action labels, fraud indicator visibility, breach highlight
  - _Requirements: REQ-070, REQ-093, REQ-094, REQ-069_
