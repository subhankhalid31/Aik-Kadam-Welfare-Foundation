import { useEffect, useMemo, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { OngoingCaseCard } from "@/components/ui/OngoingCaseCard";
import { CaseDetailModal } from "@/components/ui/CaseDetailModal";
import { SearchBar, FilterPills, SortDropdown } from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import charityImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";

type ApiCase = {
  id: string;
  title: string;
  description: string;
  location: string;
  amountNeeded: number;
  amountCollected: number;
  imageUrl: string | null;
};

type Filter = "all" | "nearly-funded" | "just-started";
type Sort = "most-funded" | "most-needed" | "closest-to-goal" | "az";

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "most-funded", label: "Most Funded" },
  { key: "closest-to-goal", label: "Closest to Goal" },
  { key: "most-needed", label: "Most Needed" },
  { key: "az", label: "A–Z" },
];

export default function OngoingProjectsPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<ApiCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("most-funded");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ cases: ApiCase[] }>("/api/cases?status=ongoing")
      .then((data) => setCases(data.cases))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cases.filter((c) => {
      const pct = c.amountCollected / c.amountNeeded;
      if (filter === "nearly-funded" && pct < 0.7) return false;
      if (filter === "just-started" && pct > 0.3) return false;
      const matchesQuery =
        q === "" ||
        c.title.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchesQuery;
    });

    const sorted = [...list];
    switch (sort) {
      case "most-funded":
        sorted.sort((a, b) => b.amountCollected - a.amountCollected);
        break;
      case "most-needed":
        sorted.sort((a, b) => (b.amountNeeded - b.amountCollected) - (a.amountNeeded - a.amountCollected));
        break;
      case "closest-to-goal":
        sorted.sort((a, b) => b.amountCollected / b.amountNeeded - a.amountCollected / a.amountNeeded);
        break;
      case "az":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    return sorted;
  }, [cases, query, filter, sort]);

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">Ongoing Cases</span>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">Steps in progress right now.</h1>
          </div>
          {user?.role !== "admin" && (
            <a
              href="/post-case"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-bold text-[#2A1A0A] hover:bg-accent-dark transition-colors whitespace-nowrap"
            >
              <FilePlus2 size={14} /> Submit a Case
            </a>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by title, location, or keyword..." />
          <FilterPills
            options={[
              { key: "all", label: "All" },
              { key: "nearly-funded", label: "Nearly Funded" },
              { key: "just-started", label: "Just Started" },
            ]}
            active={filter}
            onChange={setFilter}
          />
          <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-muted">Loading cases...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted">
            {cases.length === 0
              ? "No active cases right now, check back soon, or submit one yourself."
              : `No cases match "${query}".`}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7">
            {filtered.map((c) => (
              <OngoingCaseCard
                key={c.id}
                id={c.id}
                title={c.title}
                image={c.imageUrl || charityImg}
                location={c.location}
                description={c.description}
                collected={c.amountCollected}
                goal={c.amountNeeded}
                onViewDetails={setSelectedCaseId}
              />
            ))}
          </div>
        )}
      </main>

      {selectedCaseId && <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />}
    </PageLayout>
  );
}
