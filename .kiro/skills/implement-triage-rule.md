---
name: implement-triage-rule
description: Step-by-step guide for adding or modifying a triage rule in the rules engine
inclusion: manual
---

# Skill: Implement a Triage Rule

Use this skill when adding a new triage rule or modifying an existing one in `triageRules.ts`.

## Checklist

### 1. Update the rule in `server/src/rules/triageRules.ts`
- Each rule is a function: `function evaluateRuleXXX(dispute: DisputeInput): RuleResult | null`
- Return `null` if the rule does not match
- Return `{ action, priority, ruleId, explanation, targetQueue? }` if it matches
- Never hard-code thresholds — import from `BUSINESS_PARAMS`
- Follow the precedence order in REQ-030 exactly

### 2. Update `server/src/services/triageEngine.ts`
- Rules are evaluated in order — insert the new rule at the correct position
- The engine calls each rule and returns the first non-null result

### 3. Update `server/src/types/dispute.ts`
- If the new rule produces a new field, add it to the `TriageResult` interface

### 4. Add a unit test in `server/tests/triageEngine.test.ts`
- One test per rule (happy path)
- One test for each boundary condition (at threshold, above, below)
- Use the exact enumeration values — no display strings

### 5. Update `docs/requirements.md`
- Add the new requirement in the Triage Decision Engine section
- Assign the next available REQ-0XX number
- Follow EARS format: "When [condition], the system shall [action]"

### 6. Update `docs/test-cases.md`
- Add a corresponding TC-XXX for each new requirement
- Trace it to the requirement: `**Traces:** REQ-0XX`

### 7. Verify steering alignment
- Check `rules.md` has the new rule with correct thresholds
- Check `structure.md` data model if a new field was added

## Rule Template

```ts
function evaluateRule_NAME(dispute: DisputeInput): RuleResult | null {
  // Guard: only apply if conditions are met
  if (dispute.issueCategory !== 'CATEGORY') return null

  return {
    action: 'ESCALATE',
    priority: 'HIGH',
    ruleId: 'REQ-0XX',
    explanation: 'Plain English reason using business terms.',
    targetQueue: 'QUEUE_NAME', // only for ESCALATE or REFER
  }
}
```
