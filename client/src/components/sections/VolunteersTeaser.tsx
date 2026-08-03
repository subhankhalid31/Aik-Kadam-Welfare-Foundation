import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { VolunteerCard, type VolunteerCardProps } from "@/components/ui/VolunteerCard";
import { api } from "@/lib/api";

type ApiVolunteer = {
  badgeId: string;
  name: string;
  city: string | null;
  avatarUrl: string | null;
  motto: string | null;
  hours: number;
  projects: string[];
  joined: string;
};

function formatMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function VolunteersTeaser() {
  const [volunteers, setVolunteers] = useState<VolunteerCardProps[]>([]);

  useEffect(() => {
    api.get<{ volunteers: ApiVolunteer[] }>("/api/volunteers").then((data) => {
      setVolunteers(
        data.volunteers.slice(0, 4).map((v) => ({
          badgeId: v.badgeId,
          name: v.name,
          city: v.city ?? undefined,
          avatarUrl: v.avatarUrl ?? undefined,
          quote: v.motto,
          projects: v.projects,
          hours: v.hours,
          joined: formatMonthYear(v.joined),
        })),
      );
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
        <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">Our People</span>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">Top volunteers this month.</h2>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {volunteers.map((v) => (
            <VolunteerCard key={v.badgeId} {...v} />
          ))}
        </div>

        <div className="mt-8 text-center">
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
