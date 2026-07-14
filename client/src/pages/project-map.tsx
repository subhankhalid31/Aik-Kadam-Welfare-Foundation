import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { api } from "@/lib/api";
import { MapPin, Briefcase, CheckCircle2 } from "lucide-react";

type CaseRow = { id: string; title: string; location: string; status: string; amountCollected: number; amountNeeded: number };
type GalleryRow = { id: string; title: string; location: string };

export default function ProjectMapPage() {
  const [ongoing, setOngoing] = useState<CaseRow[]>([]);
  const [completed, setCompleted] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ cases: CaseRow[] }>("/api/cases?status=ongoing"),
      api.get<{ events: GalleryRow[] }>("/api/gallery"),
    ]).then(([oc, ge]) => {
      setOngoing(oc.cases);
      setCompleted(ge.events);
      setLoading(false);
    });
  }, []);

  const byLocation = useMemo(() => {
    const map = new Map<string, { ongoing: CaseRow[]; completed: GalleryRow[] }>();
    for (const c of ongoing) {
      if (!map.has(c.location)) map.set(c.location, { ongoing: [], completed: [] });
      map.get(c.location)!.ongoing.push(c);
    }
    for (const g of completed) {
      if (!map.has(g.location)) map.set(g.location, { ongoing: [], completed: [] });
      map.get(g.location)!.completed.push(g);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [ongoing, completed]);

  return (
    <PageLayout>
      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Project Map</span>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">Where we've worked.</h1>
        <p className="mt-4 text-muted max-w-xl leading-relaxed">
          Every location where Aik Kadam has an active or completed project.
        </p>

        {loading ? (
          <p className="mt-16 text-center text-muted">Loading...</p>
        ) : byLocation.length === 0 ? (
          <p className="mt-16 text-center text-muted">No projects yet.</p>
        ) : (
          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            {byLocation.map(([location, data]) => (
              <div key={location} className="rounded-2xl border border-border bg-white p-5">
                <div className="flex items-center gap-2 text-ink font-display text-lg">
                  <MapPin size={17} className="text-primary" /> {location}
                </div>
                <div className="mt-3 space-y-2">
                  {data.ongoing.map((c) => (
                    <a key={c.id} href="/ongoing-projects" className="flex items-center gap-2 text-sm text-ink/75 hover:text-primary">
                      <Briefcase size={13} className="text-accent-dark shrink-0" /> {c.title} <span className="text-xs text-muted">(ongoing)</span>
                    </a>
                  ))}
                  {data.completed.map((g) => (
                    <a key={g.id} href="/completed-projects" className="flex items-center gap-2 text-sm text-ink/75 hover:text-primary">
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" /> {g.title} <span className="text-xs text-muted">(completed)</span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
