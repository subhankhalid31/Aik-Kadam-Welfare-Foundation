import { motion } from "framer-motion";
import { HandHeart, Users, ShieldCheck, FilePlus2, UserPlus } from "lucide-react";
import { ArrowCta } from "@/components/ui/ArrowCta";
import handsPhoto from "@assets/hero-hands-bg.webp";

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
      <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-16 sm:pb-24 grid lg:grid-cols-[1.05fr_0.95fr] gap-16 lg:gap-10 items-center">
        {/* Left: mission + CTA */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-4 py-2 text-xs font-bold tracking-wide text-brand-green-dark uppercase"
          >
            <HandHeart size={15} />
            Aik Kadam &mdash; One Step
          </motion.span>

          <motion.h1 variants={item} className="mt-6 font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.4rem] leading-[1.08] text-ink">
            Where one step
            <br />
            <span className="relative inline-block italic">
              changes everything.
              <svg
                className="absolute left-0 -bottom-1.5 w-full pointer-events-none"
                height="10"
                viewBox="0 0 300 10"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 7 Q 40 2, 80 6 T 160 6 T 240 6 T 298 5"
                  stroke="#E09010"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p variants={item} className="mt-6 text-lg text-muted max-w-lg leading-relaxed">
            Every rupee is tracked from your hands to theirs, every case is
            verified before it's shared, and every volunteer's work is
            visible online &mdash; charity you don't have to take on faith.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center gap-4">
            <ArrowCta href="/post-case" icon={FilePlus2} variant="solid">Submit a Case</ArrowCta>
            <ArrowCta href="/volunteers/register" icon={UserPlus} variant="outline">Register as Volunteer</ArrowCta>
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
                  <Icon size={18} className="text-brand-green shrink-0" />
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

        {/* Right: photo cut into the shape of our own logo mark (Pakistan +
            reaching hands) with loose paint-stroke colour accents behind it */}
        <motion.div
          className="relative flex justify-center lg:justify-end"
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {/* Loose brush-stroke accents, echoing the reference layout */}
          <div
            className="absolute -left-6 top-10 -z-10 h-16 w-40 bg-brand-green/70 blur-md"
            style={{ borderRadius: "60% 40% 50% 50% / 40% 60% 40% 60%", transform: "rotate(-18deg)" }}
          />
          <div
            className="absolute -right-2 top-1/3 -z-10 h-14 w-36 bg-brand-orange/70 blur-md"
            style={{ borderRadius: "50% 50% 60% 40% / 60% 40% 60% 40%", transform: "rotate(12deg)" }}
          />
          <div
            className="absolute left-10 bottom-16 -z-10 h-12 w-32 bg-brand-green/50 blur-md"
            style={{ borderRadius: "40% 60% 50% 50% / 50% 50% 60% 40%", transform: "rotate(6deg)" }}
          />

          {/* Photo masked into the logo's own Pakistan + reaching-hands
              silhouette, instead of a generic blob or rectangle */}
          <div
            className="relative w-full max-w-md aspect-[4/5]"
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
              src={handsPhoto}
              alt="Volunteers and donors joining hands across Pakistan"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Stat badge, bottom-right, echoing the reference layout's
              circular number callout */}
          <div className="absolute -bottom-4 right-2 sm:right-8 h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white shadow-xl border border-border flex flex-col items-center justify-center text-center px-2">
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-brand-orange leading-none">100+</div>
            <div className="mt-1 text-[11px] sm:text-xs text-muted leading-tight">
              families helped<br />across Pakistan
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
