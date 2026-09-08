import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { CoverflowCarousel, type CoverflowSlide } from "@/components/ui/CoverflowCarousel";
import charityImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";

type ApiCase = {
  id: string;
  title: string;
  tagline: string | null;
  description: string;
  location: string;
  amountNeeded: number;
  amountCollected: number;
  imageUrl: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function OngoingTeaser() {
  const [, navigate] = useLocation();
  const [cases, setCases] = useState<ApiCase[]>([]);

  useEffect(() => {
    // Numbered in the carousel by however recently they went live —
    // most-recent-first, capped to a manageable set for a home page
    // section rather than the full ongoing-projects list.
    api.get<{ cases: ApiCase[] }>("/api/cases?status=ongoing").then((data) => setCases(data.cases.slice(0, 10)));
  }, []);

  if (cases.length === 0) return null;

  const slides: CoverflowSlide[] = cases.map((c) => ({
    src: c.imageUrl || charityImg,
    alt: c.title,
    title: c.title,
    // Falls back to a trimmed excerpt of the description when no tagline
    // has been set — see the admin case editor's "Short tagline" field.
    subtitle: c.tagline || (c.description.length > 90 ? `${c.description.slice(0, 90)}…` : c.description),
    meta: [
      { label: "Needed", value: `PKR ${c.amountNeeded.toLocaleString()}` },
      { label: "Started", value: formatDate(c.createdAt) },
      { label: "Collected", value: `PKR ${c.amountCollected.toLocaleString()}` },
    ],
  }));

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32 -z-0"
        style={{ background: "linear-gradient(to bottom, #FCFAF6, rgba(255,255,255,0))" }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">Ongoing Cases</span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">Steps in progress right now.</h2>
          <p className="mt-1 text-sm text-muted">Drag to browse, or click a case to open it.</p>
        </div>

        <div className="mt-10">
          <CoverflowCarousel
            slides={slides}
            showCaption
            showNavigation
            label="Ongoing cases"
            onSlideClick={(index) => navigate(`/cases/${cases[index].id}`)}
          />
        </div>

        <div className="mt-4 text-center">
          <a
            href="/ongoing-projects"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-white hover:gap-2.5 transition-all"
          >
            Check All Cases <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
