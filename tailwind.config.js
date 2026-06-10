/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        ink: "#1f2328",
        mist: "#f7f7f5",
        line: "#dedbd4",
        moss: "#667c5f",
        clay: "#a45f4b",
      },
      boxShadow: {
        soft: "0 18px 48px rgba(31, 35, 40, 0.08)",
      },
    },
  },
  plugins: [],
};
