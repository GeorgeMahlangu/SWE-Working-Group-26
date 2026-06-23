---
name: ui-design
description: Visual and interaction design system for the Payment Dispute Triage prototype. This skill governs every visual and interaction decision. When this file conflicts with any other instruction, this file wins for all visual and interaction decisions.
inclusion: manual
---

# Kiro Skill: UI Design System — Payment Dispute Triage

## Purpose

This skill governs every visual and interaction decision in the dispute triage prototype. It is not a starting point — it is the constraint. Deviating from it produces an app that looks generic. Follow it exactly.

---

## Design Identity

This is an internal operational tool used by Standard Bank operations staff under real pressure. It must look and behave like it belongs inside a serious financial institution — not like a SaaS startup dashboard, not like a consumer app, and not like any template.

The visual language is **structured authority**: dense but not cluttered, precise but not cold, fast to scan, zero decoration for decoration's sake.

The one signature element this interface will be remembered by: **a left-border status system** — every case row and status badge draws its meaning entirely from a 3px left-border accent in a semantic color. No status icons, no colored backgrounds, no pill badges. The border does all the work.

---

## Color Tokens

```css
--color-bg:             #0F1923   /* near-black navy — base canvas */
--color-surface:        #162030   /* card/panel backgrounds */
--color-surface-raised: #1C2A3A   /* elevated elements: modals, dropdowns */
--color-border:         #253345   /* structural dividers */
--color-border-subtle:  #1A2838   /* low-contrast separators */

--color-text-primary:   #E8EDF2   /* headings, labels */
--color-text-secondary: #8A9BB0   /* supporting text, metadata */
--color-text-muted:     #4E6077   /* timestamps, disabled states */

/* Status colors — used ONLY for left-border accents and status text */
--color-status-immediate:  #C0392B   /* RESOLVE_NOW — red */
--color-status-investigate: #D4870A  /* INVESTIGATE — amber */
--color-status-escalate:   #1A6BB5   /* ESCALATE — institutional blue */
--color-status-refer:      #4E6077   /* REFER — slate */
--color-status-closed:     #2A4A35   /* CLOSED/RESOLVED — muted green */

/* Standard Bank blue — use sparingly, only on primary actions */
--color-accent:       #0033A0
--color-accent-hover: #002580
```

Do not introduce any color outside this set. Do not use gradients. Do not use colored backgrounds on rows or cards.

---

## Action → Display Label Mapping

The API returns UPPERCASE enum values. The UI must render human-readable labels exactly as follows:

| API value | Display label | Status color token |
|-----------|--------------|-------------------|
| `RESOLVE_NOW` | Resolve Immediately | `--color-status-immediate` |
| `INVESTIGATE` | Investigate Further | `--color-status-investigate` |
| `ESCALATE` | Escalate | `--color-status-escalate` |
| `REFER` | Refer to Another Team | `--color-status-refer` |
| `RESOLVED` / `CLOSED` | Closed | `--color-status-closed` |

---

## Typography

```
--font-display: 'Inter', system-ui, sans-serif       /* headings, labels, body */
--font-data:    'JetBrains Mono', 'Courier New', monospace  /* amounts, IDs, dates, case numbers */
```

Load both via Google Fonts. Case numbers, transaction amounts, account numbers, and reference codes always render in `--font-data`. Everything else in `--font-display`. Never mix within a single UI element.

**Type scale:**

```
--text-xs:   11px / 1.4   /* metadata, timestamps, case IDs */
--text-sm:   13px / 1.5   /* table data, secondary labels */
--text-base: 15px / 1.6   /* body text, form fields */
--text-lg:   18px / 1.4   /* section headings */
--text-xl:   22px / 1.3   /* page title */
```

Letter spacing on uppercase labels: `0.08em`. No other tracking adjustments.

---

## Application Shell Layout

```
[ Top Bar — 52px fixed, full width ]
[ Sidebar — 220px fixed left ] [ Main Content Area — fluid ]
```

**Top bar:** Standard Bank wordmark (text only, no logo graphic), current user name (right side), single "New Dispute" button right-aligned in `--color-accent`.

**Sidebar navigation items:** All Cases | Pending | Escalated | Resolved | Reports

- Active item: `border-left: 3px solid var(--color-accent)`, text `--color-text-primary`
- Inactive item: text `--color-text-secondary`, no border
- No icons. No tooltips.

**Main content area padding:** `24px 32px`.

**No rounded corners above `border-radius: 4px` anywhere.** Not on cards, buttons, inputs, or panels.

**No box shadows.** Borders only for separation.

---

## Component Definitions

### Dispute Row (List View)

```
[ 3px left border in action color ][ Case ID ][ Customer ][ Payment Type ][ Amount ][ Age ][ Action label ][ Status ]
```

- Row height: 48px
- Hover background: `--color-surface-raised`
- No click animation. `cursor: pointer` only.
- Case ID: `--font-data --text-xs --color-text-muted`
- Amount: `--font-data --text-sm --color-text-primary`
- Action label: plain text, same color as its left border. No background. No border on the label.
- Age: if >48 hours, render in `--color-status-immediate`. Otherwise `--color-text-muted`.
- Left border color maps to `RecommendedAction` via the Action→Display Label table above.

