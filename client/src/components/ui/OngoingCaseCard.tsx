import { MapPin, Heart, Info } from "lucide-react";

export type OngoingCaseCardProps = {
  id: string;
  title: string;
  image: string;
  location: string;
  description: string;
  collected: number;
  goal: number;
  onViewDetails?: (id: string) => void;
};

export function OngoingCaseCard({ id, title, image, location, description, collected, goal, onViewDetails }: OngoingCaseCardProps) {
  const pct = Math.min(100, Math.round((collected / goal) * 100));
  const needed = Math.max(0, goal - collected);

  return (
    <article className="rounded-2xl border border-border overflow-hidden bg-white hover:shadow-md transition-shadow">
      <button
        onClick={() => onViewDetails?.(id)}
        disabled={!onViewDetails}
        className="aspect-[16/9] overflow-hidden w-full block disabled:cursor-default"
      >
        <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
      </button>
      <div className="p-6">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={13} />
          {location}
        </div>
        <button onClick={() => onViewDetails?.(id)} disabled={!onViewDetails} className="text-left w-full">
          <h3 className="mt-1.5 font-display text-xl text-primary hover:underline">{title}</h3>
        </button>
        <p className="mt-2 text-sm text-muted leading-relaxed">{description}</p>

        <div className="mt-5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Collected</span>
          <span>Goal</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-lg font-semibold text-primary">
            PKR {collected.toLocaleString()}
          </span>
          <span className="font-mono text-sm text-ink/70">PKR {goal.toLocaleString()}</span>
        </div>

        <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-ink/70 font-medium">{pct}% funded</span>
          <span className="text-accent-dark font-medium">
            PKR {needed.toLocaleString()} needed
          </span>
        </div>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(id)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
          >
            <Info size={13} /> View details &amp; volunteer options
          </button>
        )}

        <a
          href={`/donate?case=${id}`}
          className="mt-3 inline-flex items-center justify-center gap-2 w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-ink hover:bg-accent-dark transition-colors"
        >
          <Heart size={15} fill="currentColor" /> Donate to this Case
        </a>
      </div>
    </article>
  );
}
