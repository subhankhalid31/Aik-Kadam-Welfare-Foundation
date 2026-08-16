import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, Quote, ArrowRight } from "lucide-react";
import founderPhoto from "@assets/founder.jpeg";

// The founder section, restored to its original design (organic blob
// shapes behind a blob-masked photo, a decorative heart + dot grid, a
// floating "100% Transparent Giving" badge, and a quote card with a
// signature) — recolored from the old blue-ish `primary` to the current
// brand green/yellow palette, everything else kept as it was.
export function Founder() {
  return (
    <section id="founder" className="relative pt-2 sm:pt-4 lg:pt-20 pb-20 sm:pb-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[0.95fr_1.05fr] gap-16 lg:gap-20 items-center">
        {/* Left: short intro, pointing to the fuller story on /about */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-xs font-semibold tracking-[0.15em] text-brand-green uppercase">
            Meet Our Founder
          </span>
          <h2 className="mt-3 font-serif font-semibold text-4xl sm:text-5xl leading-[1.05] tracking-tight text-ink">
            A promise made real,
            <br />
            <span className="italic text-accent">one step at a time.</span>
          </h2>
          <p className="mt-5 text-muted leading-[1.7] text-[15px]">
            Every day, countless people want to change someone's life.
            Yet many hold back, not because they lack compassion,
            but because they lack trust. Aik Kadam was built to
            bridge that gap.We verify every case, track every rupee
            with complete transparency, and showcase every volunteer's
            impact ' turning generosity into real, visible change.
            Here, trust isn't promised; it's proven..
          </p>
          <Link
            href="/about"
            className="group mt-6 inline-flex items-center gap-2 font-semibold text-ink hover:text-brand-green-dark transition-colors"
          >
            Read our full story
            <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Right: founder photo, shapes, and quote card */}
        <motion.div
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Multiple organic blobs behind the photo for visual interest */}
          <motion.div
            className="absolute -inset-8 -z-10 bg-brand-green/[0.14]"
            style={{ borderRadius: "58% 42% 37% 63% / 45% 60% 40% 55%" }}
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -inset-12 -z-10 bg-brand-green/[0.08]"
            style={{ borderRadius: "42% 58% 63% 37% / 55% 45% 60% 40%" }}
            animate={{ rotate: [8, -8, 8] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -inset-4 -z-10 bg-brand-green/[0.06]"
            style={{ borderRadius: "70% 30% 50% 50% / 60% 40% 60% 40%" }}
            animate={{ rotate: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Decorative outline heart, top-left of the image */}
          <Heart className="absolute -left-2 top-0 text-brand-green/40" size={28} strokeWidth={1.5} />

          {/* Decorative dot grid, left edge of the image */}
          <div className="absolute -left-5 bottom-36 grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-green/30" />
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
              loading="lazy"
              width={480}
              height={600}
            />
          </div>

          {/* Floating "100% Transparent Giving" badge */}
          <div className="absolute -top-4 -right-2 sm:-right-6 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-brand-green flex items-center justify-center shrink-0">
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
          <div className="relative mt-1 sm:mt-0 sm:absolute sm:-bottom-10 sm:-left-5 sm:-right-5 bg-white rounded-2xl shadow-xl p-5 sm:p-6">
            <Quote size={22} className="text-brand-green/30 fill-brand-green/10" />
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
              <div className="text-3xl text-brand-green leading-none" style={{ fontFamily: "'Bastliga One', cursive" }}>
                Subhan
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
