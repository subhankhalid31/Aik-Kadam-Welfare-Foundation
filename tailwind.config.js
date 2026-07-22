/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F6F7F5",
        ink: "#0B1F17",
        primary: {
          DEFAULT: "#3087F8",
          light: "#72ADFA",
          dark: "#0260D8",
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
          DEFAULT: "#D6473C",
          light: "#FBEAE8",
          dark: "#B23A30",
        },
        warning: {
          DEFAULT: "#B7791F",
          light: "#FBF1DC",
          dark: "#8A5A14",
        },
        muted: "#6B7280",
        border: "#E7E7E4",
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
