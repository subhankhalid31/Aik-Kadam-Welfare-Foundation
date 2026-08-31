import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Users } from "lucide-react";
import { ArrowCta } from "@/components/ui/ArrowCta";
import { HeroDecorativeShapes } from "@/components/sections/HeroDecorativeShapes";
import heroImg from "@assets/gallery/happy_young_girl_holding_books_in_classroom.webp";

// ─────────────────────────────────────────────────────────────────────────
// Blog page hero. Same organic blob-masked-photo + looping decorative
// shapes language as Founder.tsx (the home page's founder section) —
// reused here rather than invented fresh, so the two "big photo with soft
// shapes behind it" moments on the site actually look like they belong to
// the same design system.
// ─────────────────────────────────────────────────────────────────────────

const CONTAINER_INSET = "max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))";

export function BlogHero({ query, onQueryChange }: { query: string; onQueryChange: (v: string) => void }) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <section className="relative w-full overflow-hidden bg-cream pb-16 sm:pb-20">
      {/* Decorative curved line strokes, top-left — a gentle continuous
          draw/fade loop rather than a static doodle. Soft looping blob,
          lower-left — shared with the other content-page heroes. */}
      <HeroDecorativeShapes />

      <div className="relative grid lg:grid-cols-[1fr_1fr] gap-8 items-center pt-28 sm:pt-32">
        {/* Left: eyebrow, heading, tagline (desktop only), CTA */}
        <div className="relative z-10" style={{ paddingLeft: CONTAINER_INSET, paddingRight: "1.5rem" }}>
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Blog
          </motion.span>

          <motion.h1
            className="mt-4 font-display font-bold text-4xl sm:text-5xl leading-[1.08] text-ink max-w-lg"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
          >
            Stories, updates, and what we're learning.
          </motion.h1>

          {/* Tagline is desktop-only — on a phone, the heading + button is
              plenty before the photo takes over; a third line of body
              text here just pushed everything else further down. */}
          <motion.p
            className="hidden sm:block mt-5 text-muted max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            Notes from the field, updates on ongoing cases, and everything else
            we want to share beyond the numbers.
          </motion.p>

          <motion.div
            className="mt-7"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          >
            <ArrowCta href="#blog-content" variant="solid" shape="pill" sheen>Explore Stories</ArrowCta>
          </motion.div>
        </div>

        {/* Right: blob-masked photo + floating badge (desktop only) */}
        <motion.div
          className="relative z-10 mx-auto w-full max-w-[380px] lg:max-w-[440px] px-6 lg:px-0"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <div
            className="relative overflow-hidden aspect-square shadow-xl"
            style={{ borderRadius: "63% 37% 54% 46% / 43% 37% 63% 57%" }}
          >
            <img
              src={heroImg}
              alt="A young girl holding books in a classroom"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Floating stat badge — same bobbing-loop pattern used by
              OngoingHero's floating card. Desktop only: on a narrow
              screen it either overlaps the photo awkwardly or forces the
              photo smaller than it should be, and it's a nice-to-have,
              not core information. */}
          <motion.div
            className="hidden sm:flex absolute bottom-2 right-2 lg:right-0 items-center gap-2.5 rounded-2xl bg-white shadow-lg px-4 py-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: [0, -6, 0] }}
            transition={{
              opacity: { duration: 0.5, delay: 0.6 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 },
            }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Users size={16} className="text-primary" />
            </span>
            <span className="text-xs font-semibold leading-snug text-ink">
              Real stories.
              <br />
              Real impact.
            </span>
          </motion.div>
        </motion.div>
      </div>

      {/* Search — full bar on desktop, a collapsed round button that
          expands into the same input on mobile. Overlaps the hero's
          bottom edge on both. */}
      <div className="relative z-10 mt-8 sm:mt-4 px-6">
        {/* Desktop / tablet: always the full bar */}
        <div className="hidden sm:block max-w-md mx-auto relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search posts..."
            className="w-full rounded-full border border-border bg-white pl-11 pr-4 py-3 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Mobile: icon button that expands in place */}
        <div className="sm:hidden flex justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {mobileSearchOpen ? (
              <motion.div
                key="open"
                initial={{ width: 44, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: 44, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="relative max-w-sm w-full"
              >
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => onQueryChange(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full rounded-full border border-border bg-white pl-11 pr-10 py-3 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    onQueryChange("");
                  }}
                  aria-label="Close search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="closed"
                type="button"
                onClick={() => setMobileSearchOpen(true)}
                aria-label="Search posts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white shadow-lg"
              >
                <Search size={17} className="text-ink" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
