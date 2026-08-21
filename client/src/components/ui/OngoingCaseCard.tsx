import { useState } from "react";
import { Link } from "wouter";
import { MapPin, Heart, Info, Users2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { ShareCasePopover } from "./ShareCasePopover";

export type OngoingCaseCardProps = {
  id: string;
  title: string;
  image: string;
  location: string;
  description: string;
  collected: number;
  goal: number;
  donorCount?: number;
  onViewDetails?: (id: string) => void;
};

export function OngoingCaseCard({ id, title, image, location, description, collected, goal, donorCount = 0, onViewDetails }: OngoingCaseCardProps) {
  const pct = Math.min(100, Math.round((collected / goal) * 100));
  const needed = Math.max(0, goal - collected);
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <article className="group rounded-2xl border border-border overflow-hidden bg-white transition-all duration-[250ms] hover:-translate-y-2 hover:shadow-xl hover:border-brand-green/40">
      {/* Photo + title open the full case page (like clicking a product in
          a store) — "View details" below stays a shortcut that opens the
          quick-look modal instead, for anyone who'd rather not leave this
          list. */}
      <Link href={`/cases/${id}`} className="aspect-[16/9] overflow-hidden w-full block bg-border/30">
        <img
          src={image}
          alt={title}
          className={`w-full h-full object-cover transition-all duration-[250ms] group-hover:scale-105 ${
            imgLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-md"
          }`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
      </Link>
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <MapPin size={13} />
          {location}
        </div>
        <Link href={`/cases/${id}`} className="text-left w-full block">
          <h3 className="mt-1.5 font-display text-lg sm:text-xl text-brand-green hover:underline">{title}</h3>
        </Link>
        <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2 sm:line-clamp-none">{description}</p>

        {/* Collected/Goal breakdown — full detail on larger screens, kept out of the way on mobile */}
        <div className="hidden sm:flex mt-5 items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Collected</span>
          <span>Goal</span>
        </div>
        <div className="hidden sm:flex items-baseline justify-between">
          <span className="font-mono text-lg font-semibold text-brand-green">
            PKR {collected.toLocaleString()}
          </span>
          <span className="font-mono text-sm text-ink/70">PKR {goal.toLocaleString()}</span>
        </div>

        <div className="mt-4 sm:mt-2 h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-brand-green transition-shadow duration-[250ms] group-hover:shadow-[0_0_10px_rgba(112,152,40,0.7)]"
            initial={{ width: 0 }}
            whileInView={{ width: `${pct}%` }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-ink/70 font-medium">{pct}% funded</span>
          <span className="text-accent-dark font-medium">
            PKR {needed.toLocaleString()} needed
          </span>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
          <Users2 size={13} />
          {donorCount} {donorCount === 1 ? "donor" : "donors"}
        </div>

        {onViewDetails && (
          <button
            onClick={() => onViewDetails(id)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green"
          >
            <Info size={13} />
            <span className="sm:hidden">View details</span>
            <span className="hidden sm:inline">View details &amp; volunteer options</span>
          </button>
        )}

        <div className="mt-3 flex items-center gap-2">
          <a
            href={`/donate?case=${id}`}
            className="glass-surface group/donate flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-brand-green px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-semibold text-background transition-all duration-150 hover:bg-brand-green-dark hover:shadow-lg active:scale-[0.98]"
          >
            <Heart size={15} fill="currentColor" /> Donate Now
            <ArrowRight size={14} className="transition-transform duration-150 group-hover/donate:translate-x-1" />
          </a>
          <ShareCasePopover caseId={id} title={title} />
        </div>
      </div>
    </article>
  );
}
