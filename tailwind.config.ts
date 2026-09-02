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
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          50: "#eefdf6",
          100: "#d6f9e6",
          200: "#aef0d0",
          300: "#78e0b4",
          400: "#3fc890",
          500: "#18a874",
          600: "#0e8760",
          700: "#0c6c4f",
          800: "#0d5641",
          900: "#0b4737",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
