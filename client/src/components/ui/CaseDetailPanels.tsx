import type { LucideIcon } from "lucide-react";
import { Users } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────
// Case detail page panels — funding stats + CTA, and the case-details list.
//
// Deliberately separate from CaseMeta.tsx (FundingBar/MetaItem/MetaGrid),
// which the compact "View details" modal and gallery modal still use as-is.
// This page has the room a modal doesn't, so it gets its own denser
// hierarchy: a bigger headline number, a glossier progress bar with the
// percentage riding on it instead of a bare row underneath, and a
// divided list instead of a 2-column grid (which left an orphaned cell
// dangling whenever the item count was odd — see the 3-item CASE
// DETAILS example that motivated this file).
// ─────────────────────────────────────────────────────────────────────────

export function CaseFundingPanel({ collected, needed }: { collected: number; needed: number }) {
  const pct = needed > 0 ? Math.min(100, Math.round((collected / needed) * 100)) : 0;
  const remaining = Math.max(0, needed - collected);
  const overfunded = collected > needed;
  const displayCollected = Math.min(collected, needed);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Raised so far</p>
          <p className="mt-0.5 font-display text-3xl font-bold leading-none text-ink sm:text-4xl">
            <span className="text-brand-green">PKR</span> {displayCollected.toLocaleString()}
          </p>
        </div>
        <p className="pb-0.5 text-right text-xs text-muted">
          of <span className="font-semibold text-ink/70">PKR {needed.toLocaleString()}</span> goal
        </p>
      </div>

      {/* Taller, glossier bar than the compact modal's — this panel has the
          room for it, and a gradient fill + top highlight reads as more
          "finished" than a flat single-tone bar. */}
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-border/70">
        <div className="relative h-full rounded-full bg-gradient-to-r from-brand-green to-primary-dark transition-all duration-700 ease-out" style={{ width: `${Math.max(pct, 3)}%` }}>
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-full bg-white/25" />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="font-semibold text-ink/70">{pct}% funded</span>
        <span className="text-muted">{remaining > 0 ? `PKR ${remaining.toLocaleString()} left` : "Fully funded"}</span>
      </div>

      {overfunded && (
        <div className="mt-3 space-y-1 rounded-xl bg-emerald-50 px-3.5 py-3 text-sm">
          <div className="text-ink/80">
            Amount requested — <span className="font-semibold italic text-emerald-700">PKR {needed.toLocaleString()}</span>
          </div>
          <div className="text-ink/80">
            Amount given — <span className="font-semibold italic text-emerald-700">PKR {collected.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function DonorCount({ count }: { count: number }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted">
      <Users size={13} className="text-brand-green" />
      <span className="font-semibold text-ink/70">{count}</span> {count === 1 ? "donor" : "donors"} so far
    </p>
  );
}

export function CaseDetailList({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-border/70">{children}</div>;
}

export function CaseDetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
        <Icon size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">{label}</div>
        <div className="truncate text-sm font-medium text-ink">{value}</div>
      </div>
    </div>
  );
}
