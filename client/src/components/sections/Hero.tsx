import { Link } from "wouter";
import { motion } from "framer-motion";
import { HandHeart, Heart, Users, ShieldCheck, Quote } from "lucide-react";
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
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 sm:pb-36 grid lg:grid-cols-[1.15fr_0.85fr] gap-16 lg:gap-10 items-center">
        {/* Left: mission + CTA */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold tracking-wide text-primary uppercase"
          >
            <HandHeart size={15} />
            Aik Kadam, One Step
          </motion.span>

          <motion.h1 variants={item} className="mt-6 font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] text-ink">
            Every donation,
            <br />
            <span className="relative inline-block italic text-primary">
              a step you can trace.
              <svg
                className="absolute left-0 -bottom-1.5 w-full pointer-events-none"
                height="10"
                viewBox="0 0 300 10"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 7 Q 40 2, 80 6 T 160 6 T 240 6 T 298 5"
                  stroke="#FFD662"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-lg text-muted max-w-lg leading-relaxed">
            A giving platform built on transparency, where every rupee is
            tracked from your hand to the person it reaches, and every
            volunteer's work is verifiable.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-4">
            <DonateButton />
            <div className="glass-pill-wrap">
              <Link href="/about" className="glass-pill relative isolate rounded-full inline-block">
                <span className="glass-pill-text px-7 py-3.5 font-semibold">
                  <span className="relative z-10 flex items-center gap-2">
                    <Users size={18} />
                    Our Story
                  </span>
                </span>
              </Link>
              <div className="glass-pill-shadow rounded-full" />
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-12 flex items-center flex-wrap gap-x-8 gap-y-4">
            {(
              [
                [Users, "100+", "Families Helped"],
                [HandHeart, "2M+", "Funds Raised"],
                [ShieldCheck, "Verified", "Impact & Reports"],
              ] as const
            ).map(([Icon, value, label], i) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex items-center gap-2.5">
                  <Icon size={18} className="text-primary shrink-0" />
                  <div className="leading-tight">
                    <div className="font-bold text-ink text-sm">{value}</div>
                    <div className="text-xs text-muted">{label}</div>
                  </div>
                </div>
                {i < 2 && <div className="hidden sm:block h-8 w-px bg-border" />}
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
          {/* Layered organic blobs behind the photo — each a different size,
              rotation, and shade, so the rotation actually reads as distinct
              layers rather than blending into one shape */}
          <div
            className="absolute -inset-12 -z-30 bg-primary/[0.08]"
            style={{ borderRadius: "42% 58% 63% 37% / 55% 43% 57% 45%", transform: "rotate(-14deg)" }}
          />
          <div
            className="absolute -inset-8 -z-20 bg-primary/[0.12]"
            style={{ borderRadius: "58% 42% 37% 63% / 45% 60% 40% 55%", transform: "rotate(9deg)" }}
          />
          <div
            className="absolute -inset-4 -z-10 bg-primary/[0.16]"
            style={{ borderRadius: "63% 37% 54% 46% / 43% 37% 63% 57%", transform: "rotate(-5deg)" }}
          />

          {/* Decorative outline heart, top-left of the image */}
          <Heart className="absolute -left-2 top-0 text-primary/40" size={28} strokeWidth={1.5} />

          {/* Decorative dot grid, left edge of the image */}
          <div className="absolute -left-5 bottom-36 grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-primary/30" />
            ))}
          </div>

          {/* Blob-masked founder photo */}
          <div
            className="relative overflow-hidden aspect-[4/5] shadow-xl"
            style={{ borderRadius: "63% 37% 54% 46% / 43% 37% 63% 57%" }}
          >
            <img
              src={founderPhoto}
              alt="Subhan Khalid, Founder of Aik Kadam"
              className="w-full h-full object-cover"
              loading="eager"
              width={480}
              height={600}
            />
          </div>

          {/* Floating "100% Transparent Giving" badge */}
          <div className="absolute -top-4 -right-2 sm:-right-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-ink text-sm">100%</div>
              <div className="text-xs text-muted whitespace-nowrap">Transparent Giving</div>
            </div>
          </div>

          {/* Quote + signature card. On mobile it sits in normal flow right
              below the photo — the founder image renders quite short on a
              narrow phone column, so absolutely overlapping it here (as
              this card does on desktop) would cover more than half of it.
              From sm up, the image is large enough that the same card
              overlapping the bottom edge reads as an intentional floating
              card rather than something hiding the photo. */}
          <div className="relative mt-6 sm:mt-0 sm:absolute sm:-bottom-20 sm:-left-5 sm:-right-5 bg-white rounded-2xl shadow-xl p-5 sm:p-6">
            <Quote size={22} className="text-primary/30 fill-primary/10" />
            <p className="mt-1 font-display italic text-sm leading-snug text-ink">
              "I've seen how much trust it takes to hand someone your hard-earned
              money and hope it reaches the right hands. Aik Kadam exists so that
              trust is never misplaced, so every rupee you give travels the whole
              distance, from your hand to theirs."
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink text-sm">Subhan Khalid</div>
                <div className="text-xs text-muted">Founder, Aik Kadam</div>
              </div>
              <div className="text-3xl text-primary leading-none" style={{ fontFamily: "'Bastliga One', cursive" }}>
                Subhan
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
