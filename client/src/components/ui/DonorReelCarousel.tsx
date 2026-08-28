import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicTopDonor } from "@shared/schema";

// ─────────────────────────────────────────────────────────────────────────
// Adapted from the user-provided ScrollReelTestimonials: the portrait reel
// (counter-rotating side columns, a real vertical list of tiles that slides
// by one "pitch" per step) is kept essentially as-is — that's the
// distinctive part of the design. What changed:
//   - Retthemed off this site's actual Tailwind tokens (ink/primary/
//     background/border/muted/card) instead of shadcn tokens like
//     `bg-secondary`/`text-foreground`/`ring-ring` that don't exist here.
//   - The per-character CSS-keyframe text animation was swapped for a
//     framer-motion crossfade+slide (this app already uses framer-motion
//     everywhere else, and it's far less fragile than hand-computed
//     character delay offsets).
//   - Auto-advances on a timer and wraps around at the end (the original
//     was manual-only and stopped dead at the last slide) — pauses while
//     the pointer is over it so it doesn't fight someone trying to read.
//   - The featured tile shows a donor's real photo, or a generated
//     initials avatar in a deterministic color when they don't have one.
// ─────────────────────────────────────────────────────────────────────────

const CELL = 100;
const GAP = 8;
const STEP = 3 * (CELL + GAP);
const SLIDE_MS = 800;
const AUTOPLAY_MS = 4500;
const EASE_INOUT = "cubic-bezier(0.65,0,0.35,1)";

const AVATAR_COLORS = ["#7CB342", "#5F8F2E", "#F4B400", "#1F8A5F", "#B7791F", "#9CC96C"];

function avatarColorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function Cell() {
  return (
    <div
      aria-hidden="true"
      className="shrink-0 rounded-xl border border-border bg-gradient-to-b from-background to-card blur-[1px]"
      style={{ width: CELL, height: CELL }}
    />
  );
}

function Featured({ donor }: { donor: PublicTopDonor }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl bg-background shadow-[0_8px_20px_-6px_rgba(21,21,21,0.25)]"
      style={{ width: CELL, height: CELL }}
    >
      {donor.photoUrl ? (
        <img src={donor.photoUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-white"
          style={{ background: avatarColorFor(donor.id) }}
        >
          {initialsFor(donor.displayName)}
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/25 via-transparent to-transparent" />
    </div>
  );
}

export function DonorReelCarousel({ donors }: { donors: PublicTopDonor[] }) {
  const count = donors.length;
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);
  const animating = useRef(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setMounted(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  const paginate = useCallback(
    (dir: 1 | -1) => {
      if (animating.current || count === 0) return;
      animating.current = true;
      setIndex((prev) => (prev + dir + count) % count);
      setTimeout(() => {
        animating.current = false;
      }, SLIDE_MS);
    },
    [count],
  );

  // Auto-advance, one donor at a time, looping forever — paused while the
  // pointer is resting over the carousel so it doesn't yank a message away
  // mid-read.
  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => paginate(1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, paginate]);

  const middleItems = useMemo(() => {
    const items: Array<{ type: "cell" } | { type: "featured"; i: number }> = [];
    for (let i = 0; i < 3; i++) items.push({ type: "cell" });
    donors.forEach((_, i) => {
      items.push({ type: "featured", i });
      if (i < count - 1) items.push({ type: "cell" }, { type: "cell" });
    });
    for (let i = 0; i < 3; i++) items.push({ type: "cell" });
    return items;
  }, [donors, count]);

  if (count === 0) return null;

  const sideCellCount = 4 + 2 * count;
  const centerIdx = (count - 1) / 2;
  const middleY = (centerIdx - index) * STEP;
  const sideY = -middleY;
  const current = donors[index];

  const colStyle = (y: number): React.CSSProperties => ({
    transform: `translateY(${y}px)`,
    transition: mounted ? `transform ${SLIDE_MS}ms ${EASE_INOUT}` : "none",
  });

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative flex w-full max-w-[1000px] flex-col items-stretch gap-2.5 overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:min-h-[300px] md:flex-row mx-auto"
    >
      {/* Reel */}
      <div
        aria-hidden="true"
        className="relative h-48 w-full shrink-0 self-stretch overflow-hidden md:h-auto md:w-[340px]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 14%, black 86%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-cream/40">
          <div className="flex shrink-0 flex-col gap-2 will-change-transform" style={colStyle(sideY)}>
            {Array.from({ length: sideCellCount }).map((_, i) => <Cell key={i} />)}
          </div>
          <div className="flex shrink-0 flex-col gap-2 will-change-transform" style={colStyle(middleY)}>
            {middleItems.map((item, i) => (item.type === "featured" ? <Featured key={i} donor={donors[item.i]} /> : <Cell key={i} />))}
          </div>
          <div className="flex shrink-0 flex-col gap-2 will-change-transform" style={colStyle(sideY)}>
            {Array.from({ length: sideCellCount }).map((_, i) => <Cell key={i} />)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch px-6 py-7 md:py-9">
        <div className="flex flex-col gap-2.5">
          <Quote size={30} className="text-primary/25" fill="currentColor" strokeWidth={0} />

          <div className="relative min-h-[92px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <p className="text-[15px] sm:text-base font-medium leading-snug text-ink line-clamp-3">
                  {current.message ? `"${current.message}"` : "A generous supporter of Aik Kadam."}
                </p>
                <p className="mt-2.5 text-sm font-semibold text-ink">{current.displayName}</p>
                <p className="mt-0.5 text-xs text-muted">
                  Funded {current.casesFunded} case{current.casesFunded === 1 ? "" : "s"} · PKR {current.totalDonated.toLocaleString()} donated
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {count > 1 && (
          <div className="mt-6 flex items-center gap-2 md:mt-0">
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous donor"
              className="grid h-7 w-7 place-items-center rounded-full border border-border text-ink/70 transition-transform hover:scale-105 hover:bg-background active:scale-95"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next donor"
              className="grid h-7 w-7 place-items-center rounded-full border border-border text-ink/70 transition-transform hover:scale-105 hover:bg-background active:scale-95"
            >
              <ChevronRight size={14} />
            </button>
            <div className="ml-1 flex items-center gap-1">
              {donors.map((d, i) => (
                <span key={d.id} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-4 bg-primary" : "w-1.5 bg-border")} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
