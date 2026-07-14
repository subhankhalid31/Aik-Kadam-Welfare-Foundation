import { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, Calendar, MapPin, Users, Package, Wallet } from "lucide-react";

export type GalleryCardProps = {
  id?: string;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
  families: string;
  items: string;
  funds: string;
};

export function GalleryCard({ title, date, location, description, images, families, items, funds }: GalleryCardProps) {
  const [index, setIndex] = useState(0);

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault();
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <article className="rounded-2xl border border-border overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] overflow-hidden group">
        <img
          key={images[index]}
          src={images[index]}
          alt={`${title}, photo ${index + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-semibold px-3 py-1.5 shadow-sm">
          <ShieldCheck size={13} /> Verified Event
        </span>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 text-white text-[11px] font-mono px-2.5 py-1">
          {index + 1} / {images.length}
        </span>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronLeft size={16} className="text-ink" />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/85 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            >
              <ChevronRight size={16} className="text-ink" />
            </button>
          </>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><Calendar size={13} /> {date}</span>
          <span className="flex items-center gap-1.5"><MapPin size={13} /> {location}</span>
        </div>
        <h3 className="mt-2 font-display text-lg text-ink">{title}</h3>
        <p className="mt-1.5 text-sm text-muted leading-relaxed">{description}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background py-2.5">
            <Users size={14} className="mx-auto text-primary" />
            <div className="mt-1 text-xs font-semibold text-ink">{families}</div>
          </div>
          <div className="rounded-lg bg-background py-2.5">
            <Package size={14} className="mx-auto text-primary" />
            <div className="mt-1 text-xs font-semibold text-ink">{items}</div>
          </div>
          <div className="rounded-lg bg-background py-2.5">
            <Wallet size={14} className="mx-auto text-primary" />
            <div className="mt-1 text-xs font-semibold text-ink">{funds}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
