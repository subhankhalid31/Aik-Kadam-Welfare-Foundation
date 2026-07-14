import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export type CaseResult = { id: string; title: string; location: string; imageUrl: string | null };
export type VolunteerResult = { badgeId: string | null; name: string; city: string | null };
export type StoryResult = { id: string; name: string; title: string; beforeImage: string | null };

export const SEARCH_TABS = ["Cases", "Volunteers", "Success Stories"] as const;
export type SearchTab = (typeof SEARCH_TABS)[number];

// Shared data-fetching + filtering behind the site's search, used by both
// the desktop dropdown panel and the always-visible mobile search pill so
// neither has to duplicate the fetch/filter logic.
export function useGlobalSearch(query: string) {
  const [cases, setCases] = useState<CaseResult[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerResult[]>([]);
  const [stories, setStories] = useState<StoryResult[]>([]);

  useEffect(() => {
    api.get<{ cases: CaseResult[] }>("/api/cases?status=ongoing").then((d) => setCases(d.cases)).catch(() => {});
    api.get<{ volunteers: VolunteerResult[] }>("/api/volunteers").then((d) => setVolunteers(d.volunteers)).catch(() => {});
    api.get<{ stories: StoryResult[] }>("/api/success-stories").then((d) => setStories(d.stories)).catch(() => {});
  }, []);

  const q = query.trim().toLowerCase();
  const filteredCases = useMemo(
    () => (q ? cases.filter((c) => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q)) : cases),
    [cases, q],
  );
  const filteredVolunteers = useMemo(
    () => (q ? volunteers.filter((v) => v.name.toLowerCase().includes(q) || (v.city ?? "").toLowerCase().includes(q)) : volunteers),
    [volunteers, q],
  );
  const filteredStories = useMemo(
    () => (q ? stories.filter((s) => s.name.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)) : stories),
    [stories, q],
  );

  return { filteredCases, filteredVolunteers, filteredStories };
}
