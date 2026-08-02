/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─────────────────────────────────────────────────────────────
        // Aik Kadam brand palette — warm, minimal, humanitarian.
        // Every color the app uses resolves back to one of these tokens,
        // so this block is the single source of truth for the whole
        // site's look. No blue anywhere on purpose: the old `primary`
        // token used to be blue (#1F61EF) and was referenced across
        // dozens of pages — it's now mapped straight to brand green
        // instead, so every one of those pages picks up the new palette
        // automatically with zero per-file edits.
        // ─────────────────────────────────────────────────────────────
        background: "#FCFAF6", // ivory — main page background
        ink: "#151515", // rich black — headings, buttons, primary text
        card: "#FFFFFF", // pure white — card surfaces

        // Primary brand green. `primary` is kept as an alias (rather than
        // renamed) so every existing `text-primary`/`bg-primary`/etc.
        // class across the app — auth pages, admin, buttons — resolves
        // to green instead of the old blue with no other changes needed.
        primary: {
          DEFAULT: "#7CB342",
          light: "#9CC96C",
          dark: "#5F8F2E",
        },
        "brand-green": {
          DEFAULT: "#7CB342",
          light: "#9CC96C",
          dark: "#5F8F2E",
        },

        // Primary accent yellow. `brand-orange` is kept as an alias to
        // this same yellow (rather than deleted) so the handful of
        // components still referencing `brand-orange` from the previous
        // redesign pass stay on-palette instead of rendering an
        // unrelated orange.
        accent: {
          DEFAULT: "#F4B400",
          light: "#F8CB4D",
          dark: "#D89A00",
        },
        "brand-orange": {
          DEFAULT: "#F4B400",
          light: "#F8CB4D",
          dark: "#D89A00",
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

        // Body copy and secondary text. `muted` is the workhorse token
        // used for paragraph/body text across the app, so it takes the
        // charcoal value; `subtle` is the lighter, more secondary shade
        // (captions, timestamps, placeholder-ish text) for components
        // that want to opt into it specifically.
        muted: "#525252",
        subtle: "#7A7A7A",

        border: "#E6DED3",
        beige: "#E8D8C3", // warm beige — decorative elements, hover fills
        cream: "#F7F2EA", // soft cream — alternate section backgrounds
        sand: "#EFE7DA", // subtle decorative blobs / background accents
      },
      fontFamily: {
        display: ["Niveau Grotesk", "system-ui", "sans-serif"],
        body: ["Niveau Grotesk", "system-ui", "sans-serif"],
        shout: ["Poppins", "system-ui", "sans-serif"],
        serif: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
