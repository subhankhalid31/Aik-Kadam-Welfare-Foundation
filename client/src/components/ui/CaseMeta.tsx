import type { LucideIcon } from "lucide-react";

export function FundingBar({ collected, needed }: { collected: number; needed: number }) {
  const pct = needed > 0 ? Math.min(100, Math.round((collected / needed) * 100)) : 0;
  const remaining = Math.max(0, needed - collected);
  const overfunded = collected > needed;
  // The headline number is capped at the goal — showing e.g. "PKR 30,000
  // of PKR 20,000 goal" reads as a broken/mismatched bar (150% funded).
  // The true collected total is never hidden, though — it's called out
  // explicitly in its own line below instead, so nothing is lost, it's
  // just not crammed into a display built for "progress toward a cap".
  const displayCollected = Math.min(collected, needed);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-lg font-bold text-primary">PKR {displayCollected.toLocaleString()}</span>
        <span className="text-xs text-muted">of PKR {needed.toLocaleString()} goal</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-green transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
        <span>{pct}% funded</span>
        <span>{remaining > 0 ? `PKR ${remaining.toLocaleString()} left` : "Fully funded"}</span>
      </div>

      {overfunded && (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3.5 py-3 text-sm space-y-1.5">
          <div className="text-ink/80">
            Amount Requested — <span className="italic font-semibold text-emerald-700">PKR {needed.toLocaleString()}</span>
          </div>
          <div className="text-ink/80">
            Amount Given — <span className="italic font-semibold text-emerald-700">PKR {collected.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetaItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <Icon size={13} />
      </span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</div>
        <div className="text-sm font-medium text-ink truncate">{value}</div>
      </div>
    </div>
  );
}

export function MetaGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-4">{children}</div>;
}
