import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Matches the DHIIL logo (orange + black).
        brand: {
          50: "#fff3ec",
          100: "#ffe3d1",
          200: "#fec7a3",
          300: "#fda36e",
          400: "#f88a4c",
          500: "#f36a2a",
          600: "#e95b18",
          700: "#c04814",
          800: "#963a15",
          900: "#792f13",
        },
        sand: "#e8d9c8",
        ink: "#101828",
      },
      boxShadow: {
        card: "0 20px 40px -12px rgb(24 30 42 / 0.12), 0 2px 6px 0 rgb(24 30 42 / 0.06)",
      },
      borderRadius: {
        "4xl": "26px",
      },
    },
  },
  plugins: [],
};
export default config;
