import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { UserPlus, ShieldCheck, ArrowRight } from "lucide-react";
import teamImg from "@assets/gallery/volunteers_hero_team.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const CONTAINER_INSET = "max(1.5rem,calc((100vw - 72rem) / 2 + 1.5rem))";

export function VolunteersHero({ ctaLabel, ctaHref, ctaDisabled }: { ctaLabel: string; ctaHref: string; ctaDisabled?: boolean }) {
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  // Subtle parallax: banner image moves upward at ~50% of scroll speed while this section is on screen.
  useEffect(() => {
    function onScroll() {
      const el = imgWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      setOffset(window.scrollY * 0.5);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative w-full overflow-hidden">
      <div ref={imgWrapRef} className="absolute inset-0 -z-10">
        <motion.img
          src={teamImg}
          alt="Aik Kadam volunteers standing together overlooking the mountains"
          className="w-full h-full object-cover"
          style={{ transform: `translateY(${-offset}px)` }}
          initial={{ scale: 1.04 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/10" />
      </div>

      <div className="pr-6 py-16 sm:py-20 max-w-2xl" style={{ paddingLeft: CONTAINER_INSET }}>
        <motion.span
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-primary uppercase"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Volunteers
        </motion.span>

        <motion.h1
          className="mt-4 font-display text-4xl sm:text-5xl leading-[1.08] text-ink"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        >
          The People Behind
          <br />
          Every <span className="text-primary">Change.</span>
        </motion.h1>

        <motion.p
          className="mt-5 text-muted max-w-md leading-relaxed"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          Every volunteer is admin-verified.
          <br />
          Their badge ID is publicly checkable.
        </motion.p>

        <motion.div
          className="mt-6 flex flex-wrap items-center gap-5"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
        >
          {!ctaDisabled && (
            <Link
              href={ctaHref}
              className="group/cta inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-background transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
            >
              <UserPlus size={15} /> {ctaLabel}
              <ArrowRight size={14} className="transition-transform duration-200 group-hover/cta:translate-x-1" />
            </Link>
          )}
          {ctaDisabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-6 py-3 text-sm font-semibold">
              {ctaLabel}
            </span>
          )}
          <a href="#verification" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary transition-colors">
            <ShieldCheck size={15} className="text-primary" /> How We Verify
          </a>
        </motion.div>
      </div>
    </section>
  );
}
