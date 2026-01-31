import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Lovable Design System - HSL format
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Legacy TALLY tokens (backward compatibility)
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
        
        // Legacy mappings
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
        "cta-text": "var(--cta-text)",
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        tally: "var(--tally-radius)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        tally: "var(--tally-shadow)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
