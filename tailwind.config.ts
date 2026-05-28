import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        slate: "var(--color-slate)",
        cloud: "var(--color-cloud)",
        mist: "var(--color-mist)",
        sand: "var(--color-sand)",
        copper: "var(--color-copper)",
        tide: "var(--color-tide)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)"
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"]
      },
      boxShadow: {
        quiet: "0 24px 80px rgba(8, 20, 38, 0.10)",
        lift: "0 40px 110px rgba(8, 20, 38, 0.18)"
      },
      backgroundImage: {
        "route-grid":
          "radial-gradient(circle at 20% 20%, rgba(214, 143, 88, 0.2), transparent 30%), radial-gradient(circle at 80% 10%, rgba(95, 129, 135, 0.2), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 42%)"
      }
    }
  },
  plugins: []
};

export default config;
