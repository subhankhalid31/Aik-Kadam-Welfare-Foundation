import { CheckCircle2, Calendar, Quote } from "lucide-react";

export type SuccessStoryCardProps = {
  title: string;
  date: string;
  quote: string;
  before: string;
  after: string;
};

export function SuccessStoryCard({ title, date, quote, before, after }: SuccessStoryCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-white p-5 hover:shadow-md transition-shadow">
      <div className="grid grid-cols-2 gap-2">
        <div className="relative rounded-xl overflow-hidden aspect-square">
          <img src={before} alt={`${title}, before`} className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute top-2 left-2 rounded-full bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
            Before
          </span>
        </div>
        <div className="relative rounded-xl overflow-hidden aspect-square">
          <img src={after} alt={`${title}, after`} className="w-full h-full object-cover" loading="lazy" />
          <span className="absolute top-2 left-2 rounded-full bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
            After
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={14} /> COMPLETED PROJECT
      </div>
      <h3 className="mt-1.5 font-display text-xl text-ink">{title}</h3>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        <Calendar size={13} /> {date}
      </div>

      <div className="mt-3 relative rounded-xl bg-background p-4">
        <Quote size={22} className="text-primary/25" />
        <p className="mt-1 text-sm italic text-ink/75 leading-relaxed">{quote}</p>
      </div>
    </article>
  );
}
