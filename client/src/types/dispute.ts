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
  description?: string;
  status: DisputeStatus;
  priority: Priority;
  ageBand: AgeBand;
  recommendedAction: RecommendedAction;
  routingQueue: RoutingQueue;
  ruleId: string;
  explanation: string;
  fraudFlag: boolean;
  age: number;
  dueDate: string;
  isOverridden: boolean;
  originalAction?: RecommendedAction;
  overrideReason?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalOpen: number;
  averageAge: number;
  overrideRate: number;
  overrideCount: number;
  earlyWarnings: { approachingSla: number; approachingEscalation: number };
  byAction: Record<RecommendedAction, number>;
  byPaymentType: Record<PaymentType, number>;
  byQueue: Record<RoutingQueue, number>;
  byPriority: Record<Priority, number>;
}
