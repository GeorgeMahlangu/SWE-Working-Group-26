# Tasks — Dispute Capture & Automatic Triage

- [ ] 1. Define shared types and business parameters
  - Add enum types and `Dispute` interface in `server/src/types/dispute.ts`
  - Add business-parameter constants module (single source of truth)
  - _Requirements: REQ-002, REQ-111_

- [ ] 2. Implement age, priority, and queue helpers
  - [ ] 2.1 Compute age (calendar days) and age band NEW/AGEING/BREACHED
    - _Requirements: REQ-010–013_
  - [ ] 2.2 Compute base priority and due date
    - _Requirements: REQ-014–017, REQ-020_
  - [ ] 2.3 Assign routing queue with fraud override
    - _Requirements: REQ-025–028_

- [ ] 3. Build the triage rules engine
  - [ ] 3.1 Implement one function per rule REQ-031–048 in `rules/triageRules.ts`
    - _Requirements: REQ-031–048_
  - [ ] 3.2 Implement ordered evaluation (first match wins) in `triageEngine.ts`
    - _Requirements: REQ-030_
  - [ ] 3.3 Apply 7-day priority bump and 14-day forced escalation
    - _Requirements: REQ-018, REQ-019_
  - [ ] 3.4 Set fraudFlag for CARD + UNAUTHORISED_TRANSACTION
    - _Requirements: REQ-035_
  - [ ] 3.5 Produce ruleId, explanation, decisionFactors, targetQueue, rulesEvaluated
    - _Requirements: REQ-050–053_

- [ ] 4. Unit-test the engine to 100% rule coverage
  - One test per rule REQ-031–048; determinism test
  - _Requirements: REQ-030–048, REQ-054_

- [ ] 5. Implement persistence in disputeService
  - Prisma create, `generateCaseReference()` (DSP-YYYYMMDD-XXXX), decision logging
  - _Requirements: REQ-001, REQ-002, REQ-055, REQ-112_

- [ ] 6. Implement server validation and routes
  - [ ] 6.1 `validateDispute()` — required fields, enum membership, amount, date
    - _Requirements: REQ-003–006, REQ-009_
  - [ ] 6.2 `POST /api/disputes` thin handler returning record + recommendation
    - _Requirements: REQ-001, REQ-120_
  - [ ] 6.3 `GET /api/enums`
    - _Requirements: REQ-007_
  - [ ] 6.4 `POST /api/seed` covering every rule path
    - _Requirements: REQ-100–104_

- [ ] 7. Build the CaptureDispute screen
  - [ ] 7.1 Form with enum dropdowns from `/api/enums`, description counter
    - _Requirements: REQ-007, REQ-008_
  - [ ] 7.2 Client-side validation mirroring server, inline errors via role="alert"
    - _Requirements: REQ-009, REQ-125_
  - [ ] 7.3 Submit via useDisputes hook; render triage result on success
    - _Requirements: REQ-001, REQ-050–053_
  - [ ] 7.4 ARIA labels, keyboard nav, shared formatAmount/formatDate
    - _Requirements: REQ-123, REQ-124, REQ-126_

- [ ] 8. API/integration tests
  - Validation rejections, success path, 2-second budget
  - _Requirements: REQ-003–006, REQ-120_
