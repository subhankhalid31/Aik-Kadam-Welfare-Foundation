import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────
// Adapted from the user-provided TestimonialCarousel (profile-card-
// testimonial-carousel): same "big photo left, overlapping card right"
// layout and the same desktop/mobile split. What changed:
//   - Next.js `Image`/`Link` swapped for plain `img`/`a` (this is a Vite
//     app, not Next).
//   - The social-icon row (GitHub/Twitter/YouTube/LinkedIn) doesn't apply
//     to a volunteer — replaced with real volunteer stats (city, hours,
//     cases completed) and their motto instead of a testimonial quote.
//   - Retthemed off this site's actual tokens (ink/primary/card/border/
//     muted) instead of plain gray-scale/dark-mode classes.
//   - Added autoplay with wraparound looping, paused on hover — the
//     original only advanced on manual click.
//   - Nav buttons now use the same `glass-pill` round liquid-glass button
//     the rest of the site's carousels use (WheelCarousel, the blog
//     carousel) instead of a plain bordered circle.
//   - The crossfade was a plain opacity fade with no sense of direction —
//     swapped for a slide+fade that enters from the right on "next" /
//     from the left on "previous" (and exits the opposite way), so it's
//     clear which direction you're moving.
// ─────────────────────────────────────────────────────────────────────────

export type CarouselVolunteer = {
  badgeId: string;
  name: string;
  city: string | null;
  avatarUrl: string | null;
  motto: string | null;
  category: string | null;
  hours: number;
  casesCompleted: number;
};

const AUTOPLAY_MS = 5000;

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

// `custom` (the direction, +1/-1) decides which side a slide starts/ends
// on — framer-motion re-evaluates these functions per direction whenever
// AnimatePresence's `custom` prop changes, so the same variant object
// works for both "next" and "previous".
const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 36 : -36 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -36 : 36 }),
};

export function VolunteerCarousel({ volunteers, className }: { volunteers: CarouselVolunteer[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const count = volunteers.length;

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  const current = volunteers[index];

  function handleNext() {
    setDirection(1);
    setIndex((i) => (i + 1) % count);
  }

  function handlePrevious() {
    setDirection(-1);
    setIndex((i) => (i - 1 + count) % count);
  }

  function goTo(target: number) {
    setDirection(target > index ? 1 : -1);
    setIndex(target);
  }

  return (
    <div
      className={cn("w-full max-w-5xl mx-auto px-4", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Desktop layout */}
      <div className="hidden md:flex relative items-center">
        {/* Photo — left */}
        <div className="w-[380px] h-[380px] rounded-3xl overflow-hidden bg-background flex-shrink-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.badgeId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {current.avatarUrl ? (
                <img src={current.avatarUrl} alt={current.name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/12 font-display text-6xl font-bold text-primary">
                  {initialsFor(current.name)}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Card — right, overlapping the photo */}
        <div className="bg-card rounded-3xl shadow-2xl p-8 ml-[-64px] z-10 max-w-xl flex-1 border border-border overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.badgeId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Volunteer #{index + 1}
              </span>
              <div className="mt-3 mb-5">
                <h2 className="text-2xl font-display font-bold text-ink mb-1">{current.name}</h2>
                {current.city && (
                  <p className="flex items-center gap-1.5 text-sm font-medium text-muted">
                    <MapPin size={13} /> {current.city}
                  </p>
                )}
              </div>

              <p className="text-ink/85 text-base leading-relaxed mb-7">
                {current.motto || "One of the dedicated volunteers powering Aik Kadam's work on the ground."}
              </p>

              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-xs font-semibold text-ink">
                  <Clock size={13} className="text-primary" /> {current.hours} hrs contributed
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3.5 py-1.5 text-xs font-semibold text-ink">
                  <Briefcase size={13} className="text-primary" /> {current.casesCompleted} case{current.casesCompleted === 1 ? "" : "s"} completed
                </span>
                {current.category && (
                  <span className="inline-flex items-center rounded-full bg-background px-3.5 py-1.5 text-xs font-semibold text-ink">
                    {current.category}
                  </span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden max-w-sm mx-auto text-center overflow-hidden">
        <div className="w-full aspect-square bg-background rounded-3xl overflow-hidden mb-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.badgeId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full"
            >
              {current.avatarUrl ? (
                <img src={current.avatarUrl} alt={current.name} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/12 font-display text-5xl font-bold text-primary">{initialsFor(current.name)}</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="px-2 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.badgeId}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeInOut" }}
            >
              <h2 className="text-xl font-display font-bold text-ink mb-1">{current.name}</h2>
              {current.city && (
                <p className="flex items-center justify-center gap-1.5 text-sm font-medium text-muted mb-3">
                  <MapPin size={13} /> {current.city}
                </p>
              )}
              <p className="text-ink/85 text-sm leading-relaxed mb-5">
                {current.motto || "One of the dedicated volunteers powering Aik Kadam's work on the ground."}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-ink">
                  <Clock size={12} className="text-primary" /> {current.hours} hrs
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs font-semibold text-ink">
                  <Briefcase size={12} className="text-primary" /> {current.casesCompleted} case{current.casesCompleted === 1 ? "" : "s"}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Controls — same glass-pill round button used by every other
          carousel on the site (see WheelCarousel / BlogStaggerCarousel),
          not a bespoke bordered circle. */}
      {count > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <div className="glass-pill-wrap">
            <button onClick={handlePrevious} aria-label="Previous volunteer" className="glass-pill relative isolate rounded-full block h-10 w-10">
              <span className="glass-pill-text flex items-center justify-center h-10 w-10">
                <ChevronLeft size={17} />
              </span>
            </button>
            <div className="glass-pill-shadow rounded-full" />
          </div>

          <div className="flex gap-2">
            {volunteers.map((v, i) => (
              <button
                key={v.badgeId}
                onClick={() => goTo(i)}
                className={cn("w-2.5 h-2.5 rounded-full transition-colors", i === index ? "bg-primary" : "bg-border")}
                aria-label={`Go to volunteer ${i + 1}`}
              />
            ))}
          </div>

          <div className="glass-pill-wrap">
            <button onClick={handleNext} aria-label="Next volunteer" className="glass-pill relative isolate rounded-full block h-10 w-10">
              <span className="glass-pill-text flex items-center justify-center h-10 w-10">
                <ChevronRight size={17} />
              </span>
            </button>
            <div className="glass-pill-shadow rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

