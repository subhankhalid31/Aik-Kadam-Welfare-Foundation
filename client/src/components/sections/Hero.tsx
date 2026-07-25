import { Link } from "wouter";
import { motion } from "framer-motion";
import { DonateButton } from "@/components/ui/DonateButton";
import founderPhoto from "@assets/founder.jpeg";

// Each child fades up into place slightly after the one before it — the
// overall effect is a calm, confident reveal rather than everything
// appearing at once. Deliberately understated: this is a charity site
// people are trusting with donations, not a SaaS product to wow them.
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Stepping-stone motif — the "one step" signature, trailing behind the headline */}
      <svg
        className="pointer-events-none absolute -left-6 top-40 hidden lg:block opacity-70 text-primary"
        width="220"
        height="420"
        viewBox="0 0 220 420"
        fill="none"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse
            key={i}
            cx={30 + i * 38}
            cy={20 + i * 90}
            rx="16"
            ry="9"
            fill="currentColor"
            opacity={0.08 + i * 0.03}
          />
        ))}
      </svg>

      <div className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-[1.15fr_0.85fr] gap-16 items-center">
        {/* Left: mission + CTA */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-white/60 px-3.5 py-1 text-xs font-semibold tracking-wide text-primary uppercase"
          >
            Aik Kadam, One Step
          </motion.span>

          <motion.h1 variants={item} className="mt-6 font-display text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] text-ink">
            Every donation,
            <br />
            <span className="italic text-primary">a step you can trace.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-lg text-muted max-w-lg leading-relaxed">
            A giving platform built on transparency, where every rupee is
            tracked from your hand to the person it reaches, and every
            volunteer's work is verifiable.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-5">
            <DonateButton />
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-border px-7 py-3.5 font-semibold text-ink hover:bg-white transition-colors"
            >
              Our Story
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-12 grid grid-cols-3 gap-6 max-w-md">
            {[
              ["100%", "Traceable funds"],
              ["Verified", "Volunteers"],
              ["Local", "Community roots"],
            ].map(([stat, label]) => (
              <div key={label}>
                <div className="font-display text-2xl text-primary">{stat}</div>
                <div className="text-xs text-muted mt-1">{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Founder section */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div className="rounded-3xl border border-border bg-white shadow-sm p-6 sm:p-8">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src={founderPhoto}
                alt="Subhan Khalid, Founder of Aik Kadam"
                className="w-full h-full object-cover"
                loading="eager"
                width={480}
                height={600}
              />
            </div>

            <blockquote className="mt-6 font-display italic text-lg leading-snug text-ink">
              "I've seen how much trust it takes to hand someone your hard-earned
              money and hope it reaches the right hands. Aik Kadam exists so that
              trust is never misplaced, so every rupee you give travels the whole
              distance, from your hand to theirs."
            </blockquote>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink">Subhan Khalid</div>
                <div className="text-sm text-muted">Founder, Aik Kadam</div>
              </div>
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
