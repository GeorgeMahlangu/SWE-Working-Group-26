---
name: add-ui-component
description: Step-by-step guide for adding a new React component or page to the client
inclusion: manual
---

# Skill: Add a UI Component or Page

Use this skill when creating a new component in `client/src/components/` or page in `client/src/pages/`.

## Component Checklist

### 1. Create the file
- Components: `client/src/components/ComponentName.tsx` (PascalCase)
- Pages: `client/src/pages/PageName.tsx` (PascalCase)
- Pages contain routing and layout — no business logic
- Components are presentational — receive all data via props

### 2. TypeScript — no `any`
- Define a `Props` interface for every component
- Use the shared types from `client/src/types/dispute.ts`
- Use the exact enumeration strings from conventions.md

### 3. Tailwind CSS colour conventions
- `CRITICAL` → red (`bg-red-100 text-red-800 border-red-300`)
- `HIGH` → orange (`bg-orange-100 text-orange-800 border-orange-300`)
- `MEDIUM` → amber (`bg-amber-100 text-amber-800 border-amber-300`)
- `LOW` → green (`bg-green-100 text-green-800 border-green-300`)
- `NEW` age band → neutral (`bg-gray-100 text-gray-600`)
- `AGEING` age band → warning (`bg-yellow-100 text-yellow-700`)
- `BREACHED` age band → alert (`bg-red-100 text-red-700`)

### 4. Accessibility (REQ-126)
- Every `<button>` needs `aria-label`
- Every `<input>` needs `aria-label` or associated `<label>`
- Every `<table>` needs `<caption>` or `aria-label`
- Interactive elements must be keyboard-focusable (don't remove `tabIndex`)
- Error messages need `role="alert"` so screen readers announce them

### 5. Formatting helpers (use shared utilities)
- Amounts: `formatAmount(amount)` → `R 12,500.50`
- Dates: `formatDate(date)` → `15 Jun 2026`
- Never format inline — always use the utility functions

### 6. Data fetching
- All API calls go through hooks in `client/src/hooks/useDisputes.ts`
- No `fetch()` calls directly inside components or pages

### 7. Add a component test in `client/tests/components/`

## Component Template

```tsx
interface Props {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

const PRIORITY_STYLES: Record<Props['priority'], string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
}

export function PriorityBadge({ priority }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded border text-xs font-medium ${PRIORITY_STYLES[priority]}`}
      aria-label={`Priority: ${priority}`}
    >
      {priority}
    </span>
  )
}
```
