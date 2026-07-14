import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { GalleryCard } from "@/components/ui/GalleryCard";
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

export default function CompletedProjectsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ApiGalleryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

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

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">Completed Projects</span>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">Steps we've already taken.</h1>
            <p className="mt-4 text-muted max-w-xl leading-relaxed">
              Verified, completed projects, each with photos, funds used, and the people reached.
            </p>
          </div>
          {user?.role === "admin" && (
            <a
              href="/admin/gallery/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 font-semibold text-background hover:bg-primary-dark transition-colors whitespace-nowrap"
            >
              <Plus size={16} /> Add Completed Project
            </a>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 max-w-2xl">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by project, city, or keyword..." />
          <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-muted">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted">
            {events.length === 0 ? "No completed projects posted yet." : `No projects match "${query}".`}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-7">
            {filtered.map((event) => (
              <GalleryCard
                key={event.id}
                id={event.id}
                title={event.title}
                date={event.eventDate}
                location={event.location}
                description={event.description}
                images={event.images}
                families={event.families ?? "N/A"}
                items={event.items ?? "N/A"}
                funds={event.funds ?? "N/A"}
              />
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
