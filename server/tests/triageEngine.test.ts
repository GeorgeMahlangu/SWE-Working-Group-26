import { describe, it, expect } from 'vitest';
import {
  evaluateTriage,
  bumpPriority,
  computeAgeDays,
  computeAgeBand,
  assignQueue,
  computeDueDate,
  computeBasePriority,
  type TriageInput,
} from '../src/services/triageEngine.js';
import { TRIAGE_RULES, type RuleContext } from '../src/rules/triageRules.js';

// Fixed reference time so every age is deterministic.
const NOW = new Date('2026-06-22T12:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const hoursAgo = (n: number) => new Date(NOW.getTime() - n * 3_600_000);

const base = (over: Partial<TriageInput>): TriageInput => ({
  paymentType: 'EFT',
  issueCategory: 'DUPLICATE_DEBIT',
  transactionStatus: 'SETTLED',
  amount: 5000,
  transactionDate: daysAgo(0),
  ...over,
});

describe('triageEngine — helpers', () => {
  it('computes calendar-day age', () => {
    expect(computeAgeDays(daysAgo(3), NOW)).toBe(3);
    expect(computeAgeDays(NOW, NOW)).toBe(0);
  });

  it('bands age as NEW / AGEING / BREACHED (REQ-011–013)', () => {
    expect(computeAgeBand(1)).toBe('NEW');
    expect(computeAgeBand(2)).toBe('AGEING');
    expect(computeAgeBand(6)).toBe('AGEING');
    expect(computeAgeBand(7)).toBe('BREACHED');
  });

  it('assigns queues, with UNAUTHORISED overriding payment type (REQ-025–028)', () => {
    expect(assignQueue('CARD', 'DUPLICATE_DEBIT')).toBe('CARD_DISPUTES');
    expect(assignQueue('EFT', 'DUPLICATE_DEBIT')).toBe('PAYMENTS_INVESTIGATIONS');
    expect(assignQueue('INTERNAL_TRANSFER', 'DUPLICATE_DEBIT')).toBe('INTERNAL_PAYMENTS_OPS');
    expect(assignQueue('CARD', 'UNAUTHORISED_TRANSACTION')).toBe('FRAUD_OPERATIONS');
  });

  it('computes due date as transactionDate + 7 days (REQ-020)', () => {
    const due = computeDueDate('2026-06-01');
    expect(due.toISOString().slice(0, 10)).toBe('2026-06-08');
  });

  it('bumps priority one level, CRITICAL is terminal (REQ-018)', () => {
    expect(bumpPriority('LOW')).toBe('MEDIUM');
    expect(bumpPriority('MEDIUM')).toBe('HIGH');
    expect(bumpPriority('HIGH')).toBe('CRITICAL');
    expect(bumpPriority('CRITICAL')).toBe('CRITICAL');
  });

  it('derives base priority (REQ-014–017)', () => {
    expect(computeBasePriority(base({ amount: 60000 }), 'NEW', 0)).toBe('CRITICAL');
    expect(computeBasePriority(base({ amount: 2000 }), 'NEW', 0)).toBe('MEDIUM');
    expect(computeBasePriority(base({ amount: 500 }), 'NEW', 0)).toBe('LOW');
    expect(computeBasePriority(base({ amount: 500 }), 'AGEING', 0)).toBe('MEDIUM');
  });
});

describe('triageEngine — rule precedence (REQ-031–048)', () => {
  it('REQ-031: forces ESCALATE past the 14-day threshold', () => {
    const r = evaluateTriage(base({ transactionDate: daysAgo(15) }), NOW);
    expect(r.ruleId).toBe('REQ-031');
    expect(r.recommendedAction).toBe('ESCALATE');
  });

  it('REQ-032: high-value transaction → CRITICAL / ESCALATE', () => {
    const r = evaluateTriage(base({ amount: 60000 }), NOW);
    expect(r.ruleId).toBe('REQ-032');
    expect(r.recommendedAction).toBe('ESCALATE');
    expect(r.priority).toBe('CRITICAL');
  });

  it('REQ-033: unauthorised above R5,000 → CRITICAL / ESCALATE to Fraud Ops', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'UNAUTHORISED_TRANSACTION', amount: 8000, paymentType: 'EFT' }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-033');
    expect(r.recommendedAction).toBe('ESCALATE');
    expect(r.priority).toBe('CRITICAL');
    expect(r.targetQueue).toBe('FRAUD_OPERATIONS');
  });

  it('REQ-034: unauthorised at or below R5,000 → HIGH / INVESTIGATE to Fraud Ops', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'UNAUTHORISED_TRANSACTION', amount: 3000, paymentType: 'EFT' }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-034');
    expect(r.recommendedAction).toBe('INVESTIGATE');
    expect(r.priority).toBe('HIGH');
    expect(r.targetQueue).toBe('FRAUD_OPERATIONS');
  });

  it('REQ-035: CARD + UNAUTHORISED sets the fraud flag (in addition to the action)', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'UNAUTHORISED_TRANSACTION', amount: 8000, paymentType: 'CARD' }),
      NOW
    );
    expect(r.fraudFlag).toBe(true);
    expect(r.ruleId).toBe('REQ-033');
  });

  it('does not set the fraud flag for non-card unauthorised disputes', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'UNAUTHORISED_TRANSACTION', amount: 8000, paymentType: 'EFT' }),
      NOW
    );
    expect(r.fraudFlag).toBe(false);
  });

  it('REQ-036: SLA breach (7 days) → ESCALATE / HIGH', () => {
    const r = evaluateTriage(base({ transactionDate: daysAgo(7), amount: 5000 }), NOW);
    expect(r.ruleId).toBe('REQ-036');
    expect(r.recommendedAction).toBe('ESCALATE');
    expect(r.priority).toBe('HIGH');
  });

  it('REQ-037: pending settlement → INVESTIGATE', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'MISSING_PAYMENT', transactionStatus: 'PENDING', amount: 2000 }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-037');
    expect(r.recommendedAction).toBe('INVESTIGATE');
    expect(r.priority).toBe('MEDIUM');
  });

  it('REQ-038: settled low-value duplicate debit → RESOLVE_NOW / MEDIUM', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'DUPLICATE_DEBIT', transactionStatus: 'SETTLED', amount: 500 }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-038');
    expect(r.recommendedAction).toBe('RESOLVE_NOW');
    expect(r.priority).toBe('MEDIUM');
  });

  it('REQ-040: failed transfer older than 48h → ESCALATE / HIGH', () => {
    const r = evaluateTriage(
      base({
        issueCategory: 'FAILED_TRANSFER',
        transactionStatus: 'FAILED',
        transactionDate: hoursAgo(72),
        amount: 2000,
      }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-040');
    expect(r.recommendedAction).toBe('ESCALATE');
    expect(r.priority).toBe('HIGH');
  });

  it('REQ-041: failed transfer within 48h → INVESTIGATE / MEDIUM (boundary at exactly 48h)', () => {
    const r = evaluateTriage(
      base({
        issueCategory: 'FAILED_TRANSFER',
        transactionStatus: 'FAILED',
        transactionDate: hoursAgo(48),
        amount: 2000,
      }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-041');
    expect(r.recommendedAction).toBe('INVESTIGATE');
    expect(r.priority).toBe('MEDIUM');
  });

  it('REQ-042: incorrect amount above R10,000 → ESCALATE / HIGH', () => {
    const r = evaluateTriage(base({ issueCategory: 'INCORRECT_AMOUNT', amount: 15000 }), NOW);
    expect(r.ruleId).toBe('REQ-042');
    expect(r.recommendedAction).toBe('ESCALATE');
    expect(r.priority).toBe('HIGH');
  });

  it('REQ-043: incorrect amount at or below R10,000 → INVESTIGATE / MEDIUM', () => {
    const r = evaluateTriage(base({ issueCategory: 'INCORRECT_AMOUNT', amount: 5000 }), NOW);
    expect(r.ruleId).toBe('REQ-043');
    expect(r.recommendedAction).toBe('INVESTIGATE');
    expect(r.priority).toBe('MEDIUM');
  });

  it('REQ-044: missing payment on CARD → REFER / HIGH to Card Disputes', () => {
    const r = evaluateTriage(base({ issueCategory: 'MISSING_PAYMENT', paymentType: 'CARD' }), NOW);
    expect(r.ruleId).toBe('REQ-044');
    expect(r.recommendedAction).toBe('REFER');
    expect(r.priority).toBe('HIGH');
    expect(r.targetQueue).toBe('CARD_DISPUTES');
  });

  it('REQ-045: missing payment on EFT → INVESTIGATE / MEDIUM', () => {
    const r = evaluateTriage(base({ issueCategory: 'MISSING_PAYMENT', paymentType: 'EFT' }), NOW);
    expect(r.ruleId).toBe('REQ-045');
    expect(r.recommendedAction).toBe('INVESTIGATE');
    expect(r.priority).toBe('MEDIUM');
    expect(r.targetQueue).toBe('PAYMENTS_INVESTIGATIONS');
  });

  it('REQ-046: missing payment on INTERNAL_TRANSFER → INVESTIGATE / LOW', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'MISSING_PAYMENT', paymentType: 'INTERNAL_TRANSFER' }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-046');
    expect(r.recommendedAction).toBe('INVESTIGATE');
    expect(r.priority).toBe('LOW');
    expect(r.targetQueue).toBe('INTERNAL_PAYMENTS_OPS');
  });

  it('REQ-047: card catch-all → REFER to Card Disputes', () => {
    const r = evaluateTriage(
      base({ paymentType: 'CARD', issueCategory: 'DUPLICATE_DEBIT', amount: 5000 }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-047');
    expect(r.recommendedAction).toBe('REFER');
    expect(r.targetQueue).toBe('CARD_DISPUTES');
  });

  it('REQ-048: default → INVESTIGATE when nothing else matches', () => {
    const r = evaluateTriage(
      base({ paymentType: 'EFT', issueCategory: 'DUPLICATE_DEBIT', amount: 5000 }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-048');
    expect(r.recommendedAction).toBe('INVESTIGATE');
  });
});

describe('triageEngine — REQ-039 (pending duplicate debit)', () => {
  // NOTE: in the documented precedence, REQ-037 (pending settlement, #6) is
  // evaluated before REQ-039 (#8), so through the engine a pending duplicate
  // debit matches REQ-037. We assert that current behaviour AND unit-test the
  // REQ-039 rule in isolation so its logic is still covered.
  it('through the engine, a pending duplicate debit resolves to REQ-037', () => {
    const r = evaluateTriage(
      base({ issueCategory: 'DUPLICATE_DEBIT', transactionStatus: 'PENDING', amount: 2000 }),
      NOW
    );
    expect(r.ruleId).toBe('REQ-037');
  });

  it('the REQ-039 rule itself matches a pending duplicate debit → INVESTIGATE / LOW', () => {
    const rule = TRIAGE_RULES.find((x) => x.id === 'REQ-039');
    expect(rule).toBeDefined();
    const ctx: RuleContext = {
      paymentType: 'EFT',
      issueCategory: 'DUPLICATE_DEBIT',
      transactionStatus: 'PENDING',
      amount: 2000,
      ageDays: 0,
      ageHours: 0,
      ageBand: 'NEW',
      amountBand: 'ABOVE_LOW_THRESHOLD',
      queue: 'PAYMENTS_INVESTIGATIONS',
      basePriority: 'MEDIUM',
      amountText: 'R 2,000.00',
    };
    const m = rule!.evaluate(ctx);
    expect(m?.action).toBe('INVESTIGATE');
    expect(m?.priority).toBe('LOW');
  });
});

describe('triageEngine — age modifiers (REQ-018, REQ-019)', () => {
  it('REQ-018: bumps priority one level past 7 days', () => {
    // 8-day-old breached dispute → REQ-036 (HIGH) then bumped to CRITICAL.
    const r = evaluateTriage(base({ transactionDate: daysAgo(8), amount: 5000 }), NOW);
    expect(r.ruleId).toBe('REQ-036');
    expect(r.priority).toBe('CRITICAL');
  });

  it('REQ-019: forces ESCALATE past 14 days regardless of category', () => {
    const r = evaluateTriage(
      base({
        issueCategory: 'DUPLICATE_DEBIT',
        transactionStatus: 'SETTLED',
        amount: 500,
        transactionDate: daysAgo(20),
      }),
      NOW
    );
    expect(r.recommendedAction).toBe('ESCALATE');
  });
});

describe('triageEngine — determinism & metadata (REQ-050–054)', () => {
  it('produces identical results for identical inputs (REQ-054)', () => {
    const input = base({ issueCategory: 'INCORRECT_AMOUNT', amount: 15000 });
    expect(evaluateTriage(input, NOW)).toEqual(evaluateTriage(input, NOW));
  });

  it('returns ruleId, explanation, factors and the ordered list of rules evaluated', () => {
    const r = evaluateTriage(base({ amount: 60000 }), NOW);
    expect(r.ruleId).toBe('REQ-032');
    expect(r.explanation).toContain('R 60,000.00');
    expect(r.explanation).not.toMatch(/REQ-\d/); // no rule IDs in user-facing text
    expect(r.factors.amountBand).toBe('ABOVE_HIGH_THRESHOLD');
    expect(r.rulesEvaluated).toEqual(['REQ-031', 'REQ-032']);
  });
});
