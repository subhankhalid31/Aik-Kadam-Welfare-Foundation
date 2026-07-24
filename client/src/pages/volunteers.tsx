import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { VolunteersHero } from "@/components/sections/VolunteersHero";
import { VolunteersStatsBar } from "@/components/sections/VolunteersStatsBar";
import { VerificationBanner } from "@/components/sections/VerificationBanner";
import { VolunteerCard, type VolunteerCardProps } from "@/components/ui/VolunteerCard";
import { StaggerGrid, StaggerItem } from "@/components/ui/ScrollStagger";
import { VolunteerDetailModal, type VolunteerDetail } from "@/components/ui/VolunteerDetailModal";
import { SearchBar, FilterDropdown, FilterPills, SortDropdown } from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type ApiVolunteer = {
  badgeId: string;
  name: string;
  city: string | null;
  avatarUrl: string | null;
  motto: string | null;
  category: string | null;
  hours: number;
  casesCompleted: number;
  projects: string[];
  joined: string; // ISO date
  servedUntil: string | null;
};

type Filter = "all" | "active" | "past";
type Sort = "most-hours" | "most-projects" | "newest" | "az";

const SORT_OPTIONS: { key: Sort; label: string }[] = [
  { key: "most-hours", label: "Most Hours" },
  { key: "most-projects", label: "Most Projects" },
  { key: "newest", label: "Newest Joined" },
  { key: "az", label: "A–Z" },
];

const CATEGORY_OPTIONS = ["All Categories", "Medical Assistant", "Food Drive", "Education", "Logistics", "Fundraising", "Field Coordinator", "Other"].map((c) => ({ key: c, label: c }));

function formatMonthYear(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function VolunteersPage() {
  const { user } = useAuth();
  const [volunteers, setVolunteers] = useState<ApiVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("All Categories");
  const [sort, setSort] = useState<Sort>("most-hours");
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDetail | null>(null);

  useEffect(() => {
    api
      .get<{ volunteers: ApiVolunteer[] }>("/api/volunteers")
      .then((data) => setVolunteers(data.volunteers))
      .finally(() => setLoading(false));
  }, []);

  const cards: (VolunteerCardProps & { rawCategory: string | null; rawJoined: string; rawProjects: string[]; rawQuote: string | null; rawCasesCompleted: number })[] = useMemo(
    () =>
      volunteers.map((v) => ({
        badgeId: v.badgeId,
        name: v.name,
        city: v.city ?? undefined,
        avatarUrl: v.avatarUrl ?? undefined,
        category: v.category,
        rawCategory: v.category,
        rawJoined: v.joined,
        rawProjects: v.projects,
        rawQuote: v.motto,
        rawCasesCompleted: v.casesCompleted,
        hours: v.hours,
        casesCompleted: v.casesCompleted,
        joined: formatMonthYear(v.joined),
        active: !v.servedUntil,
        servedUntil: v.servedUntil,
      })),
    [volunteers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cards.filter((v) => {
      if (filter === "active" && !v.active) return false;
      if (filter === "past" && v.active) return false;
      if (category !== "All Categories" && v.rawCategory !== category) return false;
      const matchesQuery =
        q === "" ||
        v.name.toLowerCase().includes(q) ||
        (v.badgeId ?? "").toLowerCase().includes(q) ||
        (v.city ?? "").toLowerCase().includes(q);
      return matchesQuery;
    });

    const sorted = [...list];
    switch (sort) {
      case "most-hours":
        sorted.sort((a, b) => b.hours - a.hours);
        break;
      case "most-projects":
        sorted.sort((a, b) => (b.rawProjects?.length ?? 0) - (a.rawProjects?.length ?? 0));
        break;
      case "newest":
        sorted.sort((a, b) => new Date(b.rawJoined).getTime() - new Date(a.rawJoined).getTime());
        break;
      case "az":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [cards, query, filter, category, sort]);

  // Live-computed stats, not hardcoded.
  const hoursServed = useMemo(() => volunteers.reduce((sum, v) => sum + v.hours, 0), [volunteers]);
  const projectsSupported = useMemo(() => new Set(volunteers.flatMap((v) => v.projects)).size, [volunteers]);

  const isApprovedVolunteer = user?.volunteerStatus === "approved";
  const ctaHidden = user?.role === "admin" || isApprovedVolunteer;
  const showRegisterCta = !ctaHidden && user?.volunteerStatus !== "pending";
  const ctaLabel = user?.volunteerStatus === "rejected" ? "Apply Again" : user?.volunteerStatus === "pending" ? "Application Pending" : "Become a Volunteer";

  return (
    <PageLayout>
      <VolunteersHero
        ctaLabel={user?.volunteerStatus === "pending" ? "Application Pending" : ctaLabel}
        ctaHref="/volunteers/register"
        ctaDisabled={!showRegisterCta}
        ctaHidden={ctaHidden}
      />
      <main className="max-w-6xl mx-auto px-6 pb-24">
        <VolunteersStatsBar
          verifiedVolunteers={volunteers.length}
          hoursServed={hoursServed}
          projectsSupported={projectsSupported}
        />

        <motion.div
          className="mt-14 flex flex-col gap-3"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID, or location..." />
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <FilterDropdown options={CATEGORY_OPTIONS} active={category} onChange={setCategory} placeholder="All Categories" />
            <FilterPills
              options={[
                { key: "all", label: "All" },
                { key: "active", label: "Active" },
                { key: "past", label: "Past" },
              ]}
              active={filter}
              onChange={setFilter}
              compact
            />
          </div>
          <div className="flex justify-end">
            <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
          </div>
        </motion.div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="h-16 w-16 rounded-full bg-border/50 animate-pulse" />
                  <div className="h-5 w-16 rounded-full bg-border/50 animate-pulse" />
                </div>
                <div className="mt-4 h-4 w-28 rounded bg-border/50 animate-pulse" />
                <div className="mt-2 h-3 w-20 rounded bg-border/50 animate-pulse" />
                <div className="mt-2 h-3 w-16 rounded bg-border/50 animate-pulse" />
                <div className="mt-5 pt-4 border-t border-border h-4 w-32 rounded bg-border/50 animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted">
            {volunteers.length === 0
              ? "No approved volunteers yet, be the first to apply."
              : `No volunteers match "${query}".`}
          </p>
        ) : (
          <StaggerGrid className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((v) => (
              <StaggerItem key={v.badgeId}>
                <VolunteerCard
                  {...v}
                  onOpen={() =>
                    setSelectedVolunteer({
                      badgeId: v.badgeId,
                      name: v.name,
                      city: v.city,
                      avatarUrl: v.avatarUrl,
                      category: v.rawCategory,
                      quote: v.rawQuote,
                      projects: v.rawProjects,
                      hours: v.hours,
                      casesCompleted: v.rawCasesCompleted,
                      joined: v.joined,
                      active: v.active,
                      servedUntil: v.servedUntil,
                    })
                  }
                />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}

        <VerificationBanner />
      </main>

      {selectedVolunteer && <VolunteerDetailModal volunteer={selectedVolunteer} onClose={() => setSelectedVolunteer(null)} />}
    </PageLayout>
  );
}
