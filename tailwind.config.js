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
        // New brand palette sampled directly from the new logo, for the
        // landing-page redesign currently in progress. Kept separate from
        // `primary` (still blue) on purpose — auth pages and everything
        // else not yet redesigned still reference `primary` and stay as
        // they are; pages get moved over to `brand-*` one at a time.
        "brand-green": {
          DEFAULT: "#709828",
          light: "#9EC656",
          dark: "#465F19",
        },
        "brand-orange": {
          DEFAULT: "#E09010",
          light: "#EDBA69",
          dark: "#9D650B",
        },
        beige: "#F1E9DA",
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
