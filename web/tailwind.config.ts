import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0e0a",
        bgPanel: "#101510",
        fg: "#7ee787",
        fgDim: "#3fb950",
        fgMuted: "#2a4a2a",
        accent: "#ff7b72",
        warn: "#d29922",
        ink: "#0a0e0a",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "Menlo", "monospace"],
      },
      boxShadow: {
        crt: "0 0 0 1px #1f3f1f, 0 0 24px 0 #0f3f0f inset",
      },
    },
  },
  plugins: [],
} satisfies Config;
