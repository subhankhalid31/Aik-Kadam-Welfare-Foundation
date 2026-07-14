import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { SuccessStoryCard } from "@/components/ui/SuccessStoryCard";
import { SearchBar, SortDropdown } from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Plus } from "lucide-react";

type ApiSuccessStory = {
  id: string;
  name: string;
  title: string;
  storyDate: string;
  quote: string;
  beforeImage: string;
  afterImage: string;
};

type Sort = "newest" | "oldest" | "az";

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "az", label: "A–Z" },
];

export default function SuccessStoriesPage() {
  const { user } = useAuth();
  const [stories, setStories] = useState<ApiSuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  useEffect(() => {
    api.get<{ stories: ApiSuccessStory[] }>("/api/success-stories").then((data) => setStories(data.stories)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? stories.filter((s) => s.name.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.quote.toLowerCase().includes(q))
      : stories;

    const sorted = [...list];
    switch (sort) {
      case "newest":
        sorted.sort((a, b) => new Date(b.storyDate).getTime() - new Date(a.storyDate).getTime());
        break;
      case "oldest":
        sorted.sort((a, b) => new Date(a.storyDate).getTime() - new Date(b.storyDate).getTime());
        break;
      case "az":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [stories, query, sort]);

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">Success Stories</span>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">Real people, real change.</h1>
            <p className="mt-4 text-muted max-w-xl leading-relaxed">
              Individual journeys made possible by donors and verified volunteers.
            </p>
          </div>
          {user?.role === "admin" && (
            <a
              href="/admin/success-stories/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-6 py-3 font-semibold text-background hover:bg-primary-dark transition-colors whitespace-nowrap"
            >
              <Plus size={16} /> Add Story
            </a>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 max-w-2xl">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name or keyword..." />
          <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-muted">Loading stories...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted">
            {stories.length === 0 ? "No success stories posted yet." : `No stories match "${query}".`}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-7">
            {filtered.map((story) => (
              <SuccessStoryCard
                key={story.id}
                title={story.title}
                date={story.storyDate}
                quote={story.quote}
                before={story.beforeImage}
                after={story.afterImage}
              />
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
