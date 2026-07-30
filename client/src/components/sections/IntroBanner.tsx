import { Link } from "wouter";
import { FilePlus2, UserPlus } from "lucide-react";
import { heroHandsBackground } from "@/lib/hero-hands-bg-data";

// A short, high-contrast intro banner that sits above the main Hero —
// mirrors the "thin colored top bar → pill tag → big bold headline → CTA
// pair" pattern, adapted to Aik Kadam's own copy and button styling
// (rounded-xl, not full pills, so the two CTAs read as distinct actions
// rather than two look-alike blobs).
//
// The hands background is embedded as an inline base64 data URI (see
// lib/hero-hands-bg-data.ts) rather than a separate image file — this
// guarantees it's always present with the code, with no separate asset
// file that could go missing on a copy/deploy.
//
// The image wrapper is sized to the source art's own aspect ratio
// (1717×916) only from the lg breakpoint up, where there's enough width
// that the resulting height comfortably exceeds the text content's real
// height. Below that, forcing the same aspect ratio makes the container
// too short for the badge+headline+subtitle+2 buttons on a narrow phone
// screen — since the text was absolutely centered inside it, the top and
// bottom would get clipped by the section's overflow-hidden (that's the
// "Register as Volunteer" button and part of the headline going missing
// on mobile). Below lg, content sits in normal flow instead and the
// section grows to fit it naturally; the image just cover-fits whatever
// height that ends up being.
export function IntroBanner() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="h-1.5 w-full bg-accent" />

      <div className="relative w-full lg:aspect-[1717/916]">
        <img
          src={heroHandsBackground}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Soft fade at the bottom so the art blends into the Hero section
            below instead of cutting off with a hard edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-background" />

        <div className="relative lg:absolute lg:inset-0 flex items-center justify-center px-6 py-14 lg:py-0">
          <div className="max-w-3xl text-center">
            <span className="inline-block rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-ink">
              Pakistan's most transparent giving platform
            </span>

            <h1 className="mt-6 font-shout text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] text-ink">
              Where <span className="text-primary">traceable</span>
              <br />
              giving starts
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted max-w-xl mx-auto leading-relaxed">
              Every contribution is tracked. Every story is verified.
              <br className="hidden sm:block" />
              Real impact. Real people. Real change.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="glass-pill-wrap">
                <Link href="/post-case" className="glass-pill relative isolate rounded-full block bg-ink">
                  <span className="glass-pill-text flex items-center gap-2 px-7 py-3.5 font-semibold text-white">
                    <FilePlus2 size={17} /> Submit a Case
                  </span>
                </Link>
                <div className="glass-pill-shadow rounded-full" />
              </div>
              <div className="glass-pill-wrap group">
                <Link href="/volunteers/register" className="glass-pill relative isolate rounded-full block">
                  <span className="glass-pill-text flex items-center gap-2 px-7 py-3.5 font-semibold">
                    <UserPlus size={17} className="transition-transform group-hover:scale-110" /> Register as Volunteer
                  </span>
                </Link>
                <div className="glass-pill-shadow rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
