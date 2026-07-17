import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { SuccessStoriesHero } from "@/components/sections/SuccessStoriesHero";
import { SuccessStoriesStatsBar } from "@/components/sections/SuccessStoriesStatsBar";
import { TestimonialCarousel } from "@/components/sections/TestimonialCarousel";
import { SuccessStoryCard } from "@/components/ui/SuccessStoryCard";
import { SuccessStoryDetailModal, type SuccessStoryDetail } from "@/components/ui/SuccessStoryDetailModal";
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
  const [completedProjects, setCompletedProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [selectedStory, setSelectedStory] = useState<SuccessStoryDetail | null>(null);

  useEffect(() => {
    api.get<{ stories: ApiSuccessStory[] }>("/api/success-stories").then((data) => setStories(data.stories)).finally(() => setLoading(false));
    api.get<{ events: unknown[] }>("/api/gallery").then((data) => setCompletedProjects(data.events.length));
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

  const testimonialQuotes = useMemo(() => stories.map((s) => ({ quote: s.quote, name: s.name })), [stories]);

  return (
    <PageLayout>
      <SuccessStoriesHero />
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <SuccessStoriesStatsBar storiesPublished={stories.length} completedProjects={completedProjects} />

        <motion.div
          className="mt-14 flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <SearchBar value={query} onChange={setQuery} placeholder="Search stories by name, location or keyword..." />
            <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
          {user?.role === "admin" && (
            <a
              href="/admin/success-stories/new"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
            >
              <Plus size={15} /> Add Story
            </a>
          )}
        </motion.div>

        {loading ? (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden bg-white">
                <div className="aspect-[16/9] bg-border/50 animate-pulse" />
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
            {stories.length === 0 ? "No success stories posted yet." : `No stories match "${query}".`}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-7">
            {filtered.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.1, ease: "easeOut" }}
              >
                <SuccessStoryCard
                  title={story.title}
                  date={story.storyDate}
                  quote={story.quote}
                  before={story.beforeImage}
                  after={story.afterImage}
                  onReadMore={() =>
                    setSelectedStory({
                      title: story.title,
                      date: story.storyDate,
                      quote: story.quote,
                      name: story.name,
                      before: story.beforeImage,
                      after: story.afterImage,
                    })
                  }
                />
              </motion.div>
            ))}
          </div>
        )}

        <TestimonialCarousel quotes={testimonialQuotes} />
      </main>

      {selectedStory && <SuccessStoryDetailModal story={selectedStory} onClose={() => setSelectedStory(null)} />}
    </PageLayout>
  );
}
