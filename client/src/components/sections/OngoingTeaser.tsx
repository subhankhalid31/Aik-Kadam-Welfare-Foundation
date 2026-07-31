import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import charityImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";

type ApiCase = {
  id: string;
  title: string;
  location: string;
  amountNeeded: number;
  amountCollected: number;
  imageUrl: string | null;
};

export function OngoingTeaser() {
  const [cases, setCases] = useState<ApiCase[]>([]);

  useEffect(() => {
    api.get<{ cases: ApiCase[] }>("/api/cases?status=ongoing").then((data) => setCases(data.cases.slice(0, 2)));
  }, []);

  if (cases.length === 0) return null;

  return (
    <section className="py-20 bg-white border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">Ongoing Cases</span>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">Steps in progress right now.</h2>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {cases.map((c) => {
            const pct = Math.round((c.amountCollected / c.amountNeeded) * 100);
            return (
              <div key={c.id} className="rounded-2xl border border-border overflow-hidden bg-white hover:shadow-md transition-shadow flex">
                <div className="w-32 shrink-0 overflow-hidden">
                  <img src={c.imageUrl || charityImg} alt={c.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-display text-base text-ink">{c.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <MapPin size={12} /> {c.location}
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
                    <div className="h-full rounded-full bg-brand-green" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-1.5 text-xs font-mono text-brand-green">
                    PKR {c.amountCollected.toLocaleString()} of {c.amountNeeded.toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
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
