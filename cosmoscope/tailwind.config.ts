import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}", "./src/**/*.glsl"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Space Grotesk'", ...fontFamily.sans],
        mono: ["'Space Mono'", ...fontFamily.mono],
      },
      colors: {
        neon: {
          pink: "#ff5bff",
          blue: "#00f6ff",
          purple: "#7f5fff",
        },
        space: {
          deep: "#04000f",
          mid: "#0b0620",
          glow: "#1f1740",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(255, 91, 255, 0.6)",
      },
      animation: {
        float: "float 12s ease-in-out infinite",
        orbit: "orbit 24s linear infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
