---
inclusion: always
---

# Requirements-to-Test Traceability

## Purpose

Keep `docs/test-cases.md` aligned with `docs/requirements.md`.

## Rules

1. Every EARS requirement must have a unique ID in this format: `REQ-XXX`.
2. Every test case must include the requirement ID it verifies directly below its title.

   Example:

   ```
   ## TC-001: Create a dispute successfully
   **Covers:** REQ-001

   - GIVEN an Analyst is authenticated
   - WHEN they submit a valid dispute
   - THEN the system creates the dispute case
   - AND an audit event is recorded
   ```

3. When `docs/requirements.md` changes:
   - Read both `docs/requirements.md` and `docs/test-cases.md`.
   - Identify added, changed, or removed `REQ-XXX` requirements.
   - Add a test case for every new requirement.
   - Update tests affected by changed requirements.
   - Remove or mark obsolete tests only when the related requirement was removed.
   - Preserve valid existing test cases and their IDs.
   - Do not invent requirements that are not documented.
4. Each functional requirement must have:
   - At least one successful-path test.
   - At least one validation, error, or boundary test where relevant.
   - An authorisation test where role access applies.
   - An audit-trail test where a decision, override, assignment, or status change occurs.
5. Test cases must use this format:

   ```
   ## TC-XXX: [Test name]
   **Covers:** REQ-XXX

   - GIVEN [precondition]
   - WHEN [action]
   - THEN [expected outcome]
   - AND [additional assertion]
   ```

6. Maintain this traceability matrix at the bottom of `docs/test-cases.md`:

   ```
   ## Requirements Traceability Matrix

   | Requirement | Test cases |
   |---|---|
   | REQ-001 | TC-001, TC-002 |
   | REQ-002 | TC-003 |
   ```

7. If a requirement is ambiguous, do not guess. Add this note below the affected test:

   ```
   > Needs clarification: [state the missing business rule].
   ```
