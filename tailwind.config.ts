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
        rail: {
          bg: "#132A2E",
          bg2: "#0E2124",
          paper: "#FAF3E4",
          paper2: "#F1E8D4",
          ink: "#1B1420",
          chili: "#D62839",
          "chili-dark": "#B01F2E",
          mustard: "#F2A93B",
          sage: "#6B9080",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: [
          "Arial Black",
          "Arial Narrow Bold",
          "Helvetica Neue",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        body: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        mono: [
          "ui-monospace",
          "SF Mono",
          "Cascadia Code",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        ticket: "0 12px 30px -12px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
