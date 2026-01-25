import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // TALLY Premium Palette
        "tally-bg": "var(--tally-bg)",
        "tally-surface": "var(--tally-surface)",
        "tally-surface-2": "var(--tally-surface-2)",
        "tally-border": "var(--tally-border)",
        "tally-text": "var(--tally-text)",
        "tally-text-muted": "var(--tally-text-muted)",
        "tally-sale": "var(--tally-sale)",
        "tally-sale-hover": "var(--tally-sale-hover)",
        "tally-expense": "var(--tally-expense)",
        "tally-expense-hover": "var(--tally-expense-hover)",
        "tally-mint": "var(--tally-mint)",
        // Legacy (backward compatibility)
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-secondary": "var(--surface-secondary)",
        divider: "var(--divider)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "icon-default": "var(--icon-default)",
        "money-in": "var(--money-in)",
        "money-in-bg": "var(--money-in-bg)",
        "money-out": "var(--money-out)",
        "money-out-bg": "var(--money-out-bg)",
        "cta-primary": "var(--cta-primary)",
        "cta-hover": "var(--cta-hover)",
        success: "var(--success)",
        "success-bg": "var(--success-bg)",
        error: "var(--error)",
        "error-bg": "var(--error-bg)",
        "disabled-bg": "var(--disabled-bg)",
        "disabled-text": "var(--disabled-text)",
        "health-bg": "var(--health-bg)",
        "health-border": "var(--health-border)",
      },
      borderRadius: {
        "tally": "var(--tally-radius)",
      },
      boxShadow: {
        "tally": "var(--tally-shadow)",
      },
    },
  },
  plugins: [],
};
export default config;
