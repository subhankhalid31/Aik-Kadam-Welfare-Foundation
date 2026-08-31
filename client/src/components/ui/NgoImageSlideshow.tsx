import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { AboutMediaItem } from "@/lib/about-media";

// ─────────────────────────────────────────────────────────────────────────
// Auto-plays through a set of photos and/or videos (like a muted video),
// with a play/pause control in the top-left corner. A photo shows for
// `imageIntervalMs` (4s by default) then advances on its own; a video
// plays through in full — muted, since this whole thing behaves like one
// continuous silent video — and advances when it actually ends, rather
// than being cut off by a fixed timer. Hovering pauses whichever is
// currently showing, same as clicking the manual pause button.
// ─────────────────────────────────────────────────────────────────────────
export function NgoImageSlideshow({ items, imageIntervalMs = 4000 }: { items: AboutMediaItem[]; imageIntervalMs?: number }) {
  const [index, setIndex] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const paused = manuallyPaused || hovering;
  const current = items[index];

  function advance() {
    setIndex((i) => (i + 1) % items.length);
  }

  // Photos: fixed timer. Videos: no timer at all — see the <video>'s
  // onEnded below instead, so a long clip is never cut off early and a
  // short one doesn't sit there waiting for a timer that's too long.
  useEffect(() => {
    if (paused || !current || current.type !== "image") return;
    const t = setTimeout(advance, imageIntervalMs);
    return () => clearTimeout(t);
  }, [paused, index, current, imageIntervalMs]);

  // Keep the actual <video> element's play/pause state in sync with
  // `paused` (hover or the manual button) — the browser doesn't do this
  // for us just because the element re-renders.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current || current.type !== "video") return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused, index, current]);

  if (!current) return null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-border aspect-[4/3] lg:aspect-auto lg:h-full"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {items.map((item, i) => {
        const isCurrent = i === index;
        if (item.type === "video") {
          return (
            <video
              key={item.src}
              ref={isCurrent ? videoRef : undefined}
              src={isCurrent ? item.src : undefined}
              muted
              playsInline
              autoPlay={isCurrent}
              onEnded={isCurrent ? advance : undefined}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isCurrent ? "opacity-100" : "opacity-0"}`}
            />
          );
        }
        return (
          <img
            key={item.src}
            src={item.src}
            alt={item.caption}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isCurrent ? "opacity-100" : "opacity-0"}`}
            loading={i === 0 ? "eager" : "lazy"}
          />
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

      <button
        onClick={() => setManuallyPaused((p) => !p)}
        aria-label={manuallyPaused ? "Play slideshow" : "Pause slideshow"}
        className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
      >
        {manuallyPaused ? <Play size={16} className="text-ink ml-0.5" /> : <Pause size={16} className="text-ink" />}
      </button>

      {current.caption && <p className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white">{current.caption}</p>}

      <div className="absolute top-4 right-4 flex gap-1.5">
        {items.map((_, i) => (
          <span key={i} className={`h-1 rounded-full transition-all ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
}
