import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ArrowCta } from "@/components/ui/ArrowCta";
import { BrushStroke } from "@/components/ui/BrushStroke";
import { Link } from "wouter";
// Placeholder photo — swap for a final hero portrait whenever it's ready.
// (The previous `hero-hands-bg.webp` asset was a near-white abstract
// texture, not an actual photo, which is why the masked shape was
// rendering as a faint white blob instead of a photo.)
import heroPhoto from "@assets/gallery/happy_young_girl_holding_books_in_classroom.webp";

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
    // overflow-visible so the world map + beige silhouette behind the
    // photo can bleed upward past this section's own boundary, up under
    // the transparent navbar, instead of being clipped at the top edge.
    <section className="relative overflow-visible">
      <div className="relative max-w-[1240px] mx-auto px-6 lg:px-10 pt-20 sm:pt-28 pb-20 sm:pb-28 grid lg:grid-cols-[45%_55%] gap-16 lg:gap-8 items-center">
        {/* Left: editorial serif headline + compact CTAs. 45% column,
            capped paragraph width, generous whitespace throughout. */}
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-[520px]">
          <motion.h1
            variants={item}
            className="font-serif font-extrabold text-5xl sm:text-6xl lg:text-[4.2rem] leading-[0.98] tracking-tight text-ink"
          >
            One step
            <br />
            <span className="relative inline-block">
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
                />
              </svg>
            </span>
            <br />
            a life forever.
          </motion.h1>

          <motion.p variants={item} className="mt-7 text-[18px] leading-[1.7] text-muted max-w-[500px]">
            We are building a borderless Pakistan where every child receives
            food, education, and hope to shape a brighter tomorrow.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-6">
            <ArrowCta href="/donate" variant="ink" shape="rect" size="sm" sheen>Donate now</ArrowCta>
            <Link
              href="/ongoing-projects"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-brand-green-dark transition-colors"
            >
              Our Work
              <ArrowRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right: faint world map + solid beige silhouette "shadow" behind
            a large Pakistan-masked photo, with real overlapping brush
            strokes and a small stat badge. 55% column, visual focus. */}
        <motion.div
          className="relative flex justify-center lg:justify-end lg:pr-4"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Layer 1 (furthest back): large faint world map texture,
              pulled up far enough to extend behind the fixed navbar at the
              top of the page — this is deliberately a big negative offset,
              not a subtle one, so the map is genuinely visible peeking out
              from under the transparent nav rather than just implied. */}
          <img
            src="/world-map.svg"
            alt=""
            aria-hidden="true"
            className="absolute -top-[220px] sm:-top-[260px] lg:-top-[300px] left-1/2 -translate-x-1/2 w-[760px] sm:w-[900px] lg:w-[1040px] max-w-none opacity-[0.08] -z-20 select-none"
          />

          {/* Layer 2: solid beige duplicate of the Pakistan silhouette,
              offset up and to the right behind the actual photo — the
              "shadow map" that peeks out around the photo's edges. Sized
              larger than the photo and pulled up enough to also reach
              behind the navbar, same idea as the world map above it. */}
          <div
            className="absolute -top-24 sm:-top-32 lg:-top-40 -right-6 sm:right-0 w-[110%] sm:w-[105%] aspect-[4/5] -z-10"
            style={{
              backgroundColor: "#E8D8C3",
              WebkitMaskImage: "url(/pakistan-mask.png)",
              maskImage: "url(/pakistan-mask.png)",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
            }}
            aria-hidden="true"
          />

          {/* Layer 3: brush-stroke accents, sized generously and
              deliberately overlapping the photo's edges (not floating off
              to the side) — real jagged dry-brush marks, green + mustard
              only. */}
          <BrushStroke
            color="#7CB342"
            className="absolute left-[6%] top-[6%] w-44 sm:w-56 h-11 sm:h-14 -rotate-[12deg] z-20 drop-shadow-sm"
          />
          <BrushStroke
            color="#D89A00"
            className="absolute right-[2%] sm:-right-2 bottom-[24%] w-40 sm:w-52 h-10 sm:h-12 rotate-[8deg] z-20 drop-shadow-sm"
          />

          {/* Photo, clipped to the Pakistan silhouette — large, clean
              edges, no blur, no colour overlay */}
          <div className="relative w-full max-w-[420px] sm:max-w-[480px] lg:max-w-[520px] aspect-[4/5] z-10">
            <div
              className="absolute inset-0"
              style={{
                WebkitMaskImage: "url(/pakistan-mask.png)",
                maskImage: "url(/pakistan-mask.png)",
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskPosition: "center",
              }}
            >
              <img
                src={heroPhoto}
                alt="A child supported by Aik Kadam's programs in Pakistan"
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            {/* Stat badge — small, bottom-right, yellow circle with a
                green brush stroke tucked behind it */}
            <div className="absolute -bottom-3 right-0 sm:-right-4 z-30">
              <BrushStroke
                color="#7CB342"
                className="absolute -left-7 -top-3 w-28 h-9 rotate-[-8deg] -z-10 opacity-90"
              />
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-accent shadow-lg flex flex-col items-center justify-center text-center">
                <div className="font-serif font-bold text-2xl sm:text-[1.7rem] text-ink leading-none">100+</div>
                <div className="mt-1 text-[10px] sm:text-[11px] text-ink/75 leading-tight px-1">
                  families helped<br />across Pakistan
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
