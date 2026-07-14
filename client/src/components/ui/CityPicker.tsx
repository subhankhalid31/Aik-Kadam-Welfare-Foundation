import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { ALL_PAKISTAN_CITIES, PAKISTAN_PROVINCES } from "@shared/pakistan-locations";
import { inputClass } from "@/components/ui/FormField";

// Searchable city dropdown — typing filters the full Pakistan city list,
// selecting a city also fills in its province (province stays editable /
// separately selectable in case of duplicate city names across provinces).
export function CityPicker({
  city,
  province,
  onChange,
}: {
  city: string;
  province: string;
  onChange: (city: string, province: string) => void;
}) {
  const [query, setQuery] = useState(city);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(city), [city]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? ALL_PAKISTAN_CITIES.filter((c) => c.city.toLowerCase().includes(q)) : ALL_PAKISTAN_CITIES;
    return list.slice(0, 40);
  }, [query]);

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div ref={wrapRef} className="relative">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search city..."
            className={`${inputClass} pl-9`}
            autoComplete="off"
          />
        </div>
        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-border bg-white shadow-lg">
            {results.length === 0 && <p className="px-3.5 py-2.5 text-sm text-muted">No matching city, you can still type it and pick a province.</p>}
            {results.map((c) => (
              <button
                key={`${c.city}-${c.province}`}
                type="button"
                onClick={() => { onChange(c.city, c.province); setQuery(c.city); setOpen(false); }}
                className="w-full text-left px-3.5 py-2 text-sm hover:bg-background flex items-center justify-between"
              >
                <span className="text-ink">{c.city}</span>
                <span className="text-xs text-muted">{c.province}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <select
          value={province}
          onChange={(e) => onChange(query, e.target.value)}
          className={`${inputClass} appearance-none pr-9`}
        >
          <option value="">Select province</option>
          {PAKISTAN_PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}
