import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          dark: "#1E40AF",
        },
        secondary: {
          DEFAULT: "#14B8A6",
          dark: "#0F766E",
        },
      },
    },
  },
  plugins: [],
};

export default config;
