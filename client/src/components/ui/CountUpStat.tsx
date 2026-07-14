import { useEffect, useRef, useState } from "react";

// Extracts a leading numeric run from a display string (handles "15,402",
// "Rs. 42M", "820", "450") so we can animate just the number while keeping
// prefixes/suffixes ("Rs. ", "M") intact.
function parseValue(raw: string) {
  const match = raw.match(/^([^\d]*)([\d,]+)(.*)$/);
  if (!match) return { prefix: "", number: 0, suffix: raw, hasNumber: false };
  const [, prefix, numStr, suffix] = match;
  return { prefix, number: parseInt(numStr.replace(/,/g, ""), 10), suffix, hasNumber: true };
}

export function CountUpStat({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState<string>(parseValue(value).hasNumber ? "0" : value);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const { prefix, number, suffix, hasNumber } = parseValue(value);
    if (!hasNumber) {
      setDisplay(value);
      return;
    }
    const duration = 1100;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(number * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (t < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value]);

  return (
    <div ref={ref} className={className}>
      {display}
    </div>
  );
}
