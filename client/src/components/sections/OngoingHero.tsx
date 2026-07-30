import { Link } from "wouter";
import { motion } from "framer-motion";
import { FileEdit } from "lucide-react";
import unityImg from "@assets/gallery/ongoing_cases_hero_hands_reaching.webp";

// Aligns text with the standard page container (max-w-6xl / px-6) while this
// section itself spans the full viewport width edge-to-edge.
const CONTAINER_INSET = "max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))";

export function OngoingHero({ showSubmitCta }: { showSubmitCta: boolean }) {
  return (
    <motion.section
      className="relative w-full overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Full-bleed background image, edge to edge */}
      <div className="absolute inset-0 -z-10">
        <motion.img
          src={unityImg}
          alt="A helping hand reaching out to another across the sky"
          className="w-full h-full object-cover"
          loading="eager"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
      </div>

      <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-0 py-10 sm:py-14">
        {/* Text, aligned to the page's standard left inset */}
        <div className="pr-6 max-w-xl" style={{ paddingLeft: CONTAINER_INSET }}>
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Ongoing Cases
          </span>

          <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-[1.08] text-ink">
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0, ease: "easeOut" }}
            >
              Real Needs.
            </motion.span>
            <span className="block">
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              >
                Real People.{" "}
              </motion.span>
              <motion.span
                className="relative inline-block text-primary"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
              >
                Real Impact.
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-primary/50"
                  height="8"
                  viewBox="0 0 220 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M2 5.5C40 1 80 1 110 4C140 7 180 2 218 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </motion.span>
            </span>
          </h1>

          <p className="mt-5 text-muted max-w-md leading-relaxed">
            We are currently working on verified cases.
            <br />
            Browse below or{" "}
            <Link href="/post-case" className="text-primary font-semibold hover:underline">
              submit a new case
            </Link>{" "}
            to help someone in need.
          </p>
        </div>

        {/* Floating "submit a case" card, overlaid on the image on the right */}
        {showSubmitCta && (
          <motion.div
            className="self-end mr-4 sm:mr-0 sm:absolute sm:bottom-6 sm:right-6 lg:right-10 w-[200px] sm:w-[240px] rounded-2xl border border-border bg-white shadow-lg p-4 sm:p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileEdit size={16} />
              </div>
              <p className="mt-3 font-display text-sm text-ink leading-snug">Know someone who needs help?</p>
              <p className="mt-1 text-xs text-muted leading-relaxed hidden sm:block">
                Submit a verified case and our team will review it.
              </p>
              <div className="glass-pill-wrap w-full mt-3">
                <Link href="/post-case" className="glass-pill relative isolate rounded-full block w-full">
                  <span className="glass-pill-text block w-full px-4 py-2.5 text-xs font-semibold text-center">
                    Submit a Case →
                  </span>
                </Link>
                <div className="glass-pill-shadow rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
