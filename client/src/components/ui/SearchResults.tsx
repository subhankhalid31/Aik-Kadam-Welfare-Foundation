import { SEARCH_TABS, type SearchTab, type CaseResult, type VolunteerResult, type StoryResult } from "@/hooks/useGlobalSearch";

export function SearchTabs({ tab, onChange }: { tab: SearchTab; onChange: (t: SearchTab) => void }) {
  return (
    <div className="flex gap-2">
      {SEARCH_TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            tab === t ? "bg-primary text-background" : "bg-background border border-border text-ink/70 hover:bg-white"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

export function SearchResultsList({
  tab,
  cases,
  volunteers,
  stories,
  onSelectCase,
  onSelectVolunteer,
  onSelectStory,
}: {
  tab: SearchTab;
  cases: CaseResult[];
  volunteers: VolunteerResult[];
  stories: StoryResult[];
  onSelectCase: (c: CaseResult) => void;
  onSelectVolunteer: (v: VolunteerResult) => void;
  onSelectStory: (s: StoryResult) => void;
}) {
  if (tab === "Cases") {
    if (cases.length === 0) return <p className="p-6 text-center text-sm text-muted">No matching cases.</p>;
    return (
      <>
        {cases.map((c) => (
          <button key={c.id} onClick={() => onSelectCase(c)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-background text-left">
            {c.imageUrl && <img src={c.imageUrl} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0" />}
            <div>
              <p className="text-sm font-semibold text-ink">{c.title}</p>
              <p className="text-xs text-muted">{c.location}</p>
            </div>
          </button>
        ))}
      </>
    );
  }

  if (tab === "Volunteers") {
    if (volunteers.length === 0) return <p className="p-6 text-center text-sm text-muted">No matching volunteers.</p>;
    return (
      <>
        {volunteers.map((v) => (
          <button key={v.badgeId ?? v.name} onClick={() => onSelectVolunteer(v)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-background text-left">
            <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display text-sm shrink-0">
              {v.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{v.name}</p>
              <p className="text-xs text-muted">{v.city}</p>
            </div>
          </button>
        ))}
      </>
    );
  }

  if (stories.length === 0) return <p className="p-6 text-center text-sm text-muted">No matching stories.</p>;
  return (
    <>
      {stories.map((s) => (
        <button key={s.id} onClick={() => onSelectStory(s)} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-background text-left">
          {s.beforeImage && <img src={s.beforeImage} alt="" className="h-11 w-11 rounded-lg object-cover shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-ink">{s.name}</p>
            <p className="text-xs text-muted">{s.title}</p>
          </div>
        </button>
      ))}
    </>
  );
}
