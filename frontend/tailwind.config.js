/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: v("--ink"),
        surface: v("--surface"),
        panel: v("--panel"),
        elevated: v("--elevated"),
        line: v("--line"),
        muted: v("--muted"),
        ghost: v("--ghost"),
        ice: v("--ice"),
        accent: v("--accent"),
        accent2: v("--accent2"),
        good: v("--good"),
        warn: v("--warn"),
        bad: v("--bad"),
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "'SF Mono'", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
