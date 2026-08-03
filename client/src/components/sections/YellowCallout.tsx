import { ArrowCta } from "@/components/ui/ArrowCta";
import { FilePlus2 } from "lucide-react";

// A floating, lens-shaped yellow panel — curved on both the top and bottom
// edges — set apart from the stat band above with breathing room, so its
// irregular shape reads as intentional rather than colliding with the
// rectangular section above it.
export function YellowCallout() {
  return (
    <div className="my-8 sm:my-12 bg-beige">
      <section className="relative bg-accent py-24 px-6 text-center overflow-hidden">
        {/* top curve: yellow bulges upward in the middle, recedes near the edges */}
        <svg className="absolute top-0 left-0 w-full h-16 sm:h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
          <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill="currentColor" />
        </svg>

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-block rounded-full bg-ink/10 px-4 py-1.5 text-xs font-bold tracking-wide text-ink uppercase">
            We've got you covered
          </span>
          <h2 className="mt-5 font-shout text-3xl sm:text-5xl font-black text-ink leading-tight">
            Whatever the need, whether medical, education, or relief, you can ask here.
          </h2>
          <p className="mt-4 text-ink/80 leading-relaxed">
            From a single family's emergency to a whole neighborhood's flood
            relief, every case on Aik Kadam is reviewed, tracked, and reported
            back to the people who funded it.
          </p>
          <div className="mt-7 flex justify-center">
            <ArrowCta href="/post-case" icon={FilePlus2} variant="ink">Submit Your Case</ArrowCta>
          </div>
        </div>

        {/* bottom curve: yellow bulges downward in the middle, recedes near the edges */}
        <svg className="absolute bottom-0 left-0 w-full h-16 sm:h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
          <path d="M0,40 C360,100 1080,100 1440,40 L1440,100 L0,100 Z" fill="currentColor" />
        </svg>
      </section>
      </div>
  );
}
