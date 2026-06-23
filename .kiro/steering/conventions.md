# Coding Conventions — Payment Dispute Triage

## General

- **Language:** TypeScript strict mode throughout — no `any`, no implicit returns
- **Modules:** ES Modules (`import`/`export`) — no CommonJS `require()`
- **Formatting:** Prettier with project `.prettierrc.json` — run `npm run format`
- **Linting:** ESLint flat config — run `npm run lint:fix` before committing

---

## Naming

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `triage-engine.ts` |
| Components | PascalCase | `PriorityBadge.tsx` |
| Functions | camelCase | `evaluateTriageRules()` |
| Constants | UPPER_SNAKE_CASE | `HIGH_VALUE_THRESHOLD` |
| Types/Interfaces | PascalCase | `DisputeRecord` |
| Enums | UPPER_SNAKE_CASE values | `RESOLVE_NOW`, `CARD` |

---

## Enumerations (use exact values — no aliases)

```ts
type PaymentType = 'CARD' | 'EFT' | 'INTERNAL_TRANSFER'
type IssueCategory = 'DUPLICATE_DEBIT' | 'FAILED_TRANSFER' | 'MISSING_PAYMENT' | 'UNAUTHORISED_TRANSACTION' | 'INCORRECT_AMOUNT'
type TransactionStatus = 'SETTLED' | 'PENDING' | 'FAILED' | 'REVERSED'
type RecommendedAction = 'RESOLVE_NOW' | 'INVESTIGATE' | 'ESCALATE' | 'REFER'
type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
type AgeBand = 'NEW' | 'AGEING' | 'BREACHED'
type DisputeStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
type RoutingQueue = 'CARD_DISPUTES' | 'PAYMENTS_INVESTIGATIONS' | 'INTERNAL_PAYMENTS_OPS' | 'FRAUD_OPERATIONS'
```

---

## Business Parameters (never hard-code thresholds)

```ts
const HIGH_VALUE_THRESHOLD = 50_000
const MEDIUM_VALUE_THRESHOLD = 5_000
const LOW_VALUE_THRESHOLD = 1_000
const INCORRECT_AMOUNT_THRESHOLD = 10_000
const AGE_AGEING_DAYS = 2
const SLA_DAYS = 7
const ESCALATION_DAYS = 14
const FAILED_TRANSFER_HOURS = 48
```

---

## Backend Conventions

- **Route handlers** are thin — delegate all logic to services
- **Services** contain business logic — no Express `req`/`res` in services
- **Triage rules** live in `server/src/rules/triageRules.ts` — one function per rule
- **Error responses** always return `{ error: string, field?: string }`
- **Validation** happens on both client and server — never trust client-only validation
- **Prisma** queries go in `disputeService.ts`, never directly in route handlers

---

## Frontend Conventions

- **Pages** in `client/src/pages/` — one file per screen, no business logic
- **Components** in `client/src/components/` — presentational, receive all data via props
- **Hooks** in `client/src/hooks/` — all data fetching via custom hooks, no `fetch()` in components
- **Design system** — all visual decisions from `.kiro/skills/ui-design.md`. Invoke with `#ui-design` before generating any UI component
- **Colors** — CSS custom properties only (`var(--color-accent)` etc.), never Tailwind semantic shortcuts (`bg-blue-500`). Tokens defined in `client/src/index.css` under `:root`
- **Theme** — light theme. Page background `#F5F7FA`, surfaces `#FFFFFF`, top bar `#0033A0`
- **Fonts** — `font-display` (Inter) for all UI text; `font-data` (JetBrains Mono) for amounts, IDs, dates, references, counters
- **Action and priority badges** — pill style with `border-radius: 4px`, colored text (`--color-status-*`) and matching tinted background (`--color-status-*-bg`). Every table row also has a `3px solid` left border in its action color
- **No box shadows** — borders only for separation. Max `border-radius: 4px`
- **Amounts** always formatted as `R X,XXX.XX` using a shared `formatAmount()` utility
- **Dates** always formatted as `DD MMM YYYY` using a shared `formatDate()` utility
- **Action display labels** — always map API enum to display label: `RESOLVE_NOW`→"Resolve Immediately", `INVESTIGATE`→"Investigate Further", `ESCALATE`→"Escalate", `REFER`→"Refer to Another Team"
- **ARIA labels** on every interactive element — required for REQ-126
- **Loading states** — `LoadingBar` (2px bar) only; no spinners, no skeleton screens

---

## Testing

- **Unit tests** use Vitest — files in `server/tests/` and `client/tests/`
- **E2E tests** use Playwright — files in `client/e2e/`
- **Test naming:** `describe('triageEngine') > it('should ESCALATE when amount > HIGH_VALUE_THRESHOLD')`
- **Test data** uses the enumeration values exactly — no display strings in test assertions
- **Coverage target:** 100% of triage rules (REQ-030 to REQ-048) must have unit tests

---

## Git

- Commit messages: `feat:`, `fix:`, `test:`, `docs:`, `refactor:` prefixes
- Never commit `.env` files or real customer data
- Branch from `main` for each feature, PR back to `main`
