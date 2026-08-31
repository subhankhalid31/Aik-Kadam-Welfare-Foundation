import unityImg from "@assets/gallery/diverse_hands_joining_together_in_unity_against_blue_sky.webp";
import elderlyImg from "@assets/gallery/elderly_person_smiling_with_caregiver.webp";
import girlImg from "@assets/gallery/happy_young_girl_holding_books_in_classroom.webp";
import pakistanImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";
import foodImg from "@assets/gallery/volunteers_handing_out_food_to_community.webp";
import familyImg from "@assets/gallery/family_enjoying_a_healthy_meal_together.webp";
import { motion } from "framer-motion";
import { NgoImageSlideshow } from "@/components/ui/NgoImageSlideshow";
import { ABOUT_MEDIA_ITEMS, type AboutMediaItem } from "@/lib/about-media";

// Fallback set, only used if client/src/assets/about-media/ is empty — see
// that folder's README for how to replace these with real photos/videos
// without touching any code. Once at least one file is dropped in there,
// these are never shown.
const FALLBACK_MEDIA: AboutMediaItem[] = [
  { type: "image", src: unityImg, caption: "Volunteers and donors, united behind one mission" },
  { type: "image", src: foodImg, caption: "Food drives reaching families across Pakistan" },
  { type: "image", src: girlImg, caption: "Education support for children in need" },
  { type: "image", src: elderlyImg, caption: "Care and companionship for the elderly" },
  { type: "image", src: pakistanImg, caption: "On the ground, wherever the need is greatest" },
  { type: "image", src: familyImg, caption: "A healthy meal, made possible by your donation" },
];

const ABOUT_MEDIA = ABOUT_MEDIA_ITEMS.length > 0 ? ABOUT_MEDIA_ITEMS : FALLBACK_MEDIA;

const milestones = [
  { year: "2024", label: "Founded in Lahore with a single case funded by 12 donors" },
  { year: "2025", label: "Expanded to 6 cities, first class of verified volunteers onboarded" },
  { year: "2026", label: "Full transparency tracking launched, every rupee traceable" },
];

export function About() {
  return (
    <section id="about" className="relative py-24 bg-background">
      {/* Bottom curve for smooth transition to HowItWorks section */}
      <svg className="absolute bottom-0 left-0 w-full h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,40 C360,100 1080,100 1440,40 L1440,100 L0,100 Z" fill="currentColor" />
      </svg>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <NgoImageSlideshow items={ABOUT_MEDIA} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">
            Our Story
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl leading-tight text-ink">
            Charity built the way trust actually works, <span className="italic text-brand-green"> step by visible step.</span>
          </h2>
          <p className="mt-5 text-muted leading-relaxed">
            Aik Kadam was born from a simple observation by our founder, Subhan
            Khalid: while many have the heart to give, few have a platform they
            can truly trust. We built Aik Kadam so that every contribution is a
            transparent step toward dignity and self-reliance for those in
            crisis, not just a transaction that disappears into a black box.
          </p>

          <ol className="mt-8 space-y-5">
            {milestones.map((m, i) => (
              <motion.li
                key={m.year}
                className="group flex gap-4 rounded-xl -mx-2 px-2 py-1 transition-all duration-250 hover:bg-brand-green/5 hover:translate-x-1"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.1 }}
              >
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs text-brand-green transition-colors duration-250 group-hover:text-brand-green-dark">{m.year}</span>
                  <div className="relative mt-1.5 h-2 w-2 shrink-0">
                    <motion.span
                      className="absolute -inset-1.5 rounded-full bg-brand-green/60 blur-[3px]"
                      initial={{ opacity: 0.25 }}
                      whileInView={{ opacity: [0.25, 0.85, 0.25] }}
                      viewport={{ once: false, amount: 0.8 }}
                      transition={{ duration: 2.2, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                    />
                    <span className="relative block h-2 w-2 rounded-full bg-brand-green shadow-[0_0_6px_2px_rgba(112,152,40,0.55)] transition-transform duration-250 group-hover:scale-125" />
                  </div>
                  {i < milestones.length - 1 && (
                    <span className="mt-1.5 w-px flex-1 bg-border" />
                  )}
                </div>
                <p className="text-sm text-ink/80 pb-4 transition-colors duration-250 group-hover:text-ink">{m.label}</p>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </div>
    </section>
  );
}
