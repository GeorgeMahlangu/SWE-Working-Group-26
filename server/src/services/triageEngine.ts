// Triage engine — orchestrates rule evaluation and age modifiers into a single
// deterministic recommendation (REQ-030, REQ-018, REQ-019, REQ-035, REQ-050–053).
// Pure: same inputs always produce the same output (REQ-054).

import {
  AGE_AGEING_DAYS,
  SLA_DAYS,
  ESCALATION_DAYS,
  FAILED_TRANSFER_HOURS,
  HIGH_VALUE_THRESHOLD,
  MEDIUM_VALUE_THRESHOLD,
  LOW_VALUE_THRESHOLD,
} from '../config/params.js';
import { TRIAGE_RULES, type RuleContext } from '../rules/triageRules.js';
import type {
  AgeBand,
  AmountBand,
  IssueCategory,
  PaymentType,
  Priority,
  RoutingQueue,
  TransactionStatus,
  TriageResult,
} from '../types/dispute.js';

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;

/** Minimal input the engine needs to triage a dispute. */
export interface TriageInput {
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  amount: number;
  transactionDate: string | Date;
}

const PRIORITY_LADDER: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/** Bump a priority one level toward CRITICAL (REQ-018). CRITICAL stays put. */
export function bumpPriority(priority: Priority): Priority {
  const i = PRIORITY_LADDER.indexOf(priority);
  return PRIORITY_LADDER[Math.min(i + 1, PRIORITY_LADDER.length - 1)];
}

/** Calendar-day age from the transaction date (REQ-010). */
export function computeAgeDays(transactionDate: string | Date, now: Date): number {
  const txn = new Date(transactionDate).getTime();
  return Math.max(0, Math.floor((now.getTime() - txn) / MS_PER_DAY));
}

/** Age in whole hours — used for the 48-hour failed-transfer rules. */
export function computeAgeHours(transactionDate: string | Date, now: Date): number {
  const txn = new Date(transactionDate).getTime();
  return Math.max(0, Math.floor((now.getTime() - txn) / MS_PER_HOUR));
}

/** Age band NEW/AGEING/BREACHED (REQ-011–013). */
export function computeAgeBand(ageDays: number): AgeBand {
  if (ageDays < AGE_AGEING_DAYS) return 'NEW';
  if (ageDays < SLA_DAYS) return 'AGEING';
  return 'BREACHED';
}

/** Routing queue; UNAUTHORISED_TRANSACTION overrides the payment-type default (REQ-025–028). */
export function assignQueue(paymentType: PaymentType, issueCategory: IssueCategory): RoutingQueue {
  if (issueCategory === 'UNAUTHORISED_TRANSACTION') return 'FRAUD_OPERATIONS';
  switch (paymentType) {
    case 'CARD':
      return 'CARD_DISPUTES';
    case 'EFT':
      return 'PAYMENTS_INVESTIGATIONS';
    case 'INTERNAL_TRANSFER':
      return 'INTERNAL_PAYMENTS_OPS';
  }
}

/** Due date = transaction date + SLA_DAYS (REQ-020). */
export function computeDueDate(transactionDate: string | Date): Date {
  const due = new Date(transactionDate);
  due.setDate(due.getDate() + SLA_DAYS);
  return due;
}

/** Amount position relative to thresholds, for decision factors (REQ-051). */
export function computeAmountBand(amount: number): AmountBand {
  if (amount >= HIGH_VALUE_THRESHOLD) return 'ABOVE_HIGH_THRESHOLD';
  if (amount >= MEDIUM_VALUE_THRESHOLD) return 'ABOVE_MEDIUM_THRESHOLD';
  if (amount >= LOW_VALUE_THRESHOLD) return 'ABOVE_LOW_THRESHOLD';
  return 'BELOW_LOW_THRESHOLD';
}

/** Base priority before rule-specific overrides and age modifiers (REQ-014–017). */
export function computeBasePriority(
  input: TriageInput,
  ageBand: AgeBand,
  ageHours: number
): Priority {
  const { amount, issueCategory } = input;
  if (amount >= HIGH_VALUE_THRESHOLD) return 'CRITICAL';
  if (issueCategory === 'UNAUTHORISED_TRANSACTION' && amount > MEDIUM_VALUE_THRESHOLD)
    return 'CRITICAL';
  if (
    issueCategory === 'UNAUTHORISED_TRANSACTION' ||
    ageBand === 'BREACHED' ||
    (issueCategory === 'FAILED_TRANSFER' && ageHours > FAILED_TRANSFER_HOURS)
  )
    return 'HIGH';
  if (amount >= LOW_VALUE_THRESHOLD || ageBand === 'AGEING') return 'MEDIUM';
  return 'LOW';
}

/** Format an amount as `R X,XXX.XX` (REQ-123) for explanation text.
 *  Explicit formatting (not locale-dependent) so output is identical across
 *  environments and matches the documented `R X,XXX.XX` convention. */
export function formatZar(amount: number): string {
  const [whole, decimals] = Math.abs(amount).toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const sign = amount < 0 ? '-' : '';
  return `${sign}R ${grouped}.${decimals}`;
}

/**
 * Evaluate a dispute against the rule set and apply age modifiers.
 * Returns the full recommendation including the ordered list of rules checked.
 */
export function evaluateTriage(input: TriageInput, now: Date = new Date()): TriageResult {
  const ageDays = computeAgeDays(input.transactionDate, now);
  const ageHours = computeAgeHours(input.transactionDate, now);
  const ageBand = computeAgeBand(ageDays);
  const queue = assignQueue(input.paymentType, input.issueCategory);
  const amountBand = computeAmountBand(input.amount);
  const basePriority = computeBasePriority(input, ageBand, ageHours);

  const ctx: RuleContext = {
    paymentType: input.paymentType,
    issueCategory: input.issueCategory,
    transactionStatus: input.transactionStatus,
    amount: input.amount,
    ageDays,
    ageHours,
    ageBand,
    amountBand,
    queue,
    basePriority,
    amountText: formatZar(input.amount),
  };

  const rulesEvaluated: string[] = [];
  let match = null as ReturnType<(typeof TRIAGE_RULES)[number]['evaluate']>;
  for (const rule of TRIAGE_RULES) {
    rulesEvaluated.push(rule.id);
    match = rule.evaluate(ctx);
    if (match) break;
  }
  // TRIAGE_RULES ends with the REQ-048 default, so a match is guaranteed.
  if (!match) throw new Error('Triage produced no match — default rule missing');

  let { action, priority } = match;

  // Age modifiers, applied after the primary match.
  if (ageDays > SLA_DAYS) priority = bumpPriority(priority); // REQ-018
  if (ageDays > ESCALATION_DAYS) action = 'ESCALATE'; // REQ-019

  const fraudFlag =
    input.paymentType === 'CARD' && input.issueCategory === 'UNAUTHORISED_TRANSACTION'; // REQ-035

  return {
    recommendedAction: action,
    priority,
    ruleId: match.ruleId,
    targetQueue: queue,
    explanation: match.explanation,
    factors: {
      issueCategory: input.issueCategory,
      transactionStatus: input.transactionStatus,
      amount: input.amount,
      amountBand,
      ageBand,
      priority,
      queue,
    },
    rulesEvaluated,
    fraudFlag,
  };
}
