import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { VolunteerCard, type VolunteerCardProps } from "@/components/ui/VolunteerCard";
import { SearchBar, FilterPills, SortDropdown } from "@/components/ui/SearchBar";
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

const CATEGORY_OPTIONS = ["All Categories", "Medical Assistant", "Food Drive", "Education", "Logistics", "Fundraising", "Field Coordinator", "Other"];

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

  useEffect(() => {
    api
      .get<{ volunteers: ApiVolunteer[] }>("/api/volunteers")
      .then((data) => setVolunteers(data.volunteers))
      .finally(() => setLoading(false));
  }, []);

  const cards: (VolunteerCardProps & { rawCategory: string | null; rawJoined: string })[] = useMemo(
    () =>
      volunteers.map((v) => ({
        badgeId: v.badgeId,
        name: v.name,
        city: v.city ?? undefined,
        avatarUrl: v.avatarUrl ?? undefined,
        quote: v.motto,
        category: v.category,
        rawCategory: v.category,
        rawJoined: v.joined,
        projects: v.projects,
        hours: v.hours,
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
        sorted.sort((a, b) => (b.projects?.length ?? 0) - (a.projects?.length ?? 0));
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

  return (
    <PageLayout>
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <span className="text-xs font-semibold tracking-wide text-primary uppercase">Volunteers</span>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">The people doing the work.</h1>
            <p className="mt-4 text-muted max-w-xl leading-relaxed">
              Every volunteer here is admin-verified. Their badge ID is publicly checkable.
            </p>
          </div>
          {user?.role !== "admin" && user?.volunteerStatus !== "pending" && user?.volunteerStatus !== "approved" && (
            <a
              href="/volunteers/register"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-accent px-5 py-2 text-sm font-bold text-[#2A1A0A] hover:bg-accent-dark transition-colors whitespace-nowrap"
            >
              <UserPlus size={14} /> {user?.volunteerStatus === "rejected" ? "Apply Again" : "Register as Volunteer"}
            </a>
          )}
          {user?.volunteerStatus === "pending" && (
            <span className="inline-flex items-center justify-center rounded-full bg-accent/15 text-accent-dark px-6 py-3 text-sm font-semibold whitespace-nowrap">
              Application Pending
            </span>
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <SearchBar value={query} onChange={setQuery} placeholder="Search by name, ID, or location..." />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="shrink-0 rounded-full border border-border bg-white px-4 py-2.5 text-sm">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FilterPills
            options={[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "past", label: "Past" },
            ]}
            active={filter}
            onChange={setFilter}
          />
          <SortDropdown value={sort} onChange={setSort} options={SORT_OPTIONS} />
        </div>

        {loading ? (
          <p className="mt-16 text-center text-muted">Loading volunteers...</p>
        ) : filtered.length === 0 ? (
          <p className="mt-16 text-center text-muted">
            {volunteers.length === 0
              ? "No approved volunteers yet, be the first to apply."
              : `No volunteers match "${query}".`}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filtered.map((v) => (
              <VolunteerCard key={v.badgeId} {...v} />
            ))}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
