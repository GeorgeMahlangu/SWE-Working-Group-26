// Tunable business parameters for the triage engine.
// Single source of truth — never hard-code these values elsewhere.
// Traces: docs/requirements.md v4.0 (Tunable Business Parameters),
// .kiro/steering/rules.md.

/** At or above this amount (ZAR), a dispute is Critical regardless of category. */
export const HIGH_VALUE_THRESHOLD = 50_000;

/** At or above this amount (ZAR), unauthorised transactions escalate. */
export const MEDIUM_VALUE_THRESHOLD = 5_000;

/** Below this amount (ZAR), clear-cut cases may auto-resolve. */
export const LOW_VALUE_THRESHOLD = 1_000;

/** Difference threshold (ZAR) for incorrect-amount escalation. */
export const INCORRECT_AMOUNT_THRESHOLD = 10_000;

/** Days open before a dispute becomes AGEING. */
export const AGE_AGEING_DAYS = 2;

/** Days open before priority is bumped one level (also the SLA / due-date window). */
export const SLA_DAYS = 7;

/** Days open before the recommended action is forced to ESCALATE. */
export const ESCALATION_DAYS = 14;

/** Hours after which a failed transfer becomes High priority. */
export const FAILED_TRANSFER_HOURS = 48;

/** Grouped export for convenience and testing. */
export const PARAMS = {
  HIGH_VALUE_THRESHOLD,
  MEDIUM_VALUE_THRESHOLD,
  LOW_VALUE_THRESHOLD,
  INCORRECT_AMOUNT_THRESHOLD,
  AGE_AGEING_DAYS,
  SLA_DAYS,
  ESCALATION_DAYS,
  FAILED_TRANSFER_HOURS,
} as const;
