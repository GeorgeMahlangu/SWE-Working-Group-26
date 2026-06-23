// Declarative triage rules — one entry per business rule, evaluated top-to-bottom
// with first-match-wins (REQ-030). Pure: no I/O, no side effects.
// Traces: docs/requirements.md v4.0 (REQ-031–048), .kiro/steering/rules.md.

import {
  HIGH_VALUE_THRESHOLD,
  MEDIUM_VALUE_THRESHOLD,
  LOW_VALUE_THRESHOLD,
  INCORRECT_AMOUNT_THRESHOLD,
  ESCALATION_DAYS,
  FAILED_TRANSFER_HOURS,
} from '../config/params.js';
import type {
  AgeBand,
  AmountBand,
  IssueCategory,
  PaymentType,
  Priority,
  RecommendedAction,
  RoutingQueue,
  TransactionStatus,
} from '../types/dispute.js';

/** Everything a rule needs to decide, precomputed by the engine. */
export interface RuleContext {
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  amount: number;
  ageDays: number;
  ageHours: number;
  ageBand: AgeBand;
  amountBand: AmountBand;
  queue: RoutingQueue;
  basePriority: Priority;
  /** Amount formatted as `R X,XXX.XX` for explanations. */
  amountText: string;
}

/** What a matched rule produces (before age modifiers are applied). */
export interface RuleMatch {
  ruleId: string;
  action: RecommendedAction;
  priority: Priority;
  explanation: string;
}

export interface TriageRule {
  id: string;
  evaluate(ctx: RuleContext): RuleMatch | null;
}

/**
 * Ordered rule list. The engine walks this array and stops at the first rule
 * whose `evaluate` returns a match. Order IS the precedence (REQ-030).
 */
