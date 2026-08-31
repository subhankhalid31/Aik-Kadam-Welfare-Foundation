import { motion } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────
// The decorative curved-line + soft-blob background treatment, originally
// built for BlogHero, now shared across every content-page hero
// (Ongoing Cases, Success Stories, Completed Projects) so they all read as
// the same design language instead of BlogHero being the odd one out.
// Both pieces loop continuously — the lines draw and un-draw, the blob
// gently rocks — rather than playing once and going still.
// ─────────────────────────────────────────────────────────────────────────
export function HeroDecorativeShapes() {
  return (
    <>
      <svg className="pointer-events-none absolute -left-6 top-0 w-64 h-40 text-accent opacity-70 z-[1]" viewBox="0 0 260 160" fill="none" aria-hidden="true">
        <motion.path
          d="M4 8 C 60 4, 90 40, 60 70 S 10 120, 70 130"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1.2 }}
        />
        <motion.path
          d="M20 40 C 70 30, 100 60, 130 45"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          opacity={0.6}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1.6, delay: 0.3 }}
        />
      </svg>

      <motion.div
        className="pointer-events-none absolute -left-16 bottom-0 z-[1] h-64 w-64 bg-brand-green/[0.12]"
        style={{ borderRadius: "58% 42% 37% 63% / 45% 60% 40% 55%" }}
        animate={{ rotate: [-6, 6, -6] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden="true"
      />
    </>
  );
}
