import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ArrowCta } from "@/components/ui/ArrowCta";
import { Link } from "wouter";
// Placeholder hero visual — the reference composition you sent directly
// (world map + masked photo + brush strokes, already combined), used
// full-bleed and at full resolution. Swap this file for a final branded
// version whenever it's ready; nothing else here needs to change.
import heroVisual from "@assets/hero-visual-placeholder.webp";

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
    // No top padding/margin on the section itself — it's the very first
    // thing on the page (PageLayout skips its spacer via `transparentHero`
    // on this route), so this section's top edge IS page y=0, which is
    // what lets the image bleed up behind the fixed, transparent navbar.
    <section className="relative bg-background overflow-hidden min-h-[520px] sm:min-h-[600px] lg:min-h-[660px]">
      {/* Full-bleed image — edge to edge, not boxed into a column. */}
      <img
        src={heroVisual}
        alt="A child supported by Aik Kadam's programs in Pakistan"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ objectPosition: "64% 22%" }}
        loading="eager"
      />

      {/* Fade the image out into the section below instead of ending on a
          hard edge — the same soft-merge treatment used at every other
          section boundary on this page. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32"
        style={{ background: "linear-gradient(to bottom, transparent, #FCFAF6)" }}
        aria-hidden="true"
      />

      {/* Live activity badge — floating card on the right side of the
          image, mirroring the reference's floating stat card. The
          pulsing dot is Tailwind's standard ping-ring pattern: a solid
          dot plus a second copy that scales up and fades out on loop. */}
      <div className="hidden sm:flex absolute top-[19%] right-[20%] lg:right-[6%] z-10 items-center gap-2 rounded-xl border border-border/70 bg-white/95 backdrop-blur-sm px-3 py-2 shadow-lg">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
        </span>
        <div className="leading-tight">
          <div className="font-bold text-ink text-xs">Live</div>
          <div className="text-[10px] text-muted whitespace-nowrap">Donations tracked in real-time</div>
        </div>
      </div>

      {/* Brush mark badge near Pakistan map */}
      <div className="hidden sm:flex absolute bottom-[20%] right-[17%] lg:right-[20%] z-10 flex-col items-center">
        <div className="relative">
          <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-md">
            <circle
              cx="40"
              cy="40"
              r="35"
              fill="#F4B400"
              style={{ filter: "url(#brush)" }}
            />
            <defs>
              <filter id="brush" x="-20%" y="-20%" width="140%" height="140%">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" />
              </filter>
            </defs>
          </svg>
          <span className="absolute bottom-8 -right-20 -translate-x-1/2 font-serif font-bold text-6xl text-ink drop-shadow-sm z-20">97+</span>
          <span className="absolute bottom-1 -right-16 -translate-x-1/2 font-serif italic font-light text-sm text-ink drop-shadow-sm z-20 opacity-40">families helped</span>
        </div>
      </div>

      {/* Text, overlaid on top of the image rather than boxed beside it.
          Top padding here is what keeps it clear of the fixed navbar.
          Headline font switched from the Playfair serif to Poppins
          ExtraBold (`font-shout`) to match the reference's chunky bold
          sans look, with the accent line set in italic + accent-dark to
          match its bold-italic-blue treatment (ours in yellow instead of
          blue, per the site's palette) — the yellow underline stroke
          stays, it already matched. */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10 pt-32 sm:pt-40 lg:pt-36 pb-12 sm:pb-16">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-[540px]">
          <motion.h1
            variants={item}
            className="font-serif font-semibold text-4xl sm:text-5xl lg:text-[4.2rem] leading-[1.1] tracking-tight text-ink"
          >
            One step
            <br />
            <span className="relative inline-block italic" style={{ color: "#7CB342" }}>
              can change
              <svg
                className="absolute left-0 -bottom-1 w-full pointer-events-none"
                height="16"
                viewBox="0 0 320 16"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 10 Q 80 2, 160 9 T 318 8"
                  stroke="#F4B400"
                  strokeWidth="11"
                  strokeLinecap="round"
                  className="animate-underline"
                  style={{
                    strokeDasharray: 320,
                    strokeDashoffset: 320,
                    animation: "underlineDraw 7.45s ease-in-out infinite",
                  }}
                />
              </svg>
            </span>
            <br />
            a life forever.
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-[18px] leading-[1.7] text-muted max-w-[500px] hidden sm:block">
            We are building a borderless Pakistan where every child receives
            food, education, and hope to shape a brighter tomorrow.
          </motion.p>

          <motion.div variants={item} className="mt-8 hidden md:flex flex-wrap items-center gap-6">
            <ArrowCta href="/donate" variant="ink" shape="rect" size="sm" sheen animateArrow>Donate now</ArrowCta>
            <Link
              href="/ongoing-projects"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand-green-dark transition-colors"
            >
              Our Work
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-10 px-6 lg:px-10 md:hidden">
        <motion.div variants={item} initial="hidden" animate="show" className="max-w-[1400px] mx-auto flex flex-wrap items-center gap-6">
          <ArrowCta href="/donate" variant="ink" shape="rect" size="sm" sheen animateArrow>Donate now</ArrowCta>
          <Link
            href="/ongoing-projects"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand-green-dark transition-colors"
          >
            Our Work
            <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
