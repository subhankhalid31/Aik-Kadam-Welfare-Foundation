import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShieldCheck, MapPin, Users, Package, Wallet, ArrowRight } from "lucide-react";

export type GalleryCardProps = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  images: string[];
  families: string;
  items: string;
  funds: string;
  onViewDetails?: (id: string) => void;
};

export function GalleryCard({ id, title, date, location, description, images, families, items, funds, onViewDetails }: GalleryCardProps) {
  const [index, setIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Soft radial highlight that follows the cursor — updated directly on the DOM
  // node (not via React state) so it stays smooth at 60fps on mousemove.
  function onMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = spotlightRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.background = `radial-gradient(circle 220px at ${x}px ${y}px, rgba(48,135,248,0.06), transparent 80%)`;
  }
  function onMouseLeave() {
    if (spotlightRef.current) spotlightRef.current.style.background = "transparent";
  }

  function prev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  const stats = [
    families ? { icon: Users, value: families } : null,
    items ? { icon: Package, value: items } : null,
    funds ? { icon: Wallet, value: funds } : null,
  ].filter(Boolean) as { icon: typeof Users; value: string }[];

  return (
    <article
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="group relative rounded-2xl border border-border overflow-hidden bg-white transition-all duration-[250ms] hover:-translate-y-2 hover:shadow-xl hover:border-primary/40"
    >
      {/* Mouse-spotlight: a soft radial highlight that follows the cursor across the card */}
      <div ref={spotlightRef} className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300" />
      <div className="relative aspect-[16/10] overflow-hidden bg-border/30">
        <img
          key={images[index]}
          src={images[index]}
          alt={`${title}, photo ${index + 1}`}
          className={`w-full h-full object-cover transition-all duration-[400ms] group-hover:scale-105 ${
            imgLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md"
          }`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />

        <span className="absolute z-20 top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 text-primary text-[11px] font-semibold px-3 py-1.5 shadow-sm transition-transform duration-200 group-hover:[&_svg]:rotate-[5deg]">
          <ShieldCheck size={13} className="transition-transform duration-200" /> Verified Completed
        </span>
        <span className="absolute z-20 top-3 right-3 rounded-full bg-primary text-white text-[11px] font-semibold px-3 py-1.5 shadow-sm">
          {date}
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

      <div className="p-6">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={13} />
          {location}
        </div>
        <h3 className="mt-1.5 font-display text-xl text-ink">{title}</h3>
        <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>

        {stats.length > 0 && (
          <div className="mt-5 pt-4 border-t border-border flex items-center gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
              >
                <s.icon size={15} className="text-primary shrink-0" />
                <span className="text-xs font-semibold text-ink">{s.value}</span>
              </motion.div>
            ))}
          </div>
        )}

        <button
          onClick={() => onViewDetails?.(id)}
          className="group/link mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors duration-200"
        >
          <span className="border-b border-transparent group-hover/link:border-primary-dark transition-colors duration-200">
            View Project Details
          </span>
          <ArrowRight size={14} className="transition-transform duration-200 group-hover/link:translate-x-1.5" />
        </button>
      </div>
    </article>
  );
}
