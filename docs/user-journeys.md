# User Journeys — Intelligent Triage of Customer Payment Disputes

## Document Information

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Date | 22 June 2026 |
| Author | Group 26 — UI/UX Designer |

---

## Overview

This document maps out the key user journeys for the Dispute Triage prototype. The primary actor is the **Operations User** — a frontline banking staff member responsible for capturing, triaging, and resolving customer payment disputes.

---

## Journey 1: Capture a New Dispute

**Goal:** The operations user receives a customer complaint about a payment issue and needs to log it in the system.

**Precondition:** The user is logged in and on the dispute capture screen.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Operations User | Clicks "New Dispute" from the queue or dashboard | System displays the dispute capture form |
| 2 | Operations User | Enters customer name, 10-digit account number, transaction reference, transaction amount, and transaction date | System validates each field in real time (client-side) |
| 3 | Operations User | Selects a payment type (Card Payment, EFT, or Internal Transfer) | Selection is recorded |
| 4 | Operations User | Selects an issue category (Duplicate Debit, Failed Transfer, Missing Payment, Unauthorized Transaction, or Incorrect Amount) | Selection is recorded |
| 5 | Operations User | Selects the transaction status (Completed, Pending, Failed, or Reversed) | Selection is recorded |
| 6 | Operations User | Optionally enters a description (max 500 characters) | Character counter updates |
| 7 | Operations User | Clicks "Submit Dispute" | System validates all fields server-side |
| 8 | System | Validates all inputs pass | System creates the dispute record with status OPEN, assigns a case reference (DSP-YYYYMMDD-XXXX), records the creation timestamp in ISO 8601 format, and displays a confirmation with the case reference |
| 9 | System | Automatically triggers triage | System evaluates triage rules within 1 second and assigns a priority and recommended action (see Journey 2) |

**Alternate Flow — Validation Failure:**

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 7a | System | One or more fields fail validation | System displays specific error messages (e.g. "Account number must be 10 digits", "Transaction amount must be greater than zero", "Transaction date cannot be in the future") and highlights the affected fields |
| 7b | Operations User | Corrects the flagged fields and resubmits | Flow returns to step 8 |

**Requirements Covered:** REQ-001 to REQ-015, REQ-053, REQ-061

---

## Journey 2: Automatic Triage and Rule Evaluation

**Goal:** The system evaluates the newly captured dispute against business rules and assigns a priority and recommended action.

**Precondition:** A dispute has just been created (end of Journey 1).

**Note:** This journey is system-driven — the operations user does not take action but sees the results.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | System | Evaluates the dispute against all applicable triage rules | Rules engine checks issue category, payment type, transaction amount, transaction status, transaction date, and dispute age |
| 2 | System | Determines priority (Critical, High, Medium, or Low) and recommended action (Escalate, Refer to Specialist Team, Investigate, or Auto-Resolve) | If multiple rules apply, the system uses the highest priority and most urgent action |
| 3 | System | Checks if the transaction amount exceeds R50,000 | If yes, overrides to Critical priority and Escalate action regardless of other rules |
| 4 | System | Checks if the dispute involves a Card Payment with an Unauthorized Transaction | If yes, flags for potential fraud referral |
| 5 | System | Records which rules triggered, including rule identifiers and conditions matched | Audit trail is created |
| 6 | System | Generates a plain-language explanation of why the priority and action were assigned | Explanation is stored with the dispute |

**Example Scenarios:**

| Scenario | Priority | Action | Notes |
|----------|----------|--------|-------|
| Unauthorized Transaction, R8,000, Card Payment | Critical | Escalate | Flagged for fraud |
| Duplicate Debit, Completed status | Medium | Auto-Resolve | |
| Failed Transfer, transaction date 3 days ago | High | Escalate | Older than 48 hours |
| Missing Payment, EFT | Medium | Investigate | |
| Any issue, R60,000 | Critical | Escalate | Amount override |

**Requirements Covered:** REQ-016 to REQ-036

---

## Journey 3: Review and Work the Dispute Queue

**Goal:** The operations user reviews the queue of open disputes, filters and sorts to find cases that need attention, and selects one to work on.

**Precondition:** The user is on the dispute queue screen.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Operations User | Navigates to the dispute queue | System displays all disputes sorted by priority (Critical first) and within priority by age (oldest first). Each row shows case reference, customer name, payment type, issue category, transaction amount, priority (colour-coded), recommended action, dispute age, and status. Fraud-flagged disputes show a fraud indicator icon |
| 2 | Operations User | Applies filters by priority, payment type, issue category, or recommended action | Queue updates to show only matching disputes |
| 3 | Operations User | Scans the queue for the next case to work on | Colour coding helps: Critical (red), High (orange), Medium (yellow), Low (green) |
| 4 | Operations User | Clicks a dispute row | System navigates to the dispute detail view (Journey 4) |

**Requirements Covered:** REQ-037 to REQ-045

---

## Journey 4: Review Dispute Detail and Recommendation

**Goal:** The operations user reviews the full detail of a dispute, understands why it was triaged the way it was, and decides on a course of action.

**Precondition:** The user has clicked a dispute from the queue.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | System | Loads the dispute detail view | Displays all captured fields (customer name, account number, transaction reference, amount, date, payment type, issue category, transaction status, description), the recommended action, priority level, plain-language explanation, list of triggered rules, dispute age, and whether the 7-day or 14-day escalation threshold has been crossed |
| 2 | Operations User | Reads the plain-language explanation | Understands why the system recommends this particular action |
| 3 | Operations User | Reviews triggered rules | Sees each rule identifier and the condition that was matched |
| 4 | Operations User | Decides to either accept the recommendation (Journey 6 — update status), override the recommendation (Journey 5), or return to the queue | |

