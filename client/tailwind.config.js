/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sb-bg':             'var(--color-bg)',
        'sb-surface':        'var(--color-surface)',
        'sb-surface-raised': 'var(--color-surface-raised)',
        'sb-border':         'var(--color-border)',
        'sb-border-subtle':  'var(--color-border-subtle)',
        'sb-text':           'var(--color-text-primary)',
        'sb-text-secondary': 'var(--color-text-secondary)',
        'sb-text-muted':     'var(--color-text-muted)',
        'sb-accent':         'var(--color-accent)',
        'sb-accent-hover':   'var(--color-accent-hover)',
        'sb-immediate':      'var(--color-status-immediate)',
        'sb-investigate':    'var(--color-status-investigate)',
        'sb-escalate':       'var(--color-status-escalate)',
        'sb-refer':          'var(--color-status-refer)',
        'sb-closed':         'var(--color-status-closed)',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        data:    ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '4px', none: '0', sm: '2px', md: '4px',
        lg: '4px', xl: '4px', '2xl': '4px', full: '4px',
      },
      fontSize: {
        'xs':   ['11px', { lineHeight: '1.4' }],
        'sm':   ['13px', { lineHeight: '1.5' }],
        'base': ['15px', { lineHeight: '1.6' }],
        'lg':   ['18px', { lineHeight: '1.4' }],
        'xl':   ['22px', { lineHeight: '1.3' }],
      },
      boxShadow: { none: 'none', DEFAULT: 'none', sm: 'none', md: 'none', lg: 'none', xl: 'none' },
    },
  },
  plugins: [],
};
