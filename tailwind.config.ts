import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Pathfinder Brand Colors ──────────────────────────────────────────
      colors: {
        // Primary palette
        slate: {
          900: "#0F172A",
          800: "#1E293B",
          700: "#334155",
          600: "#475569",
          500: "#64748B",
          400: "#94A3B8",
          300: "#CBD5E1",
          200: "#E2E8F0",
          100: "#F1F5F9",
          50:  "#F8FAFC",
        },
        forest: {
          700: "#15803D",
          600: "#16A34A",
          500: "#22C55E",
          400: "#4ADE80",
          100: "#DCFCE7",
          50:  "#F0FDF4",
        },
        amber: {
          600: "#D97706",
          500: "#F59E0B",
          400: "#FBBF24",
          100: "#FEF3C7",
          50:  "#FFFBEB",
        },
        // Semantic aliases
        brand: {
          dark:    "#0F172A", // slate-900 — primary bg, headers
          mid:     "#1E293B", // slate-800 — card bg
          accent:  "#16A34A", // forest-600 — CTA, success
          gold:    "#F59E0B", // amber-500 — highlights, badges
          danger:  "#DC2626",
          warning: "#D97706",
        },
      },
      // ── Typography ──────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      // ── Touch targets for mobile-first ──────────────────────────────────
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
      // ── Animations ──────────────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.2s ease-out",
      },
      // ── Spacing ─────────────────────────────────────────────────────────
      spacing: {
        "safe-top":    "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
      },
    },
  },
  plugins: [],
};

export default config;
