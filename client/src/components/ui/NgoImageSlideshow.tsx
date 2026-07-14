import { useEffect, useState } from "react";
import { Play, Pause } from "lucide-react";

type SlideImage = { src: string; caption: string };

// Auto-plays through a set of images (like a muted video), with a
// play/pause control in the top-left corner so the reader can stop and
// read a caption at their own pace.
export function NgoImageSlideshow({ images, intervalMs = 3200 }: { images: SlideImage[]; intervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(t);
  }, [playing, images.length, intervalMs]);

  return (
    <div className="relative rounded-3xl overflow-hidden border border-border aspect-[4/3] lg:aspect-auto lg:h-full">
      {images.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.caption}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"}`}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

      <button
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause slideshow" : "Play slideshow"}
        className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
      >
        {playing ? <Pause size={16} className="text-ink" /> : <Play size={16} className="text-ink ml-0.5" />}
      </button>

      <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white">{images[index].caption}</p>

      <div className="absolute top-4 right-4 flex gap-1.5">
        {images.map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}
