import { MapPin, Mail, Clock, Calendar, BadgeCheck, ShieldCheck } from "lucide-react";

const avatarColors = ["#3087F8", "#72ADFA", "#FFD662", "#0260D8"];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export type VolunteerCardProps = {
  badgeId: string | null;
  name: string;
  role?: string;
  city?: string | null;
  email?: string;
  avatarUrl?: string | null;
  category?: string | null;
  projects?: string[];
  quote?: string | null;
  hours: number;
  joined: string; // preformatted label, e.g. "Mar 2024"
  active?: boolean;
  servedUntil?: string | null;
};

export function VolunteerCard({ badgeId, name, role, city, email, avatarUrl, category, projects, quote, hours, joined, active = true, servedUntil }: VolunteerCardProps) {
  const color = avatarColors[name.length % avatarColors.length];

  return (
    <div className="rounded-2xl border border-border bg-white p-6 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center font-display text-xl text-background"
              style={{ backgroundColor: color }}
            >
              {initials(name)}
            </div>
          )}
          <span className={`absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${servedUntil ? "bg-muted" : "bg-emerald-400"}`} />
          <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-white">
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
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                ACTIVE
              </span>
            )
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5">
        <h3 className="font-display text-lg text-ink">{name}</h3>
        <BadgeCheck size={16} className="text-primary" />
      </div>
      {(role || category) && <p className="text-sm font-medium text-primary">{role || category}</p>}

      <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
        {city && <li className="flex items-center gap-2"><MapPin size={13} className="text-muted" /> {city}</li>}
        {email && <li className="flex items-center gap-2"><Mail size={13} className="text-muted" /> {email}</li>}
      </ul>

      {projects && projects.length > 0 && (
        <div className="mt-4">
          <span className="text-[11px] font-semibold tracking-wide text-ink/60 uppercase">Top Projects</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {projects.map((p) => (
              <span
                key={p}
                className="text-xs font-medium rounded-full bg-emerald-50 border border-emerald-100 text-primary px-3 py-1.5"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {quote && <p className="mt-4 text-sm italic text-ink/70 leading-relaxed">&ldquo;{quote}&rdquo;</p>}

      <div className="mt-5 pt-4 border-t border-border flex items-center justify-between text-xs text-muted">
        <span className="flex items-center gap-1.5"><Clock size={13} /> {hours} hrs</span>
        <span className="flex items-center gap-1.5"><Calendar size={13} /> Joined {joined}</span>
      </div>
    </div>
  );
}
