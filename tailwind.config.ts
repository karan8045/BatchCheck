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
        navy: {
          950: "#060913",
          900: "#0b1120",
          850: "#0f172a",
          800: "#17223b",
          700: "#1e2942",
          600: "#2d3e63",
        },
        flagged: {
          DEFAULT: "#dc2626",
          dark: "#991b1b",
          light: "#fef2f2",
          border: "#ef4444",
        },
        expired: {
          DEFAULT: "#d97706",
          dark: "#b45309",
          light: "#fffbeb",
          border: "#f59e0b",
        },
        neutralalert: {
          DEFAULT: "#475569",
          dark: "#334155",
          light: "#f8fafc",
          border: "#64748b",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      minHeight: {
        touch: "48px",
      },
      minWidth: {
        touch: "48px",
      },
    },
  },
  plugins: [],
};

export default config;

