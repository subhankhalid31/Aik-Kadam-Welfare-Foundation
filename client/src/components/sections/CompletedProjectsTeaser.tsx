import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { GalleryCard } from "@/components/ui/GalleryCard";
import { GalleryDetailModal } from "@/components/ui/GalleryDetailModal";
import { WheelCarousel } from "@/components/ui/WheelCarousel";
import { api } from "@/lib/api";

type ApiGalleryEvent = {
  id: string;
  title: string;
  eventDate: string;
  location: string;
  description: string;
  images: string[];
  families: string;
  items: string;
  funds: string;
};

export function CompletedProjectsTeaser() {
  const [events, setEvents] = useState<ApiGalleryEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ events: ApiGalleryEvent[] }>("/api/gallery").then((data) => setEvents(data.events.slice(0, 8)));
  }, []);

  if (events.length === 0) return null;

  return (
    <section className="py-20 bg-background border-t border-border overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center">
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">
            Completed Projects
          </span>
          <h2 className="mt-2 font-display text-2xl sm:text-3xl text-ink">
            Finished, funded, and verified.
          </h2>
          <p className="mt-1 text-sm text-muted">Spin through a few of the projects your community completed.</p>
        </div>

        <div className="mt-8">
          <WheelCarousel
            items={events}
            cardWidth={320}
            height={540}
            renderItem={(event) => (
              <GalleryCard
                id={event.id}
                title={event.title}
                date={event.eventDate}
                location={event.location}
                description={event.description}
                images={event.images}
                families={event.families}
                items={event.items}
                funds={event.funds}
                onViewDetails={setSelectedEventId}
              />
            )}
          />
        </div>

        <div className="mt-4 text-center">
          <div className="glass-pill-wrap inline-block">
            <a href="/completed-projects" className="glass-pill relative isolate rounded-full block">
              <span className="glass-pill-text flex items-center gap-1.5 px-6 py-2.5 text-sm font-semibold">
                View All Completed Projects <ArrowRight size={16} />
              </span>
            </a>
            <div className="glass-pill-shadow rounded-full" />
          </div>
        </div>
      </div>

      {selectedEventId && <GalleryDetailModal eventId={selectedEventId} onClose={() => setSelectedEventId(null)} />}
    </section>
  );
}
