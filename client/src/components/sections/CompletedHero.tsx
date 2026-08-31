import { Link } from "wouter";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { HeroDecorativeShapes } from "@/components/sections/HeroDecorativeShapes";
import volunteersImg from "@assets/gallery/completed_projects_hero_high_five.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Aligns text with the standard page container (max-w-6xl / px-6) while this
// section itself spans the full viewport width edge-to-edge.
const CONTAINER_INSET = "max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))";

export function CompletedHero() {
  return (
    <section className="relative w-full overflow-hidden">
      {/* Full-bleed background image, edge to edge */}
      <div className="absolute inset-0 -z-10">
        <motion.img
          src={volunteersImg}
          alt="A child high-fiving an Aik Kadam volunteer"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
        {/* Fade at bottom to merge with section below */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32"
          style={{ background: "linear-gradient(to bottom, transparent, #FCFAF6)" }}
          aria-hidden="true"
        />
      </div>

      <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-0 pt-24 sm:pt-28 pb-10 sm:pb-14">
        <HeroDecorativeShapes />

        <div className="pr-6 max-w-xl" style={{ paddingLeft: CONTAINER_INSET }}>
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <ShieldCheck size={14} />
            Completed Projects
          </motion.span>

          <motion.h1
            className="mt-4 font-display font-bold text-4xl sm:text-5xl leading-[1.08] text-ink"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            Together, we created
            <br />
            <span className="text-primary relative inline-block">
              real change.
              <svg
                className="absolute -bottom-1.5 left-0 w-full text-primary/50"
                height="8"
                viewBox="0 0 220 8"
                fill="none"
                preserveAspectRatio="none"
              >
                <path d="M2 5.5C40 1 80 1 110 4C140 7 180 2 218 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            className="mt-5 text-muted max-w-md leading-relaxed hidden sm:block"
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          >
            These projects are completed with your support and verified by our team.
            Every donation made a real difference.
          </motion.p>
        </div>

        {/* Floating "Our Process" card, overlaid on the image on the right */}
        <motion.div
          className="self-end mr-4 sm:mr-0 sm:absolute sm:bottom-6 sm:right-6 lg:right-10 w-[200px] sm:w-[240px] rounded-2xl border border-border bg-white shadow-lg p-4 sm:p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <ShieldCheck size={16} />
          </div>
          <p className="mt-3 font-display text-sm text-ink leading-snug">Our Process</p>
          <p className="mt-1 text-xs text-muted leading-relaxed hidden sm:block">
            From receiving a case to completing it with transparency and care.
          </p>
          <div className="glass-pill-wrap w-full mt-3">
            <Link href="/about" className="glass-pill relative isolate rounded-full block w-full">
              <span className="glass-pill-text block w-full px-4 py-2.5 text-xs font-semibold text-center">
                See How It Works →
              </span>
            </Link>
            <div className="glass-pill-shadow rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
