import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookHeart, ArrowRight } from "lucide-react";
import heroImg from "@assets/gallery/success_stories_hero.webp";

// Aligns text with the standard page container (max-w-6xl / px-6) while this
// section itself spans the full viewport width edge-to-edge.
const CONTAINER_INSET = "max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))";

const HEADLINE_WORDS = ["Real", "stories.", "Real", "hope."];

export function SuccessStoriesHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  // Very subtle parallax: image trails the scroll at ~95% speed (barely noticeable, adds depth).
  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      setOffset(window.scrollY * 0.05);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative w-full overflow-hidden">
      <div ref={sectionRef} className="absolute inset-0 -z-10">
        <motion.img
          src={heroImg}
          alt="An Aik Kadam volunteer welcoming a girl back to school"
          className="w-full h-full object-cover"
          style={{ transform: `translateY(${-offset}px)` }}
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="relative min-h-[420px] sm:min-h-[480px] lg:min-h-[520px] flex items-center py-14">
        <div className="pr-6 max-w-xl" style={{ paddingLeft: CONTAINER_INSET }}>
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Success Stories
          </motion.span>

          {/* Word-by-word cinematic reveal */}
          <h1 className="mt-4 font-display text-4xl sm:text-5xl leading-[1.08] text-ink">
            <span className="block">
              {HEADLINE_WORDS.slice(0, 2).map((word, i) => (
                <motion.span
                  key={word}
                  className="inline-block mr-3"
                  initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.65, delay: 0.15 + i * 0.08, ease: "easeOut" }}
                >
                  {word}
                </motion.span>
              ))}
            </span>
            <span className="block">
              <motion.span
                className="inline-block mr-3"
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.65, delay: 0.15 + 2 * 0.08, ease: "easeOut" }}
              >
                {HEADLINE_WORDS[2]}
              </motion.span>
              <motion.span
                className="relative inline-block text-primary"
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.65, delay: 0.15 + 3 * 0.08, ease: "easeOut" }}
              >
                {HEADLINE_WORDS[3]}
                <svg
                  className="absolute -bottom-1.5 left-0 w-full text-primary/50"
                  height="8"
                  viewBox="0 0 120 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d="M2 5.5C25 1 50 1 65 4C80 7 100 2 118 3"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                  />
                </svg>
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="mt-5 text-muted max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          >
            Every completed project creates a story worth remembering.
            <br />
            Verified journeys shared with permission.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
          >
            <div className="glass-pill-wrap mt-6 group/cta">
              <Link href="/about" className="glass-pill relative isolate rounded-full block">
                <span className="glass-pill-text block px-6 py-3 text-sm font-semibold">
                  <span className="relative z-10 flex items-center gap-1.5">
                    <BookHeart size={15} /> Learn About Us
                    <ArrowRight size={14} className="transition-transform duration-200 group-hover/cta:translate-x-1" />
                  </span>
                </span>
              </Link>
              <div className="glass-pill-shadow rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
