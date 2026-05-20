/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-chrome': '#0a0a0a',   /* Footer, deepest background */
        'bar-rail': '#0d0d0d',      /* Topbar, rail, monitor strip */
        'page-bg': '#111111',       /* Main workspace background */
        'card-bg': '#161616',       /* Cards and panel containers */
        'interactive': '#1a1a1a',   /* Inactive cards, interactive fields */
        'border-muted': '#1e1e1e',  /* Dividers, system borders */
        'border-card': '#222222',   /* Inactive card borders */

        'accent-blue': '#3b82f6',   /* Active, accent actions */
        'accent-green': '#22c55e',  /* Nominals, safe readings */
        'accent-amber': '#f59e0b',  /* Intermediate warn limits */
        'accent-red': '#ef4444',    /* Throttling danger ceilings */
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
