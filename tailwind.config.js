/** @type {import('tailwindcss').Config} */
// Design tokens mirror `frontend/src/index.css`. Values live as CSS variables in
// `src/global.css` so the light/dark palettes swap without duplicating `dark:` classes
// on every element (the web app does the same with `[data-theme="dark"]`).
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          strong: 'rgb(var(--color-accent-strong) / <alpha-value>)',
          hover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
          light: 'rgb(var(--color-accent-light) / <alpha-value>)',
        },
        foose: {
          bg: 'rgb(var(--color-foose-bg) / <alpha-value>)',
          surface: 'rgb(var(--color-foose-surface) / <alpha-value>)',
          'surface-low': 'rgb(var(--color-foose-surface-low) / <alpha-value>)',
          'surface-mid': 'rgb(var(--color-foose-surface-mid) / <alpha-value>)',
          'surface-high': 'rgb(var(--color-foose-surface-high) / <alpha-value>)',
          text: 'rgb(var(--color-foose-text) / <alpha-value>)',
          muted: 'rgb(var(--color-foose-muted) / <alpha-value>)',
          faint: 'rgb(var(--color-foose-faint) / <alpha-value>)',
          border: 'rgb(var(--color-foose-border) / <alpha-value>)',
          // Fixed dark ink — intentionally not themed, for icons on white chips
          // floating over photos (favorite buttons, carousel arrows).
          ink: 'rgb(26 27 37 / <alpha-value>)',
          danger: 'rgb(var(--color-foose-danger) / <alpha-value>)',
          'danger-bg': 'rgb(var(--color-foose-danger-bg) / <alpha-value>)',
          warning: 'rgb(var(--color-foose-warning) / <alpha-value>)',
          'warning-bg': 'rgb(var(--color-foose-warning-bg) / <alpha-value>)',
          success: 'rgb(var(--color-foose-success) / <alpha-value>)',
          'success-bg': 'rgb(var(--color-foose-success-bg) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
}
