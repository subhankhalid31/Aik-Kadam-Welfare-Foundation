import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { VolunteerCarousel, type CarouselVolunteer } from "@/components/ui/VolunteerCarousel";
import { api } from "@/lib/api";

export function VolunteersTeaser() {
  const [volunteers, setVolunteers] = useState<CarouselVolunteer[]>([]);

  useEffect(() => {
    // Top 5-10 by hours contributed, admin-hidden ones excluded — see
    // /api/volunteers/top-carousel. Auto-updates as hours change, no
    // separate rank number to keep in sync.
    api.get<{ volunteers: CarouselVolunteer[] }>("/api/volunteers/top-carousel").then((data) => {
      setVolunteers(data.volunteers);
    });
  }, []);

  if (volunteers.length === 0) return null;

  return (
    <section className="relative py-20">
      {/* Top curve for smooth transition from CompletedProjectsTeaser section */}
      <svg className="absolute top-0 left-0 w-full h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill="currentColor" />
      </svg>

      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">Our People</span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">Top volunteers powering our work.</h2>
        </div>

        <div className="mt-10">
          <VolunteerCarousel volunteers={volunteers} />
        </div>

        <div className="mt-10 text-center">
          <a
            href="/volunteers"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-white hover:gap-2.5 transition-all"
          >
            View Volunteers <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
