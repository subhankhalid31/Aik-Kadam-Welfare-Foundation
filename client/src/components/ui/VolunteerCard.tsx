import { useRef, useState } from "react";
import { MapPin, Clock, Briefcase, ShieldCheck, BadgeCheck } from "lucide-react";

const avatarColors = ["#709828", "#9EC656", "#E09010", "#465F19"];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export type VolunteerCardProps = {
  badgeId: string | null;
  name: string;
  role?: string;
  city?: string | null;
  avatarUrl?: string | null;
  category?: string | null;
  projects?: string[];
  quote?: string | null;
  hours: number;
  casesCompleted?: number;
  joined: string; // preformatted label, e.g. "Mar 2024"
  active?: boolean;
  servedUntil?: string | null;
  onOpen?: () => void;
};

export function VolunteerCard({ badgeId, name, role, city, avatarUrl, category, hours, casesCompleted = 0, active = true, servedUntil, onOpen }: VolunteerCardProps) {
  const color = avatarColors[name.length % avatarColors.length];
  const spotlightRef = useRef<HTMLButtonElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Soft radial highlight that follows the cursor — updated directly on the DOM node for smoothness.
  function onMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const el = spotlightRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--spot-x", `${x}px`);
    el.style.setProperty("--spot-y", `${y}px`);
    el.style.setProperty("--spot-opacity", "1");
  }
  function onMouseLeave() {
    spotlightRef.current?.style.setProperty("--spot-opacity", "0");
  }

  return (
    <button
      ref={spotlightRef}
      onClick={onOpen}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        // @ts-ignore custom properties for the spotlight gradient
        "--spot-x": "50%",
        "--spot-y": "0px",
        "--spot-opacity": "0",
      }}
      className="glass-surface group relative w-full min-w-0 text-left rounded-2xl border border-white/60 bg-white/80 p-6 flex flex-col transition-all duration-[250ms] hover:-translate-y-2 hover:shadow-xl hover:border-brand-green/40"
    >
      {/* Mouse spotlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: "var(--spot-opacity)",
          background: "radial-gradient(circle 200px at var(--spot-x) var(--spot-y), rgba(112,152,40,0.06), transparent 80%)",
        }}
      />
      {/* Signature interaction: soft blue gradient along the top edge on hover */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-2xl bg-gradient-to-b from-brand-green/[0.06] to-transparent opacity-0 transition-opacity duration-250 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <div className="h-16 w-16 rounded-full overflow-hidden bg-border/30">
              <img
                src={avatarUrl}
                alt={name}
                className={`h-full w-full object-cover transition-all duration-[600ms] group-hover:scale-[1.08] ${
                  imgLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md"
                }`}
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </div>
          ) : (
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center font-display text-xl text-background transition-transform duration-250 group-hover:scale-105"
              style={{ backgroundColor: color }}
            >
              {initials(name)}
            </div>
          )}
          <span className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${servedUntil ? "bg-muted" : "bg-emerald-400"}`} />
          <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-brand-green flex items-center justify-center border-2 border-white">
            <ShieldCheck size={11} className="text-background" />
          </span>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {badgeId && (
            <span className="font-mono text-[10px] text-muted bg-background border border-border rounded-full px-2.5 py-1">
              ID: {badgeId}
            </span>
          )}
          {servedUntil ? (
            <span className="text-[10px] font-semibold text-muted bg-background border border-border rounded-full px-2.5 py-1">
              SERVED UNTIL {servedUntil}
            </span>
          ) : (
            active && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1 transition-all duration-200 group-hover:bg-emerald-100">
                ACTIVE
              </span>
            )
          )}
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-1.5 min-w-0">
        <h3 className="font-display text-lg text-ink transition-colors duration-250 group-hover:text-brand-green truncate">{name}</h3>
        <BadgeCheck size={16} className="text-brand-green shrink-0" />
      </div>
      {(role || category) && <p className="relative text-sm font-medium text-brand-green truncate">{role || category}</p>}
      {city && (
        <p className="relative mt-1.5 flex items-center gap-1.5 text-xs text-muted min-w-0">
          <MapPin size={12} className="shrink-0" /> <span className="truncate">{city}</span>
        </p>
      )}

      <div className="relative mt-5 pt-4 border-t border-border flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-ink/70">
        <span className="flex items-center gap-1.5">
          <Clock size={13} className="text-muted" />
          <span className="font-semibold text-ink">{hours}</span> Hours
        </span>
        <span className="flex items-center gap-1.5">
          <Briefcase size={13} className="text-muted" />
          <span className="font-semibold text-ink">{casesCompleted}</span> Events
        </span>
      </div>
    </button>
  );
}
