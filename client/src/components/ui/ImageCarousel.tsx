import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Swipeable (touch) + arrow-button image carousel. Falls back to a single
// static image when there's only one, and renders nothing when there are none.
export function ImageCarousel({ images, alt, className = "w-full h-40 object-cover rounded-xl" }: { images: string[]; alt: string; className?: string }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!images || images.length === 0) return null;

  function go(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) go(delta > 0 ? -1 : 1);
    touchStartX.current = null;
  }

  return (
    <div className="relative select-none" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img src={images[index]} alt={alt} className={className} />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(-1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label="Previous photo"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); go(1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            aria-label="Next photo"
          >
            <ChevronRight size={16} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
