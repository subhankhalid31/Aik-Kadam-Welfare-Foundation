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
      <div className="relative mx-auto mt-3 w-[92vw] max-w-2xl bg-white rounded-2xl shadow-xl max-h-[70vh] overflow-hidden flex flex-col border border-border animate-in fade-in slide-in-from-top-2 duration-150">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find cases, volunteers, and success stories"
                className="w-full rounded-full border border-border bg-background pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button onClick={onClose} className="h-10 w-10 shrink-0 rounded-full hover:bg-background flex items-center justify-center">
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
