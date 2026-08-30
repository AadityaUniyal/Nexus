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
      },
      fontFamily: {
        sans: ["Geist", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        tactile: "0 1px 3px rgba(32, 35, 31, 0.05), 0 1px 2px rgba(32, 35, 31, 0.04)",
        "tactile-md": "0 4px 20px rgba(32, 35, 31, 0.05), 0 2px 6px rgba(32, 35, 31, 0.03)",
        "tactile-lg": "0 12px 32px rgba(32, 35, 31, 0.08), 0 4px 12px rgba(32, 35, 31, 0.04)",
        "tactile-inner": "inset 0 1px 2px rgba(32, 35, 31, 0.06)",
        "tactile-lift": "0 8px 24px -4px rgba(32, 35, 31, 0.08), 0 2px 6px rgba(32, 35, 31, 0.04)",
      },
      borderRadius: {
        xl: "1.5rem",
        "2xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