**Requirements Covered:** REQ-046, REQ-047

---

## Journey 5: Override a Recommendation

**Goal:** The operations user disagrees with the system recommendation and wants to set a different action based on their professional judgement.

**Precondition:** The user is viewing a dispute detail with an active recommendation.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Operations User | Clicks "Override Recommendation" | System displays the available action options (Auto-Resolve, Investigate, Escalate, Refer to Specialist Team) |
| 2 | Operations User | Selects an alternative action | System prompts for a reason |
| 3 | Operations User | Enters a reason (10–300 characters) | System validates the reason length |
| 4 | Operations User | Confirms the override | System records the original recommendation, new action, reason, and timestamp for audit. The dispute detail view now shows a visual indicator that the action was set manually |

**Alternate Flow — Reason Too Short:**

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 3a | System | Reason is fewer than 10 characters | System displays an error: reason must be between 10 and 300 characters |
| 3b | Operations User | Enters a longer reason | Flow returns to step 4 |

**Requirements Covered:** REQ-048 to REQ-051

---

## Journey 6: Progress Dispute Through Statuses

**Goal:** The operations user updates the dispute status as they work through resolution.

**Precondition:** The user is viewing a dispute detail.

**Status Flow:** Open → In Progress → Resolved → Closed

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Operations User | Changes status from Open to In Progress | System updates the status |
| 2 | Operations User | Works the dispute (investigation, escalation, etc.) | Status remains In Progress |
| 3 | Operations User | Changes status to Resolved | System requires a resolution note of at least 10 characters |
| 4 | Operations User | Enters a resolution note and confirms | System records the resolution and updates the status to Resolved |
| 5 | Operations User | Changes status from Resolved to Closed | System closes the dispute. No further modifications are allowed |

**Alternate Flows:**

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 5a | Operations User | Attempts to close a dispute that is not Resolved | System rejects: "Dispute must be resolved before closing" |
| 5b | Operations User | Attempts to modify a Closed dispute | System rejects: no modifications allowed on closed disputes |

**Requirements Covered:** REQ-052 to REQ-056

---

## Journey 7: Automatic Escalation of Ageing Disputes

**Goal:** The system automatically escalates disputes that have been open too long, ensuring nothing falls through the cracks.

**Precondition:** Disputes exist in Open or In Progress status.

**Note:** This is a system-driven journey — no user action is needed.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | System | Detects a dispute has been open for more than 7 calendar days | Priority is escalated by one level (Low → Medium, Medium → High, High → Critical) |
| 2 | System | Detects a dispute has been open for more than 14 calendar days | Recommended action is changed to Escalate regardless of the original recommendation |
| 3 | System | Updates the triggered rules and explanation | New escalation rules are appended to the rule audit trail |

**Requirements Covered:** REQ-033, REQ-034

---

## Journey 8: Monitor the Dashboard

**Goal:** The operations user (or team lead) checks the dashboard for an overview of the current dispute landscape and identifies areas needing attention.

**Precondition:** The user navigates to the dashboard screen.

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | Operations User | Opens the dashboard | System displays: total open disputes, count per priority level, count per recommended action, and count per payment type |
| 2 | Operations User | Reviews early warning indicators | System shows the count of disputes approaching the 7-day threshold (5–7 days old) and the 14-day threshold (12–14 days old) |
| 3 | Operations User | Identifies a cluster of critical disputes or a spike in a particular payment type | User navigates to the queue (Journey 3) with appropriate filters to investigate |

**Requirements Covered:** REQ-057, REQ-058

---

## Journey Summary

| Journey | Primary Actor | Trigger | Outcome | Requirements |
|---------|--------------|---------|---------|--------------|
| 1. Capture Dispute | Operations User | Customer complaint received | Dispute record created with case reference | REQ-001–015, REQ-053, REQ-061 |
| 2. Automatic Triage | System | Dispute created | Priority and recommended action assigned | REQ-016–036 |
| 3. Work the Queue | Operations User | User reviews workload | Dispute selected for action | REQ-037–045 |
| 4. Review Detail | Operations User | Dispute row clicked | Full understanding of triage reasoning | REQ-046–047 |
| 5. Override Recommendation | Operations User | User disagrees with system | Alternative action recorded with audit trail | REQ-048–051 |
| 6. Progress Status | Operations User | Work completed on dispute | Dispute moves through Open → Closed | REQ-052–056 |
| 7. Auto-Escalation | System | Time-based threshold crossed | Priority and/or action escalated | REQ-033–034 |
| 8. Monitor Dashboard | Operations User | Operational oversight need | Overview of dispute landscape | REQ-057–058 |

---

## Screen-to-Journey Mapping

| Screen | Journeys |
|--------|----------|
| Dashboard | Journey 8, entry to Journey 1 and Journey 3 |
| DisputeQueue | Journey 3, entry to Journey 4 |
| CaptureDispute | Journey 1 |
| DisputeDetail | Journey 4, Journey 5, Journey 6 |

---

## Requirements Coverage

All 65 requirements are covered by the user journeys:

- **Dispute Capture (REQ-001–015):** Journey 1
- **Triage Rules Engine (REQ-016–036):** Journey 2, Journey 7
- **Dispute Queue (REQ-037–045):** Journey 3
- **Dispute Detail (REQ-046–047):** Journey 4
- **Recommendation Override (REQ-048–051):** Journey 5
- **Status Management (REQ-052–056):** Journey 6
- **Dashboard (REQ-057–058):** Journey 8
- **Mock Data (REQ-059–060):** Seeding (no user journey)
- **Non-Functional (REQ-061–065):** Applicable across all journeys
