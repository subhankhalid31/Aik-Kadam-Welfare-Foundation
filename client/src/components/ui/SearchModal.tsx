import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { useGlobalSearch, type SearchTab } from "@/hooks/useGlobalSearch";
import { SearchTabs, SearchResultsList } from "@/components/ui/SearchResults";

export function SearchModal({ onClose }: { onClose: () => void }) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<SearchTab>("Cases");
  const { filteredCases, filteredVolunteers, filteredStories } = useGlobalSearch(query);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="absolute inset-x-0 top-full z-[110]">
      <div className="fixed inset-0 -z-10 bg-ink/20" onClick={onClose} />
      <div className="relative mx-auto mt-3 w-[92vw] max-w-2xl glass-panel rounded-2xl max-h-[70vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="p-5 border-b border-white/50">
          <div className="flex items-center gap-2">
            <div className="glass-input-wrap flex-1">
              <div className="glass-input">
                <span className="glass-input-text-area" />
                <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 pl-2">
                  <Search size={17} className="text-ink/60" />
                </div>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find cases, volunteers, and success stories"
                  className="relative z-10 h-full w-0 flex-grow bg-transparent text-sm text-ink placeholder:text-ink/45 focus:outline-none py-2.5 pr-4"
                />
              </div>
            </div>
            <button onClick={onClose} className="glass-surface h-10 w-10 shrink-0 rounded-full bg-white/65 flex items-center justify-center text-ink/70 hover:bg-white/85 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="mt-3">
            <SearchTabs tab={tab} onChange={setTab} />
          </div>
        </div>

        <div className="overflow-y-auto p-3">
          <SearchResultsList
            tab={tab}
            cases={filteredCases}
            volunteers={filteredVolunteers}
            stories={filteredStories}
            onSelectCase={(c) => { onClose(); navigate(`/ongoing-projects?case=${c.id}`); }}
            onSelectVolunteer={() => { onClose(); navigate("/volunteers"); }}
            onSelectStory={() => { onClose(); navigate("/success-stories"); }}
          />
        </div>
      </div>
    </div>
  );
}