### Dispute Detail Panel

Opens as a **right-side panel, 480px wide**, sliding in from the right at `150ms ease`. The list remains visible and scrollable behind it. This is not a page route.

Panel sections separated by `1px solid --color-border`:

1. **Header** — Case ID (`--font-data`), payment type tag, submitted timestamp
2. **Dispute Summary** — customer name, account reference (masked), issue category, description
3. **Transaction Details** — amount (`--font-data`), transaction date, payment method, transaction status
4. **Recommended Action** — the focal point. Large block with `3px left border` in action color + `8% opacity rgba` background tint (the single exception to the no-background rule). Shows action label, plain-language explanation (one sentence per rule that fired), and target queue.
5. **Action Bar** — "Accept Recommendation" | "Override" | "Close Case" — left to right in that order.

### New Dispute Form

Opens as a **modal, 560px wide**. Dark overlay behind. Not a full-page route.

Fields:
- Customer name (text)
- Account reference (text, `--font-data` input)
- Payment type (select: Card Payment, EFT, Internal Transfer)
- Issue category (select: Duplicate Debit, Failed Transfer, Missing Payment, Unauthorised Transaction)
- Transaction amount (number — label: "Amount (ZAR)")
- Transaction date (date)
- Description (textarea, max **400 characters** — live character count)

Field labels: `--text-xs uppercase 0.08em letter-spacing --color-text-secondary`. Never placeholder-only labels.

Input height: 40px. Border: `1px solid --color-border`. Focus: `1px solid --color-accent`. No glow. No shadow.

Submit button: "Submit Dispute" — full width, `--color-accent`, height 44px, `--text-sm uppercase`.

### Status Classification Tag

Used in detail panel header and list status column only:

```
[ 3px left border in action color ] [ Action label text in matching color ]
```

No border around tag. No background. Border is the only visual marker.

Labels: `Resolve Immediately` | `Investigate Further` | `Escalate` | `Refer to Another Team` | `Closed`

### Empty State

Plain text only. No illustrations, no icons:

```
No disputes match this filter.
Adjust the filter or submit a new dispute.
```

Centered in content area. `--color-text-muted --text-sm`.

### Loading State

Single horizontal bar, `2px` height, `--color-accent`, animating left-to-right at `1.2s ease`. **No spinners. No skeleton screens.**

---

## Filter Bar

Between page heading and dispute list. Single row, left-aligned.

Controls: Payment Type (button group) | Issue Category (dropdown) | Age (button group: all / under 24h / 24–48h / over 48h) | Priority (button group: all / immediate / escalated)

Active filter: `background --color-surface-raised`, `border-bottom: 2px solid --color-accent`.
Inactive: no border, no background.

---

## Interaction Rules

- **Transitions:** `150ms ease` only. Nothing slower. Nothing bouncier.
- **No toast notifications.** Inline errors only, beneath the action bar, in `--color-status-immediate`.
- **No confirmation dialogs** for accepting recommendations. Confirmation only for "Close Case": "Close this dispute? This cannot be undone." with "Close" and "Cancel".
- **Keyboard navigation:** Tab order follows DOM order. Focus ring: `2px solid --color-accent` with `2px offset`.
- **No drag and drop. No bulk selection. No column sorting in phase one.**

---

## Tailwind Configuration

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'sb-bg':            'var(--color-bg)',
      'sb-surface':       'var(--color-surface)',
      'sb-surface-raised':'var(--color-surface-raised)',
      'sb-border':        'var(--color-border)',
      'sb-text':          'var(--color-text-primary)',
      'sb-text-secondary':'var(--color-text-secondary)',
      'sb-text-muted':    'var(--color-text-muted)',
      'sb-accent':        'var(--color-accent)',
      'sb-immediate':     'var(--color-status-immediate)',
      'sb-investigate':   'var(--color-status-investigate)',
      'sb-escalate':      'var(--color-status-escalate)',
      'sb-refer':         'var(--color-status-refer)',
      'sb-closed':        'var(--color-status-closed)',
    },
    fontFamily: {
      display: ['Inter', 'system-ui', 'sans-serif'],
      data:    ['JetBrains Mono', 'Courier New', 'monospace'],
    },
    borderRadius: {
      DEFAULT: '4px',
      none:    '0',
      sm:      '2px',
      md:      '4px',
    },
  },
}
```

Apply CSS custom properties in `client/src/index.css` under `:root`.

---

## What Kiro Must Not Generate

- Rounded pill badges for status or priority
- Colored backgrounds on rows or cards (except the 8% tint in Recommended Action block)
- Box shadows on any element
- Skeleton screens or spinners
- Toast notifications
- Hero sections, marketing copy, large illustrative headers
- Avatar initials or user profile pictures
- Data visualisation charts (bar, pie, line) in phase one
- Emoji anywhere in the interface
- Gradient backgrounds or gradient buttons
- Modal backdrops with blur effects
- Consumer-app greeting patterns ("Welcome back, [name]")
- Tailwind semantic color shortcuts (`bg-blue-500`, `text-red-600`) — all colors via CSS custom properties only
