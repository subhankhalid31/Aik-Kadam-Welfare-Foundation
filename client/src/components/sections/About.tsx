import unityImg from "@assets/gallery/diverse_hands_joining_together_in_unity_against_blue_sky.webp";
import elderlyImg from "@assets/gallery/elderly_person_smiling_with_caregiver.webp";
import girlImg from "@assets/gallery/happy_young_girl_holding_books_in_classroom.webp";
import pakistanImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";
import foodImg from "@assets/gallery/volunteers_handing_out_food_to_community.webp";
import familyImg from "@assets/gallery/family_enjoying_a_healthy_meal_together.webp";
import { NgoImageSlideshow } from "@/components/ui/NgoImageSlideshow";

// Placeholder set — swap these for real NGO/on-the-ground photos any time
// by replacing the files under client/src/attached_assets/gallery.
const NGO_IMAGES = [
  { src: unityImg, caption: "Volunteers and donors, united behind one mission" },
  { src: foodImg, caption: "Food drives reaching families across Pakistan" },
  { src: girlImg, caption: "Education support for children in need" },
  { src: elderlyImg, caption: "Care and companionship for the elderly" },
  { src: pakistanImg, caption: "On the ground, wherever the need is greatest" },
  { src: familyImg, caption: "A healthy meal, made possible by your donation" },
];

const milestones = [
  { year: "2024", label: "Founded in Lahore with a single case funded by 12 donors" },
  { year: "2025", label: "Expanded to 6 cities, first class of verified volunteers onboarded" },
  { year: "2026", label: "Full transparency tracking launched, every rupee traceable" },
];

export function About() {
  return (
    <section id="about" className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <NgoImageSlideshow images={NGO_IMAGES} />

        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            Our Story
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-tight text-ink">
            Charity built the way trust actually works, <span className="italic text-primary"> step by visible step.</span>
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
              <li key={m.year} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="font-mono text-xs text-primary">{m.year}</span>
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary" />
                  {i < milestones.length - 1 && (
                    <span className="mt-1.5 w-px flex-1 bg-border" />
                  )}
                </div>
                <p className="text-sm text-ink/80 pb-4">{m.label}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
