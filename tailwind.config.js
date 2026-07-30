/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        ink: "#0A0C10",
        primary: {
          DEFAULT: "#1F61EF",
          light: "#4F83F3",
          dark: "#0E4BCD",
        },
        accent: {
          DEFAULT: "#FFD662",
          light: "#FFE499",
          dark: "#CCAB4E",
        },
        success: {
          DEFAULT: "#1F8A5F",
          light: "#E7F5EE",
          dark: "#166B49",
        },
        danger: {
          DEFAULT: "#DC2828",
          light: "#FBE9E9",
          dark: "#B41D1D",
        },
        warning: {
          DEFAULT: "#B7791F",
          light: "#FBF1DC",
          dark: "#8A5A14",
        },
        muted: "#596473",
        border: "#E2E4E9",
      },
      fontFamily: {
        display: ["Niveau Grotesk", "system-ui", "sans-serif"],
        body: ["Niveau Grotesk", "system-ui", "sans-serif"],
        shout: ["Poppins", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
