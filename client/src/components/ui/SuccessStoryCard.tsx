import { useState } from "react";
import { ShieldCheck, Calendar, ArrowLeftRight, ArrowRight } from "lucide-react";

export type SuccessStoryCardProps = {
  title: string;
  date: string;
  quote: string;
  before: string;
  after: string;
  onReadMore?: () => void;
};

export function SuccessStoryCard({ title, date, quote, before, after, onReadMore }: SuccessStoryCardProps) {
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);

  return (
    <article className="group rounded-2xl border border-border overflow-hidden bg-white transition-all duration-[250ms] hover:-translate-y-2 hover:shadow-xl hover:border-brand-green/40">
      <div className="relative grid grid-cols-2 gap-0.5 aspect-[16/9] overflow-hidden bg-border/30">
        <div className="relative overflow-hidden">
          <img
            src={before}
            alt={`${title}, before`}
            className={`w-full h-full object-cover transition-all duration-[400ms] group-hover:scale-105 ${
              beforeLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md"
            }`}
            loading="lazy"
            onLoad={() => setBeforeLoaded(true)}
          />
          <span className="absolute top-2.5 left-2.5 rounded-full bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
            Before
          </span>
        </div>
        <div className="relative overflow-hidden">
          <img
            src={after}
            alt={`${title}, after`}
            className={`w-full h-full object-cover transition-all duration-[400ms] group-hover:scale-105 ${
              afterLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md"
            }`}
            loading="lazy"
            onLoad={() => setAfterLoaded(true)}
          />
          <span className="absolute top-2.5 right-2.5 rounded-full bg-brand-green text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wide">
            After
          </span>
        </div>

        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-none">
          <ArrowLeftRight size={13} className="text-brand-green" />
        </span>
      </div>

      <div className="p-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
          <ShieldCheck size={12} /> Verified Story
        </span>

        <h3 className="mt-2 font-display text-xl text-ink">{title}</h3>
        <p className="mt-2 text-sm italic text-ink/70 leading-relaxed">"{quote}"</p>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar size={13} /> Completed {date}
          </span>
          {onReadMore && (
            <button
              onClick={onReadMore}
              className="group/link inline-flex items-center gap-1 text-xs font-semibold text-brand-green hover:text-brand-green-dark transition-colors duration-200"
            >
              Read Full Story
              <ArrowRight size={12} className="transition-transform duration-200 group-hover/link:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
