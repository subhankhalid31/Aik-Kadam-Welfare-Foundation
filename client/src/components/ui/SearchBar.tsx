import { Search, ArrowUpDown, SlidersHorizontal, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// All four controls below share the same liquid-glass system defined in
// index.css for login/signup/forgot-password (.glass-input / .glass-button)
// — same pill shape, backdrop blur, and rotating-shine border — so search
// and filter toolbars read as the same material as the auth pages instead
// of a flatter, separate "form controls" style.

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
    <div className="glass-input-wrap flex-1 min-w-[240px]">
      <div className="glass-input">
        <span className="glass-input-text-area" />
        <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-9 pl-1.5">
          <Search size={16} className="text-ink/60" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="relative z-10 h-full w-0 flex-grow bg-transparent text-sm text-ink placeholder:text-ink/45 focus:outline-none py-2.5 pr-4"
        />
      </div>
    </div>
  );
}

export function FilterPills<T extends string>({
  options,
  active,
  onChange,
  compact,
}: {
  options: { key: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex shrink-0 ${compact ? "gap-1.5 sm:gap-2" : "gap-2"}`}>
      {options.map((f) => {
        const isActive = active === f.key;
        const sizing = compact ? "px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm" : "px-4 py-2.5 text-sm";
        if (isActive) {
          // Selected state stays a solid pill so the active filter is
          // unambiguous at a glance against its frosted siblings.
          return (
            <button
              key={f.key}
              onClick={() => onChange(f.key)}
              className={`rounded-full font-semibold border border-primary bg-primary text-background shadow-[0_2px_10px_-2px_rgba(48,135,248,0.5)] transition-all duration-200 ${sizing}`}
            >
              {f.label}
            </button>
          );
        }
        return (
          <div key={f.key} className="glass-button-wrap">
            <button
              onClick={() => onChange(f.key)}
              className="glass-button relative z-10 rounded-full isolate transition-all"
            >
              <span className={cn("glass-button-text relative block select-none font-semibold text-center", sizing)}>
                {f.label}
              </span>
            </button>
            <div className="glass-button-shadow rounded-full pointer-events-none" />
          </div>
        );
      })}
    </div>
  );
}

export function FilterDropdown<T extends string>({
  options,
  active,
  onChange,
  placeholder = "Filter",
}: {
  options: { key: T; label: string }[];
  active: T;
  onChange: (v: T) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = options.find((o) => o.key === active)?.label ?? placeholder;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <div className="glass-button-wrap">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="glass-button relative z-10 isolate rounded-full transition-all"
        >
          <span className="glass-button-text relative block px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium">
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <SlidersHorizontal size={14} />
              {active === options[0]?.key ? placeholder : activeLabel}
              <svg className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none" />
      </div>

      {open && (
        <div className="absolute left-0 mt-1.5 z-20 w-56 rounded-2xl border border-white/70 bg-white/90 backdrop-blur-xl p-1.5 shadow-lg">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition-colors ${
                active === o.key ? "bg-primary/10 text-primary font-semibold" : "text-ink hover:bg-white/70"
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeLabel = options.find((o) => o.key === value)?.label ?? "";

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <div className="glass-button-wrap">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="glass-button relative z-10 isolate rounded-full transition-all"
        >
          <span className="glass-button-text relative block px-3.5 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm font-medium">
            <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
              <ArrowUpDown size={14} />
              Sort: {activeLabel}
              <svg className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
        </button>
        <div className="glass-button-shadow rounded-full pointer-events-none" />
      </div>

      {open && (
        <div className="absolute right-0 mt-1.5 z-20 w-52 rounded-2xl border border-white/70 bg-white/90 backdrop-blur-xl p-1.5 shadow-lg">
          {options.map((o) => (
            <button
              key={o.key}
              onClick={() => { onChange(o.key); setOpen(false); }}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition-colors ${
                value === o.key ? "bg-primary/10 text-primary font-semibold" : "text-ink hover:bg-white/70"
              }`}
            >
              {o.label}
              {value === o.key && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
