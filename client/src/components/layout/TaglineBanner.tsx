import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { api } from "@/lib/api";

// Top-of-page tagline strip, editable by admins from the dashboard.
// Optionally links to a specific case with a "Support Now" call to action.
// Dismissible per-session; re-appears on next visit.
export function TaglineBanner({ onHeightChange }: { onHeightChange?: (height: number) => void }) {
  const [tagline, setTagline] = useState<string | null>(null);
  const [taglineCase, setTaglineCase] = useState<{ id: string; title: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ tagline: string | null; taglineCase: { id: string; title: string } | null }>("/api/site-settings")
      .then((d) => {
        setTagline(d.tagline);
        setTaglineCase(d.taglineCase);
        
        // Check if this specific tagline was dismissed in sessionStorage
        const storageKey = `tagline-dismissed-${d.tagline}`;
        const wasDismissed = sessionStorage.getItem(storageKey) === 'true';
        setDismissed(wasDismissed);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!tagline || !tagline.trim() || dismissed) {
      onHeightChange?.(0);
      return;
    }

    const updateHeight = () => {
      if (ref.current) {
        const newHeight = ref.current.offsetHeight;
        onHeightChange?.(newHeight);
      }
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => resizeObserver.disconnect();
  }, [tagline, dismissed, onHeightChange]);

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in sessionStorage so it persists across page navigation
    if (tagline) {
      sessionStorage.setItem(`tagline-dismissed-${tagline}`, 'true');
    }
  };

  if (!tagline || !tagline.trim() || dismissed) return null;

  return (
    <div ref={ref} className="text-white" style={{ backgroundColor: '#F4B400' }}>
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 px-6 py-2 text-sm font-medium text-center relative">
        <span>{tagline}</span>
        {taglineCase && (
          <Link
            href={`/ongoing-projects?case=${taglineCase.id}`}
            className="shrink-0 inline-flex items-center rounded-full bg-white px-3.5 py-1 text-xs font-bold text-primary-dark hover:bg-white/90 transition-colors"
          >
            Support Now
          </Link>
        )}
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
