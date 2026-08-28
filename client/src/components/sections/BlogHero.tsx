import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import heroImg from "@assets/gallery/happy_young_girl_holding_books_in_classroom.webp";

// Same pattern as SuccessStoriesHero: full-bleed image behind, white
// gradient blending it into the page, headline + tagline over it. Used to
// be a bare "Blog" heading with no visual weight at all — this gives the
// page the same kind of arrival the other content pages already have.
const CONTAINER_INSET = "max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))";

export function BlogHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

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
          alt="A young girl holding books in a classroom"
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
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24 sm:h-32"
          style={{ background: "linear-gradient(to bottom, transparent, #FCFAF6)" }}
          aria-hidden="true"
        />
      </div>

      <div className="relative min-h-[360px] sm:min-h-[420px] flex items-center py-14">
        <div className="pr-6 max-w-xl" style={{ paddingLeft: CONTAINER_INSET }}>
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
            className="mt-4 font-display text-4xl sm:text-5xl leading-[1.08] text-ink"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.65, delay: 0.15, ease: "easeOut" }}
          >
            Stories, updates, and what we're learning.
          </motion.h1>

          <motion.p
            className="mt-5 text-muted max-w-md leading-relaxed"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            Notes from the field, updates on ongoing cases, and everything else
            we want to share beyond the numbers.
          </motion.p>
        </div>
      </div>
    </section>
  );
}
