import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";
import { api } from "@/lib/api";
import { DonorReelCarousel } from "@/components/ui/DonorReelCarousel";
import type { PublicTopDonor } from "@shared/schema";

// Renders nothing at all when no donor has opted in yet — this is an
// entirely opt-in feature (see the donation form's "Show me on the Top
// Donors list" checkbox), so on a fresh install, or if nobody has opted
// in, the home page simply doesn't grow an empty section for it.
export function TopDonorsSection() {
  const [donors, setDonors] = useState<PublicTopDonor[] | null>(null);

  useEffect(() => {
    api.get<{ donors: PublicTopDonor[] }>("/api/top-donors").then((data) => setDonors(data.donors));
  }, []);

  if (donors !== null && donors.length === 0) return null;

  return (
    <section className="relative py-20 bg-background overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-green uppercase">
            <HeartHandshake size={14} /> Top Donors
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">The people making this possible.</h2>
          <p className="mt-1 text-sm text-muted max-w-md mx-auto">
            A few of our supporters who chose to be featured here, ranked by what they've given.
          </p>
        </div>

        <div className="mt-8">
          {donors === null ? (
            <div className="h-56 md:h-[300px] max-w-[1000px] mx-auto rounded-2xl border border-border bg-card animate-pulse" />
          ) : (
            <DonorReelCarousel donors={donors} />
          )}
        </div>
      </div>
    </section>
  );
}