export const TRIAGE_RULES: TriageRule[] = [
  // 1 — REQ-031 Forced escalation by age
  {
    id: 'REQ-031',
    evaluate: (c) =>
      c.ageDays > ESCALATION_DAYS
        ? {
            ruleId: 'REQ-031',
            action: 'ESCALATE',
            priority: c.basePriority,
            explanation: `Dispute has been open for ${c.ageDays} days, exceeding the 14-day escalation threshold. Action escalated.`,
          }
        : null,
  },

  // 2 — REQ-032 High-value transaction
  {
    id: 'REQ-032',
    evaluate: (c) =>
      c.amount >= HIGH_VALUE_THRESHOLD
        ? {
            ruleId: 'REQ-032',
            action: 'ESCALATE',
            priority: 'CRITICAL',
            explanation: `Transaction amount of ${c.amountText} meets or exceeds the R50,000 high-value threshold. Critical priority assigned with an Escalate action.`,
          }
        : null,
  },

  // 3 — REQ-033 Unauthorised transaction (high value)
  {
    id: 'REQ-033',
    evaluate: (c) =>
      c.issueCategory === 'UNAUTHORISED_TRANSACTION' && c.amount > MEDIUM_VALUE_THRESHOLD
        ? {
            ruleId: 'REQ-033',
            action: 'ESCALATE',
            priority: 'CRITICAL',
            explanation: `Unauthorised transaction of ${c.amountText} exceeds the R5,000 threshold. Critical priority assigned and escalated to Fraud Operations.`,
          }
        : null,
  },

  // 4 — REQ-034 Unauthorised transaction (low value)
  {
    id: 'REQ-034',
    evaluate: (c) =>
      c.issueCategory === 'UNAUTHORISED_TRANSACTION' && c.amount <= MEDIUM_VALUE_THRESHOLD
        ? {
            ruleId: 'REQ-034',
            action: 'INVESTIGATE',
            priority: 'HIGH',
            explanation: `Unauthorised transaction of ${c.amountText} is at or below the R5,000 threshold. High priority assigned and routed to Fraud Operations for investigation.`,
          }
        : null,
  },

  // 5 — REQ-036 SLA breach escalation
  {
    id: 'REQ-036',
    evaluate: (c) =>
      c.ageBand === 'BREACHED'
        ? {
            ruleId: 'REQ-036',
            action: 'ESCALATE',
            priority: 'HIGH',
            explanation: `Dispute has been open for ${c.ageDays} days, breaching the 7-day service-level threshold. Escalated to ensure timely resolution.`,
          }
        : null,
  },

  // 6 — REQ-037 Pending settlement
  {
    id: 'REQ-037',
    evaluate: (c) =>
      c.transactionStatus === 'PENDING'
        ? {
            ruleId: 'REQ-037',
            action: 'INVESTIGATE',
            priority: c.basePriority,
            explanation: `Transaction has not yet settled. Recommended to investigate once settlement is confirmed.`,
          }
        : null,
  },

  // 7 — REQ-038 Duplicate debit (settled, low value)
  {
    id: 'REQ-038',
    evaluate: (c) =>
      c.issueCategory === 'DUPLICATE_DEBIT' &&
      c.transactionStatus === 'SETTLED' &&
      c.amount < LOW_VALUE_THRESHOLD
        ? {
            ruleId: 'REQ-038',
            action: 'RESOLVE_NOW',
            priority: 'MEDIUM',
            explanation: `Low-value duplicate debit on a settled transaction. Amount of ${c.amountText} is below the R1,000 threshold. Recommended to reverse immediately.`,
          }
        : null,
  },

  // 8 — REQ-039 Duplicate debit (pending)
  {
    id: 'REQ-039',
    evaluate: (c) =>
      c.issueCategory === 'DUPLICATE_DEBIT' && c.transactionStatus === 'PENDING'
        ? {
            ruleId: 'REQ-039',
            action: 'INVESTIGATE',
            priority: 'LOW',
            explanation: `Duplicate debit dispute with the transaction still pending. Recommended to investigate once the transaction status is confirmed.`,
          }
        : null,
  },

  // 9 — REQ-040 Failed transfer (older than 48 hours)
  {
    id: 'REQ-040',
    evaluate: (c) =>
      c.issueCategory === 'FAILED_TRANSFER' &&
      c.transactionStatus === 'FAILED' &&
      c.ageHours > FAILED_TRANSFER_HOURS
        ? {
            ruleId: 'REQ-040',
            action: 'ESCALATE',
            priority: 'HIGH',
            explanation: `Failed transfer is ${c.ageDays} days old, exceeding the 48-hour threshold. High priority assigned and escalated for resolution.`,
          }
        : null,
  },

  // 10 — REQ-041 Failed transfer (within 48 hours)
  {
    id: 'REQ-041',
    evaluate: (c) =>
      c.issueCategory === 'FAILED_TRANSFER' &&
      c.transactionStatus === 'FAILED' &&
      c.ageHours <= FAILED_TRANSFER_HOURS
        ? {
            ruleId: 'REQ-041',
            action: 'INVESTIGATE',
            priority: 'MEDIUM',
            explanation: `Failed transfer is within the 48-hour window. Medium priority assigned. Recommended to investigate and retry.`,
          }
        : null,
  },

  // 11 — REQ-042 Incorrect amount (high)
  {
    id: 'REQ-042',
    evaluate: (c) =>
      c.issueCategory === 'INCORRECT_AMOUNT' && c.amount > INCORRECT_AMOUNT_THRESHOLD
        ? {
            ruleId: 'REQ-042',
            action: 'ESCALATE',
            priority: 'HIGH',
            explanation: `Incorrect amount dispute of ${c.amountText} exceeds the R10,000 threshold. High priority assigned and escalated for resolution.`,
          }
        : null,
  },

  // 12 — REQ-043 Incorrect amount (low)
  {
    id: 'REQ-043',
    evaluate: (c) =>
      c.issueCategory === 'INCORRECT_AMOUNT' && c.amount <= INCORRECT_AMOUNT_THRESHOLD
        ? {
            ruleId: 'REQ-043',
            action: 'INVESTIGATE',
            priority: 'MEDIUM',
            explanation: `Incorrect amount dispute of ${c.amountText} is at or below the R10,000 threshold. Medium priority assigned. Recommended to investigate.`,
          }
        : null,
  },

  // 13 — REQ-044 Missing payment (Card)
  {
    id: 'REQ-044',
    evaluate: (c) =>
      c.issueCategory === 'MISSING_PAYMENT' && c.paymentType === 'CARD'
        ? {
            ruleId: 'REQ-044',
            action: 'REFER',
            priority: 'HIGH',
            explanation: `Missing payment on a card transaction. High priority assigned and referred to the Card Disputes team.`,
          }
        : null,
  },

  // 14 — REQ-045 Missing payment (EFT)
  {
    id: 'REQ-045',
    evaluate: (c) =>
      c.issueCategory === 'MISSING_PAYMENT' && c.paymentType === 'EFT'
        ? {
            ruleId: 'REQ-045',
            action: 'INVESTIGATE',
            priority: 'MEDIUM',
            explanation: `Missing payment on an EFT transaction. Medium priority assigned. Recommended to investigate with the payments team.`,
          }
        : null,
  },

  // 15 — REQ-046 Missing payment (Internal Transfer)
  {
    id: 'REQ-046',
    evaluate: (c) =>
      c.issueCategory === 'MISSING_PAYMENT' && c.paymentType === 'INTERNAL_TRANSFER'
        ? {
            ruleId: 'REQ-046',
            action: 'INVESTIGATE',
            priority: 'LOW',
            explanation: `Missing payment on an internal transfer. Low priority assigned. Recommended to investigate with Internal Payments Operations.`,
          }
        : null,
  },

  // 16 — REQ-047 Card dispute routing (catch-all)
  {
    id: 'REQ-047',
    evaluate: (c) =>
      c.paymentType === 'CARD' &&
      c.issueCategory !== 'UNAUTHORISED_TRANSACTION' &&
      c.issueCategory !== 'MISSING_PAYMENT'
        ? {
            ruleId: 'REQ-047',
            action: 'REFER',
            priority: c.basePriority,
            explanation: `Card payment dispute. Referred to the Card Disputes team for specialist handling.`,
          }
        : null,
  },

  // 17 — REQ-048 Default
  {
    id: 'REQ-048',
    evaluate: (c) => ({
      ruleId: 'REQ-048',
      action: 'INVESTIGATE',
      priority: c.basePriority,
      explanation: `No specific triage rule matched. Recommended to investigate the dispute.`,
    }),
  },
];
