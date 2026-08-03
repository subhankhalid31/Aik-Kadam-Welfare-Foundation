import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { SuccessStoryCard } from "@/components/ui/SuccessStoryCard";
import { WheelCarousel } from "@/components/ui/WheelCarousel";
import { api } from "@/lib/api";

type ApiSuccessStory = {
  id: string;
  name: string;
  title: string;
  storyDate: string;
  quote: string;
  beforeImage: string;
  afterImage: string;
};

export function SuccessStoriesTeaser() {
  const [stories, setStories] = useState<ApiSuccessStory[]>([]);

  useEffect(() => {
    api.get<{ stories: ApiSuccessStory[] }>("/api/success-stories").then((data) => setStories(data.stories));
  }, []);

  if (stories.length === 0) return null;

  return (
    <section className="relative py-20 bg-white overflow-hidden">
      {/* Top curve for smooth transition from FundTransparency section */}
      <svg className="absolute top-0 left-0 w-full h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill="currentColor" />
      </svg>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 sm:h-32 -z-0"
        style={{ background: "linear-gradient(to bottom, #FCFAF6, rgba(255,255,255,0))" }}
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">
            Success Stories
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
            Real people, real change.
          </h2>
          <p className="mt-1 text-sm text-muted">Swipe, drag, or use the arrows to spin through them.</p>
        </div>

        <div className="mt-8">
          <WheelCarousel
            items={stories}
            renderItem={(story) => (
              <SuccessStoryCard
                title={story.title}
                date={story.storyDate}
                quote={story.quote}
                before={story.beforeImage}
                after={story.afterImage}
              />
            )}
          />
        </div>

        <div className="mt-4 text-center">
          <a
            href="/success-stories"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-ink hover:bg-background hover:gap-2.5 transition-all"
          >
            View All Success Stories <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
