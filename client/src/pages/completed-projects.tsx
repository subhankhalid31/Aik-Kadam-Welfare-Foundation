import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { CompletedHero } from "@/components/sections/CompletedHero";
import { CompletedStatsBar } from "@/components/sections/CompletedStatsBar";
import { VerseStrip } from "@/components/sections/VerseStrip";
import { GalleryCard } from "@/components/ui/GalleryCard";
import { GalleryDetailModal } from "@/components/ui/GalleryDetailModal";
import { SearchBar, SortDropdown } from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Plus } from "lucide-react";

type ApiGalleryEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  images: string[];
  families: string | null;
  items: string | null;
  funds: string | null;
};

type Sort = "newest" | "oldest" | "most-families" | "az";

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "most-families", label: "Most Families Helped" },
  { key: "az", label: "A–Z" },
];

// Best-effort numeric extraction from admin-entered free text like "45 Families" or "PKR 450,000".
function firstNumber(raw: string | null): number {
  if (!raw) return 0;
  const match = raw.replace(/,/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

export default function CompletedProjectsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ApiGalleryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ events: ApiGalleryEvent[] }>("/api/gallery").then((data) => setEvents(data.events)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? events.filter(
          (e) => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
        )
      : events;

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;
      case "most-families":
        sorted.sort((a, b) => (parseInt(b.families ?? "0") || 0) - (parseInt(a.families ?? "0") || 0));
        break;
      case "az":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }, [events, query, sort]);

  // Live-computed from real gallery data — not hardcoded.
  const familiesHelped = useMemo(() => events.reduce((sum, e) => sum + firstNumber(e.families), 0), [events]);
  const fundsDistributed = useMemo(() => events.reduce((sum, e) => sum + firstNumber(e.funds), 0), [events]);

  return (
    <PageLayout>
      <CompletedHero />
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <CompletedStatsBar
          projectsCompleted={events.length}
          familiesHelped={familiesHelped}
          fundsDistributed={fundsDistributed}
        />

        <motion.div
          className="mt-14 flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <SearchBar value={query} onChange={setQuery} placeholder="Search by project, city, or keyword..." />
            <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
          {user?.role === "admin" && (
            <a
              href="/admin/gallery/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
            >
              <Plus size={15} /> Add Completed Project
            </a>
          )}
        </motion.div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden bg-white">
                <div className="aspect-[16/10] bg-border/50 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-24 rounded bg-border/50 animate-pulse" />
                  <div className="h-5 w-3/4 rounded bg-border/50 animate-pulse" />
                  <div className="h-3 w-full rounded bg-border/50 animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-border/50 animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-border/50 animate-pulse mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted">
            {events.length === 0 ? "No completed projects posted yet." : `No projects match "${query}".`}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7">
            {filtered.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.12, ease: "easeOut" }}
              >
                <GalleryCard
                  id={event.id}
                  title={event.title}
                  date={event.eventDate}
                  location={event.location}
                  description={event.description}
                  images={event.images}
                  families={event.families ?? "N/A"}
                  items={event.items ?? "N/A"}
                  funds={event.funds ?? "N/A"}
                  onViewDetails={setSelectedEventId}
                />
              </motion.div>
            ))}
          </div>
        )}

        <VerseStrip />
      </main>

      {selectedEventId && <GalleryDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />}
    </PageLayout>
  );
}
