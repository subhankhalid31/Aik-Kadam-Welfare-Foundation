import { Link } from "wouter";
import { FilePlus2, UserPlus } from "lucide-react";

// A short, high-contrast intro banner that sits above the main Hero —
// mirrors the "thin colored top bar → pill tag → big bold headline → CTA
// pair" pattern, adapted to Aik Kadam's own copy and button styling
// (rounded-xl, not full pills, so the two CTAs read as distinct actions
// rather than two look-alike blobs).
export function IntroBanner() {
  return (
    <section className="relative">
      <div className="h-1.5 w-full bg-accent" />

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-14 text-center">
        <span className="inline-block rounded-md bg-accent px-3 py-1.5 text-sm font-bold text-ink">
          Pakistan's most transparent giving platform
        </span>

        <h1 className="mt-6 font-shout text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] text-ink">
          Where traceable
          <br />
          giving starts
        </h1>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/post-case"
            className="inline-flex items-center gap-2 rounded-xl bg-ink px-7 py-3.5 font-semibold text-white shadow-sm hover:bg-ink/85 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <FilePlus2 size={17} /> Submit a Case
          </Link>
          <Link
            href="/volunteers/register"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-ink/15 px-7 py-3.5 font-semibold text-ink hover:border-ink/30 hover:bg-white transition-colors"
          >
            <UserPlus size={17} /> Register as Volunteer
          </Link>
        </div>
      </div>
    </section>
  );
}
