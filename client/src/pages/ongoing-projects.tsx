import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { OngoingHero } from "@/components/sections/OngoingHero";
import { OngoingStatsBar } from "@/components/sections/OngoingStatsBar";
import { VerseStrip } from "@/components/sections/VerseStrip";
import { OngoingCaseCard } from "@/components/ui/OngoingCaseCard";
import { CaseDetailModal } from "@/components/ui/CaseDetailModal";
import { HeartHandIllustration } from "@/components/ui/HeartHandIllustration";
import { SearchBar, FilterDropdown, SortDropdown } from "@/components/ui/SearchBar";
import { FilePlus2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
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
  donorCount?: number;
};

type Filter = "all" | "nearly-funded" | "just-started";
type Sort = "most-funded" | "most-needed" | "closest-to-goal" | "az";

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "nearly-funded", label: "Nearly Funded" },
  { key: "just-started", label: "Just Started" },
];

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

  const showSubmitCta = user?.role !== "admin";

  return (
    <PageLayout>
      <OngoingHero showSubmitCta={showSubmitCta} />
      <main className="max-w-6xl mx-auto px-6 pb-24">
        {/* "Active Cases" below is live — it's the real count of ongoing cases, not a fixed number */}
        <OngoingStatsBar activeCases={cases.length} />

        <motion.div
          className="mt-14 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SearchBar value={query} onChange={setQuery} placeholder="Search by title, location or keyword..." />
          <FilterDropdown options={FILTER_OPTIONS} active={filter} onChange={setFilter} />
          <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </motion.div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border overflow-hidden bg-white">
                <div className="aspect-[16/9] bg-border/50 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-3 w-24 rounded bg-border/50 animate-pulse" />
                  <div className="h-5 w-3/4 rounded bg-border/50 animate-pulse" />
                  <div className="h-3 w-full rounded bg-border/50 animate-pulse" />
                  <div className="h-3 w-5/6 rounded bg-border/50 animate-pulse" />
                  <div className="h-2 w-full rounded-full bg-border/50 animate-pulse mt-4" />
                  <div className="h-10 w-full rounded-full bg-border/50 animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          cases.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-white p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-8">
              <motion.div
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <HeartHandIllustration className="w-48 h-40 shrink-0 text-primary" />
              </motion.div>
              <div className="text-center sm:text-left">
                <h2 className="font-display text-2xl text-ink">No active cases at the moment</h2>
                <p className="mt-2 text-muted leading-relaxed max-w-md">
                  Alhamdulillah! There are no active fundraising cases right now.
                  You can submit a new case or explore our success stories.
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Link
                    href="/post-case"
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-all duration-200 hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <FilePlus2 size={14} /> Submit a Case
                  </Link>
                  <Link
                    href="/success-stories"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:bg-background hover:-translate-y-0.5 hover:shadow-md"
                  >
                    View Success Stories <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-16 text-center text-muted">No cases match "{query}".</p>
          )
        ) : (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7">
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.1, ease: "easeOut" }}
              >
                <OngoingCaseCard
                  id={c.id}
                  title={c.title}
                  image={c.imageUrl || charityImg}
                  location={c.location}
                  description={c.description}
                  collected={c.amountCollected}
                  goal={c.amountNeeded}
                  donorCount={c.donorCount}
                  onViewDetails={setSelectedCaseId}
                />
              </motion.div>
            ))}
          </div>
        )}

        <VerseStrip />
      </main>

      {selectedCaseId && <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />}
    </PageLayout>
  );
}

