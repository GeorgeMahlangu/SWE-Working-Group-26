export const ACTION_LABELS: Record<string, string> = {
  RESOLVE_NOW: 'Resolve Immediately',
  INVESTIGATE: 'Investigate Further',
  ESCALATE: 'Escalate',
  REFER: 'Refer to Another Team',
};

export const ACTION_COLORS: Record<string, string> = {
  RESOLVE_NOW: 'var(--color-status-immediate)',
  INVESTIGATE: 'var(--color-status-investigate)',
  ESCALATE:    'var(--color-status-escalate)',
  REFER:       'var(--color-status-refer)',
};

export const QUEUE_LABELS: Record<string, string> = {
  CARD_DISPUTES:            'Card Disputes',
  PAYMENTS_INVESTIGATIONS:  'Payments Investigations',
  INTERNAL_PAYMENTS_OPS:    'Internal Payments Ops',
  FRAUD_OPERATIONS:         'Fraud Operations',
};

export const ISSUE_LABELS: Record<string, string> = {
  DUPLICATE_DEBIT:         'Duplicate Debit',
  FAILED_TRANSFER:         'Failed Transfer',
  MISSING_PAYMENT:         'Missing Payment',
  UNAUTHORISED_TRANSACTION:'Unauthorised Transaction',
  INCORRECT_AMOUNT:        'Incorrect Amount',
};

export const PAYMENT_LABELS: Record<string, string> = {
  CARD:              'Card Payment',
  EFT:               'EFT',
  INTERNAL_TRANSFER: 'Internal Transfer',
};

export const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open', IN_PROGRESS: 'In Progress', RESOLVED: 'Resolved', CLOSED: 'Closed',
};

export function formatAmount(amount: number): string {
  return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2,'0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${formatDate(d.toISOString().slice(0,10))} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
