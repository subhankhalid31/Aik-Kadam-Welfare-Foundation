import { useRef, useEffect, useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// A true fanned wheel: the active card sits centered and upright, with up
// to three cards visible on each side (7 total), arranged along an arc —
// rotating further and dipping lower the farther they sit from center, like
// the front rim of a wheel. It auto-advances one step at a time, pauses
// while a mouse hovers it (desktop) or a finger touches it (mobile), and
// resumes when released. Swipe or use the arrow buttons to spin it manually.
export function WheelCarousel<T>({
  items,
  renderItem,
  cardWidth = 300,
  height = 440,
  intervalMs = 3200,
  visibleSide = 3,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  cardWidth?: number;
  height?: number;
  intervalMs?: number;
  /** how many cards show on each side of the active one (3 = 7 cards total) */
  visibleSide?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);
  const dragStartX = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function measure() {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Shrink the fan on narrow phones so the outer cards don't blow past the
  // screen edges, and drop to fewer visible sides if there's little room.
  const compact = containerWidth > 0 && containerWidth < 480;
  const effectiveVisibleSide = compact ? Math.min(visibleSide, 2) : visibleSide;
  const effectiveCardWidth = containerWidth > 0 ? Math.min(cardWidth, containerWidth * (compact ? 0.5 : 0.3)) : cardWidth;
  const step = effectiveCardWidth * 0.46;

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setActive((i) => (i + 1) % items.length);
    }, intervalMs);
  }

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, intervalMs]);

  if (items.length === 0) return null;

  function go(delta: number) {
    setActive((i) => (i + delta + items.length) % items.length);
    resetTimer();
  }

  function onPointerEnter(e: React.PointerEvent) {
    if (e.pointerType === "mouse") pausedRef.current = true;
  }
  function onPointerLeaveContainer(e: React.PointerEvent) {
    dragStartX.current = null;
    if (e.pointerType === "mouse") pausedRef.current = false;
  }
  function onPointerDown(e: React.PointerEvent) {
    pausedRef.current = true;
    dragStartX.current = e.clientX;
    isDraggingRef.current = false;
    // Deliberately not capturing yet — see onPointerMove. Capturing here would
    // redirect the eventual click to the container even for a plain tap/click,
    // since capture retargets click for the whole gesture, not just from the
    // moment it's set.
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragStartX.current === null || isDraggingRef.current) return;
    if (Math.abs(e.clientX - dragStartX.current) > 8) {
      isDraggingRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (dragStartX.current !== null) {
      const delta = e.clientX - dragStartX.current;
      if (Math.abs(delta) > 40) go(delta > 0 ? -1 : 1);
    }
    dragStartX.current = null;
    isDraggingRef.current = false;
    if (e.pointerType !== "mouse") pausedRef.current = false;
  }

  return (
    <div className="select-none">
      <div
        ref={containerRef}
        className="relative overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ height, touchAction: "pan-y" }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeaveContainer}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {items.map((item, i) => {
          let rel = i - active;
          if (rel > items.length / 2) rel -= items.length;
          if (rel < -items.length / 2) rel += items.length;

          const isActive = rel === 0;
          const visible = Math.abs(rel) <= effectiveVisibleSide;
          const abs = Math.abs(rel);
          const translateX = rel * step;
          const translateY = abs * abs * 5;
          const rotate = rel * 9;
          const scale = 1 - abs * 0.09;
          const opacity = visible ? 1 - abs * 0.1 : 0;
          const zIndex = 20 - abs;

          return (
            <div
              key={i}
              onClick={isActive ? undefined : () => go(rel)}
              role={isActive ? undefined : "button"}
              tabIndex={isActive ? -1 : 0}
              aria-label={isActive ? undefined : rel < 0 ? "Previous" : "Next"}
              className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
              style={{
                width: effectiveCardWidth,
                transform: `translate(-50%, -50%) translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                opacity,
                zIndex,
                pointerEvents: visible ? "auto" : "none",
                cursor: isActive ? "grab" : "pointer",
              }}
            >
              {renderItem(item, i)}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={() => go(-1)}
          aria-label="Previous"
          className="h-10 w-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronLeft size={17} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Next"
          className="h-10 w-10 rounded-full border border-border bg-white flex items-center justify-center hover:bg-background transition-colors"
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}
