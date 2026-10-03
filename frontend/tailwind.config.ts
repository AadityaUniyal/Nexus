import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          surface: "var(--surface)",
          "surface-dim": "var(--surface-dim)",
          "surface-bright": "var(--surface-bright)",
          "surface-lowest": "var(--surface-container-lowest)",
          "surface-low": "var(--surface-container-low)",
          "surface-container": "var(--surface-container)",
          "surface-high": "var(--surface-container-high)",
          "surface-highest": "var(--surface-container-highest)",
          "on-surface": "var(--on-surface)",
          "on-surface-variant": "var(--on-surface-variant)",
          "inverse-surface": "var(--inverse-surface)",
          "inverse-on-surface": "var(--inverse-on-surface)",
          outline: "var(--outline)",
          "outline-variant": "var(--outline-variant)",
          primary: "var(--primary)",
          "on-primary": "var(--on-primary)",
          "primary-container": "var(--primary-container)",
          "on-primary-container": "var(--on-primary-container)",
          secondary: "var(--secondary)",
          "on-secondary": "var(--on-secondary)",
          "secondary-container": "var(--secondary-container)",
          "on-secondary-container": "var(--on-secondary-container)",
          tertiary: "var(--tertiary)",
          "on-tertiary": "var(--on-tertiary)",
          "tertiary-container": "var(--tertiary-container)",
          "on-tertiary-container": "var(--on-tertiary-container)",
          error: "var(--error)",
          "on-error": "var(--on-error)",
          "error-container": "var(--error-container)",
          "on-error-container": "var(--on-error-container)",
          // Semantic Simulation & AI
          simulation: "var(--simulation)",
          "simulation-container": "var(--simulation-container)",
          "on-simulation": "var(--on-simulation)",
          ai: "var(--ai)",
          "ai-container": "var(--ai-container)",
          "on-ai": "var(--on-ai)",
        },
        brand: {
          50: "var(--brand-50)",
          100: "var(--brand-100)",
          200: "var(--brand-200)",
          300: "var(--brand-300)",
          400: "var(--brand-400)",
          500: "var(--brand-500)",
          600: "var(--brand-600)",
          700: "var(--brand-700)",
          800: "var(--brand-800)",
          900: "var(--brand-900)",
        },
        accent: {
          500: "var(--accent-500)",
          600: "var(--accent-600)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        // Remap legacy purple utilities to the calm scenario-blue so old pages stay on-brand
        purple: {
          50: "#eef1fc", 100: "#e6ebfb", 200: "#c9d3f6", 300: "#a3b3ee", 400: "#7b8fe2",
          500: "#3a55c0", 600: "#324aab", 700: "#2b3f93", 800: "#22337a", 900: "#1b2860", 950: "#121b44",
        },
        violet: {
          50: "#eef1fc", 100: "#e6ebfb", 200: "#c9d3f6", 300: "#a3b3ee", 400: "#7b8fe2",
          500: "#3a55c0", 600: "#324aab", 700: "#2b3f93", 800: "#22337a", 900: "#1b2860", 950: "#121b44",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        tactile: "0 1px 2px rgba(15, 26, 31, 0.05)",
        "tactile-md": "0 1px 2px rgba(15, 26, 31, 0.04), 0 4px 16px rgba(15, 26, 31, 0.05)",
        "tactile-lg": "0 2px 6px rgba(15, 26, 31, 0.04), 0 16px 40px -8px rgba(15, 26, 31, 0.12)",
        "tactile-inner": "inset 0 1px 2px rgba(15, 26, 31, 0.05)",
        "tactile-lift": "0 2px 4px rgba(15, 26, 31, 0.04), 0 12px 28px -6px rgba(15, 26, 31, 0.1)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
