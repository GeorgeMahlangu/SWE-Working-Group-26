# Tasks — Override & Status Lifecycle

- [ ] 1. Extend the data model
  - Add originalRecommendation, originalPriority, overrideReason, isOverridden,
    resolutionNote; add Audit Trail record
  - _Requirements: REQ-078, REQ-079, REQ-081, REQ-084_

- [ ] 2. Implement override in disputeService
  - [ ] 2.1 `applyOverride()` — validate reason 10–300, require action or priority
    - _Requirements: REQ-075–077_
  - [ ] 2.2 Preserve originals, set isOverridden, record audit entry
    - _Requirements: REQ-078, REQ-079, REQ-084_
  - [ ] 2.3 `POST /api/disputes/:id/override` thin handler
    - _Requirements: REQ-075_

- [ ] 3. Implement status transitions in disputeService
  - [ ] 3.1 `transitionStatus()` enforcing OPEN→IN_PROGRESS→RESOLVED→CLOSED
    - _Requirements: REQ-080_
  - [ ] 3.2 Require resolution note ≥ 10 chars for RESOLVED
    - _Requirements: REQ-081_
  - [ ] 3.3 Allow CLOSED only from RESOLVED; block all edits when CLOSED
    - _Requirements: REQ-082, REQ-083_
  - [ ] 3.4 Record each transition with timestamp + operator
    - _Requirements: REQ-084_
  - [ ] 3.5 `PATCH /api/disputes/:id/status` thin handler
    - _Requirements: REQ-080_

- [ ] 4. Implement age-based auto-escalation
  - `reevaluateAge()`: 7-day priority bump, 14-day forced ESCALATE, refresh explanation
  - _Requirements: REQ-018, REQ-019, REQ-031, REQ-055_

- [ ] 5. Unit + API tests
  - Override reason boundaries, originals preserved, audit recorded
  - Legal/illegal transitions, RESOLVED note, CLOSED immutability
  - Age bump per priority, 14-day forced escalation
  - _Requirements: REQ-075–084, REQ-018, REQ-019_

- [ ] 6. Build OverrideModal
  - Action/priority selects with display labels, reason field with live length
    validation and role="alert" errors
  - _Requirements: REQ-075–077, REQ-126_

- [ ] 7. Build StatusTransition controls
  - Show allowed next states; resolution-note field for RESOLVED; disable when CLOSED
  - _Requirements: REQ-080–083_

- [ ] 8. Show overridden indicator on detail
  - Render manual-override marker in ActionPanel when isOverridden
  - _Requirements: REQ-079_
