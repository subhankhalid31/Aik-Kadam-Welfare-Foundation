import { Search, ArrowUpDown, SlidersHorizontal, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="peer w-full rounded-full border border-border bg-white pl-10 pr-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:shadow-[0_0_0_4px_rgba(48,135,248,0.12)] transition-all duration-[250ms]"
      />
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted peer-focus:text-primary peer-focus:scale-110 peer-focus:translate-x-0.5 transition-all duration-[250ms]"
      />
    </div>
  );
}

export function FilterPills<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { key: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 shrink-0">
      {options.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`rounded-full px-4 py-2.5 text-sm font-semibold border transition-colors ${
            active === f.key
              ? "bg-primary text-background border-primary"
              : "bg-white text-ink border-border hover:bg-background"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}

export function FilterDropdown<T extends string>({
  options,
  active,
  onChange,
}: {
  options: { key: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = options.find((o) => o.key === active)?.label ?? "Filter";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-white pl-4 pr-3.5 py-2.5 text-sm font-medium text-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 active:scale-105"
      >
        <SlidersHorizontal size={14} className="text-muted" />
        {active === options[0]?.key ? "Filter" : activeLabel}
        <svg className={`h-3 w-3 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 z-20 w-56 rounded-2xl border border-border bg-white p-1.5 shadow-lg">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition-colors ${
                active === o.key ? "bg-primary/10 text-primary font-semibold" : "text-ink hover:bg-background"
              }`}
            >
              {o.label}
              {active === o.key && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SortDropdown<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { key: T; label: string }[];
}) {
  return (
    <div className="relative shrink-0 group transition-transform duration-200 hover:-translate-y-0.5">
      <ArrowUpDown size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="peer appearance-none rounded-full border border-border bg-white pl-9 pr-8 py-2.5 text-sm font-medium text-ink transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary group-hover:shadow-md"
      >
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            Sort: {o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted transition-transform duration-200 peer-focus:rotate-180" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
