import { Modal } from "@/components/ui/Modal";
import { MapPin, Clock, Briefcase, Calendar, ShieldCheck, BadgeCheck } from "lucide-react";

export type VolunteerDetail = {
  badgeId: string | null;
  name: string;
  city?: string | null;
  avatarUrl?: string | null;
  category?: string | null;
  quote?: string | null;
  projects?: string[];
  hours: number;
  casesCompleted: number;
  joined: string; // preformatted label
  active?: boolean;
  servedUntil?: string | null;
};

const avatarColors = ["#3087F8", "#72ADFA", "#FFD662", "#0260D8"];
function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function VolunteerDetailModal({ volunteer, onClose }: { volunteer: VolunteerDetail; onClose: () => void }) {
  const color = avatarColors[volunteer.name.length % avatarColors.length];

  return (
    <Modal onBackdropClick={onClose} onClose={onClose}>
      <div className="max-w-md">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {volunteer.avatarUrl ? (
              <img src={volunteer.avatarUrl} alt={volunteer.name} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center font-display text-xl text-background"
                style={{ backgroundColor: color }}
              >
                {initials(volunteer.name)}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-white">
              <ShieldCheck size={11} className="text-background" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="font-display text-xl text-ink">{volunteer.name}</h2>
              <BadgeCheck size={16} className="text-primary shrink-0" />
            </div>
            {volunteer.category && <p className="text-sm font-medium text-primary">{volunteer.category}</p>}
            {volunteer.city && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <MapPin size={12} /> {volunteer.city}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {volunteer.badgeId && (
            <span className="font-mono text-[11px] text-muted bg-background border border-border rounded-full px-2.5 py-1">
              ID: {volunteer.badgeId}
            </span>
          )}
          {volunteer.servedUntil ? (
            <span className="text-[11px] font-semibold text-muted bg-background border border-border rounded-full px-2.5 py-1">
              Served until {volunteer.servedUntil}
            </span>
          ) : (
            volunteer.active && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2.5 py-1">
                ACTIVE
              </span>
            )
          )}
        </div>

        {volunteer.quote && (
          <p className="mt-4 text-sm italic text-ink/80 leading-relaxed border-l-2 border-primary/30 pl-3">
            "{volunteer.quote}"
          </p>
        )}

        {/* Real volunteer stats */}
        <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-background py-2.5">
            <Clock size={14} className="mx-auto text-primary" />
            <div className="mt-1 text-sm font-semibold text-ink">{volunteer.hours}</div>
            <div className="text-[10px] text-muted">Hours</div>
          </div>
          <div className="rounded-lg bg-background py-2.5">
            <Briefcase size={14} className="mx-auto text-primary" />
            <div className="mt-1 text-sm font-semibold text-ink">{volunteer.casesCompleted}</div>
            <div className="text-[10px] text-muted">Total Cases</div>
          </div>
          <div className="rounded-lg bg-background py-2.5">
            <Calendar size={14} className="mx-auto text-primary" />
            <div className="mt-1 text-sm font-semibold text-ink">{volunteer.joined}</div>
            <div className="text-[10px] text-muted">Joined</div>
          </div>
        </div>

        {volunteer.projects && volunteer.projects.length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-semibold tracking-wide text-ink/60 uppercase">Top Cases</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {volunteer.projects.map((p) => (
                <span
                  key={p}
                  className="text-xs font-medium rounded-full bg-primary/5 border border-primary/10 text-primary px-3 py-1.5"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
