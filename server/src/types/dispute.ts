// Shared domain types for the Payment Dispute Triage server.
// Enum values are the exact UPPERCASE tokens from docs/requirements.md v4.0.
// Kept aligned with client/src/types/dispute.ts and docs/api-spec.md.

export type PaymentType = 'CARD' | 'EFT' | 'INTERNAL_TRANSFER';

export type IssueCategory =
  | 'DUPLICATE_DEBIT'
  | 'FAILED_TRANSFER'
  | 'MISSING_PAYMENT'
  | 'UNAUTHORISED_TRANSACTION'
  | 'INCORRECT_AMOUNT';

export type TransactionStatus = 'SETTLED' | 'PENDING' | 'FAILED' | 'REVERSED';

export type RecommendedAction = 'RESOLVE_NOW' | 'INVESTIGATE' | 'ESCALATE' | 'REFER';

export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type AgeBand = 'NEW' | 'AGEING' | 'BREACHED';

export type DisputeStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type RoutingQueue =
  | 'CARD_DISPUTES'
  | 'PAYMENTS_INVESTIGATIONS'
  | 'INTERNAL_PAYMENTS_OPS'
  | 'FRAUD_OPERATIONS';

/** Relative position of the amount against the configured thresholds (REQ-051). */
export type AmountBand =
  | 'BELOW_LOW_THRESHOLD'
  | 'ABOVE_LOW_THRESHOLD'
  | 'ABOVE_MEDIUM_THRESHOLD'
  | 'ABOVE_HIGH_THRESHOLD';

/** Enumerations grouped for runtime validation and the /api/enums endpoint. */
export const ENUMS = {
  paymentType: ['CARD', 'EFT', 'INTERNAL_TRANSFER'] as const,
  issueCategory: [
    'DUPLICATE_DEBIT',
    'FAILED_TRANSFER',
    'MISSING_PAYMENT',
    'UNAUTHORISED_TRANSACTION',
    'INCORRECT_AMOUNT',
  ] as const,
  transactionStatus: ['SETTLED', 'PENDING', 'FAILED', 'REVERSED'] as const,
  recommendedAction: ['RESOLVE_NOW', 'INVESTIGATE', 'ESCALATE', 'REFER'] as const,
  priority: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const,
  ageBand: ['NEW', 'AGEING', 'BREACHED'] as const,
  disputeStatus: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const,
  routingQueue: [
    'CARD_DISPUTES',
    'PAYMENTS_INVESTIGATIONS',
    'INTERNAL_PAYMENTS_OPS',
    'FRAUD_OPERATIONS',
  ] as const,
} as const;

/** Raw payload accepted by POST /api/disputes (REQ-001, REQ-003–008). */
export interface CreateDisputeInput {
  customerName: string;
  accountNumber: string;
  transactionRef: string;
  amount: number;
  transactionDate: string; // ISO date YYYY-MM-DD
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  description?: string;
}

/** Decision factors returned with every recommendation (REQ-051). */
export interface DecisionFactors {
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  amount: number;
  amountBand: AmountBand;
  ageBand: AgeBand;
  priority: Priority;
  queue: RoutingQueue;
}

/** Output of the triage engine for a dispute (REQ-030–053). */
export interface TriageResult {
  recommendedAction: RecommendedAction;
  priority: Priority;
  ruleId: string;
  targetQueue: RoutingQueue;
  explanation: string;
  factors: DecisionFactors;
  rulesEvaluated: string[];
  fraudFlag: boolean;
}

/** A single status transition in the audit log (REQ-084). */
export interface StatusTransitionRecord {
  from: DisputeStatus | null;
  to: DisputeStatus;
  timestamp: string;
  operatorId: string;
  note: string | null;
}

/** Full dispute domain object as returned by the API (docs/api-spec.md). */
export interface Dispute {
  id: string;
  caseReference: string;
  customerName: string;
  accountNumber: string;
  transactionRef: string;
  amount: number;
  transactionDate: string;
  paymentType: PaymentType;
  issueCategory: IssueCategory;
  transactionStatus: TransactionStatus;
  description?: string | null;
  status: DisputeStatus;
  priority: Priority;
  ageBand: AgeBand;
  recommendedAction: RecommendedAction;
  routingQueue: RoutingQueue;
  ruleId: string;
  explanation: string;
  decisionFactors: DecisionFactors;
  rulesEvaluated: string[];
  fraudFlag: boolean;
  age: number;
  dueDate: string;
  isOverridden: boolean;
  originalAction?: RecommendedAction | null;
  originalPriority?: Priority | null;
  overrideReason?: string | null;
  overriddenAt?: string | null;
  overriddenBy?: string | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Structured error body returned by the API ({ error, field? }). */
export interface ApiError {
  error: string;
  field?: string;
}
