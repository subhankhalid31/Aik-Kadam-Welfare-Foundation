import { useEffect, useState, useCallback, useMemo, useRef, type Dispatch, type SetStateAction } from "react";
import { AdminLayout, type AdminTabKey, PillTabs, VOLUNTEER_SUBTABS, PROJECT_SUBTABS } from "@/components/layout/AdminLayout";
import { CityPicker } from "@/components/ui/CityPicker";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";
import { api, ApiError } from "@/lib/api";
import {
  Check, X, ShieldAlert, Pencil, Wallet, Users, Briefcase, Clock4,
  Undo2, Download, Search, Plus, ChevronLeft, ChevronRight, Trash2, EyeOff, Eye,
} from "lucide-react";

function ExportButton({ baseUrl }: { baseUrl: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const separator = baseUrl.includes("?") ? "&" : "?";
  const href = params.toString() ? `${baseUrl}${separator}${params}` : baseUrl;

  return (
    <div className="flex items-center gap-2 shrink-0">
      <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="From date" className="rounded-lg border border-border bg-white px-3 py-2.5 text-xs" />
      <span className="text-xs text-muted">to</span>
      <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="To date" className="rounded-lg border border-border bg-white px-3 py-2.5 text-xs" />
      <a href={href} download className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-background transition-colors">
        <Download size={15} /> Export CSV
      </a>
    </div>
  );
}

type PendingVolunteer = {
  id: string;
  name: string;
  email: string;
  city: string | null;
  volunteerPhone: string | null;
  volunteerMotto: string | null;
  volunteerMotivation: string | null;
};

type CaseRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  city?: string | null;
  province?: string | null;
  contactPhone?: string | null;
  amountNeeded: number;
  amountCollected: number;
  imageUrl: string | null;
  images?: string[];
  category: string | null;
  status: string;
  submitterName?: string;
  submitterEmail?: string;
  createdAt?: string;
};

type VolunteerBrief = {
  id: string;
  name: string;
  email?: string;
  badgeId: string | null;
  city: string | null;
  volunteerStatus?: "approved" | "alumni" | string;
  volunteerServedUntil?: string | null;
};

type DonationRow = {
  id: string;
  caseTitle: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  method: string;
  senderAccount: string;
  receiptImage: string;
  referenceNote: string | null;
  status: "pending" | "confirmed" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
};

type PledgeRow = {
  id: string;
  caseTitle: string;
  donorName: string;
  donorEmail: string;
  amount: number;
  method: string;
  status: "active" | "paused" | "cancelled";
  nextDueDate: string;
  lastDonationDate: string | null;
  createdAt: string;
};

function BulkActionBar({
  count,
  onApproveAll,
  onRejectAll,
  onClear,
  busy,
  approveLabel = "Approve All",
  rejectLabel = "Reject All",
}: {
  count: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
  busy: boolean;
  approveLabel?: string;
  rejectLabel?: string;
}) {
  if (count === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5">
      <span className="text-sm font-semibold text-ink">{count} selected</span>
      <div className="ml-auto flex items-center gap-2">
        <button
          disabled={busy}
          onClick={onApproveAll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-success-dark disabled:opacity-50"
        >
          <Check size={13} /> {approveLabel}
        </button>
        <button
          disabled={busy}
          onClick={onRejectAll}
          className="inline-flex items-center gap-1.5 rounded-lg bg-danger/10 px-3.5 py-1.5 text-xs font-semibold text-danger hover:bg-danger/20 disabled:opacity-50"
        >
          <X size={13} /> {rejectLabel}
        </button>
        <button onClick={onClear} className="text-xs font-semibold text-muted hover:text-ink">
          Clear
        </button>
      </div>
    </div>
  );
}

function SelectAllCheckbox({ ids, selected, onToggle }: { ids: string[]; selected: Set<string>; onToggle: () => void }) {
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = ids.some((id) => selected.has(id));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someSelected && !allSelected;
  }, [someSelected, allSelected]);
  return <input ref={ref} type="checkbox" className="accent-primary" checked={allSelected} onChange={onToggle} disabled={ids.length === 0} />;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<AdminTabKey>(() => {
    const saved = sessionStorage.getItem("adminTab");
    if (saved) sessionStorage.removeItem("adminTab");
    return (saved as AdminTabKey) || "volunteers";
  });
  const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteer[]>([]);
  const [volunteerBriefs, setVolunteerBriefs] = useState<VolunteerBrief[]>([]);
  const [pendingCases, setPendingCases] = useState<CaseRow[]>([]);
  const [ongoingCases, setOngoingCases] = useState<CaseRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [searchVolunteers, setSearchVolunteers] = useState("");
  const [searchCases, setSearchCases] = useState("");
  const [reviewCase, setReviewCase] = useState<CaseRow | null>(null);
  const [casesFrom, setCasesFrom] = useState("");
  const [casesTo, setCasesTo] = useState("");
  const [searchOngoing, setSearchOngoing] = useState("");
  const [searchApproved, setSearchApproved] = useState("");
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());
  const [selectedCases, setSelectedCases] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const dialog = useDialog();

  function toggleOne(setSel: Dispatch<SetStateAction<Set<string>>>, id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllIds(setSel: Dispatch<SetStateAction<Set<string>>>, ids: string[]) {
    setSel((prev) => (ids.length > 0 && ids.every((id) => prev.has(id)) ? new Set() : new Set(ids)));
  }

  async function bulkApproveVolunteers() {
    if (selectedVolunteers.size === 0) return;
    if (!(await dialog.confirm(`Approve ${selectedVolunteers.size} volunteer application(s)?`))) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selectedVolunteers].map((id) => api.post(`/api/admin/volunteers/${id}/approve`)));
      setSelectedVolunteers(new Set());
      await loadAll();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkRejectVolunteers() {
    if (selectedVolunteers.size === 0) return;
    const reason = await dialog.prompt(`Reason for rejecting ${selectedVolunteers.size} application(s) (optional, shown to them):`);
    if (reason === null) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selectedVolunteers].map((id) => api.post(`/api/admin/volunteers/${id}/reject`, { reason: reason || undefined })));
      setSelectedVolunteers(new Set());
      await loadAll();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkApproveCases() {
    if (selectedCases.size === 0) return;
    if (!(await dialog.confirm(`Approve ${selectedCases.size} case(s) and make them live?`))) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selectedCases].map((id) => api.post(`/api/admin/cases/${id}/approve`)));
      setSelectedCases(new Set());
      await loadAll();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkRejectCases() {
    if (selectedCases.size === 0) return;
    const reason = await dialog.prompt(`Reason for rejecting ${selectedCases.size} case(s) (optional, shown to the submitters):`);
    if (reason === null) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selectedCases].map((id) => api.post(`/api/admin/cases/${id}/reject`, { reason: reason || undefined })));
      setSelectedCases(new Set());
      await loadAll();
    } finally {
      setBulkBusy(false);
    }
  }

  const loadAll = useCallback(async () => {
    const [v, brief, pc, oc] = await Promise.all([
      api.get<{ volunteers: PendingVolunteer[] }>("/api/admin/volunteers/pending"),
      api.get<{ volunteers: VolunteerBrief[] }>("/api/admin/volunteers/approved"),
      api.get<{ cases: CaseRow[] }>("/api/admin/cases/pending"),
      api.get<{ cases: CaseRow[] }>("/api/cases?status=ongoing"),
    ]);
    setPendingVolunteers(v.volunteers);
    setVolunteerBriefs(brief.volunteers);
    setPendingCases(pc.cases);
    setOngoingCases(oc.cases);
  }, []);

  useEffect(() => {
    if (user?.role === "admin") loadAll();
  }, [user, loadAll]);

  useEffect(() => {
    if (user?.role !== "admin") return;
    const params = new URLSearchParams();
    if (casesFrom) params.set("from", casesFrom);
    if (casesTo) params.set("to", casesTo);
    api.get<{ cases: CaseRow[] }>(`/api/admin/cases/pending?${params}`).then((d) => setPendingCases(d.cases));
  }, [user, casesFrom, casesTo]);

  const filteredPendingVolunteers = useMemo(() => {
    const q = searchVolunteers.trim().toLowerCase();
    if (!q) return pendingVolunteers;
    return pendingVolunteers.filter(
      (v) => v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) || (v.city ?? "").toLowerCase().includes(q),
    );
  }, [pendingVolunteers, searchVolunteers]);

  const filteredPendingCases = useMemo(() => {
    const q = searchCases.trim().toLowerCase();
    if (!q) return pendingCases;
    return pendingCases.filter((c) => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
  }, [pendingCases, searchCases]);

  const filteredOngoingCases = useMemo(() => {
    const q = searchOngoing.trim().toLowerCase();
    if (!q) return ongoingCases;
    return ongoingCases.filter((c) => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
  }, [ongoingCases, searchOngoing]);

  const filteredApproved = useMemo(() => {
    const q = searchApproved.trim().toLowerCase();
    if (!q) return volunteerBriefs;
    return volunteerBriefs.filter(
      (v) => v.name.toLowerCase().includes(q) || (v.badgeId ?? "").toLowerCase().includes(q) || (v.city ?? "").toLowerCase().includes(q),
    );
  }, [volunteerBriefs, searchApproved]);

  async function act(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    try {
      await action();
      await loadAll();
    } finally {
      setBusy(null);
    }
  }

  if (authLoading) return null;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md px-6 text-center">
          <ShieldAlert className="mx-auto text-accent-dark" size={40} />
          <h1 className="mt-5 font-display text-2xl text-ink">Admins only.</h1>
          <p className="mt-3 text-muted">You don't have access to this page.</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout activeTab={tab} onTabChange={setTab}>
      {(["volunteers", "approved", "namechange"] as AdminTabKey[]).includes(tab) && (
        <div className="mb-6">
          <h1 className="font-display text-2xl text-ink">Volunteer Services</h1>
          <div className="mt-4"><PillTabs tabs={VOLUNTEER_SUBTABS} active={tab} onChange={setTab} /></div>
        </div>
      )}

      {(["cases", "ongoing", "gallery", "hidden", "rejected"] as AdminTabKey[]).includes(tab) && (
        <div className="mb-6">
          <h1 className="font-display text-2xl text-ink">Projects</h1>
          <div className="mt-4"><PillTabs tabs={PROJECT_SUBTABS} active={tab} onChange={setTab} /></div>
        </div>
      )}

      {tab === "volunteers" && (
        <div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchVolunteers}
                onChange={(e) => setSearchVolunteers(e.target.value)}
                placeholder="Search by name, email, or city..."
                className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ExportButton baseUrl="/api/admin/volunteers/export?status=pending" />
          </div>

          <BulkActionBar
            count={selectedVolunteers.size}
            busy={bulkBusy}
            onApproveAll={bulkApproveVolunteers}
            onRejectAll={bulkRejectVolunteers}
            onClear={() => setSelectedVolunteers(new Set())}
          />

          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  <th className="w-10 px-3.5 py-2.5">
                    <SelectAllCheckbox
                      ids={filteredPendingVolunteers.map((v) => v.id)}
                      selected={selectedVolunteers}
                      onToggle={() => toggleAllIds(setSelectedVolunteers, filteredPendingVolunteers.map((v) => v.id))}
                    />
                  </th>
                  <th className="px-3.5 py-2.5">Name</th>
                  <th className="px-3.5 py-2.5">Contact</th>
                  <th className="px-3.5 py-2.5">Motivation</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPendingVolunteers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3.5 py-6 text-center text-muted">No pending applications.</td>
                  </tr>
                )}
                {filteredPendingVolunteers.map((v) => (
                  <tr key={v.id} className={`hover:bg-background/40 transition-colors ${selectedVolunteers.has(v.id) ? "bg-primary/5" : ""}`}>
                    <td className="px-3.5 py-3 align-top">
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedVolunteers.has(v.id)}
                        onChange={() => toggleOne(setSelectedVolunteers, v.id)}
                      />
                    </td>
                    <td className="px-3.5 py-3 align-top">
                      <div className="font-display text-ink">{v.name}</div>
                      {v.volunteerMotto && <div className="mt-0.5 text-xs text-primary font-medium">"{v.volunteerMotto}"</div>}
                    </td>
                    <td className="px-3.5 py-3 align-top text-ink/80">
                      <div>{v.email}</div>
                      <div className="mt-0.5 text-xs text-muted">{v.city} &middot; {v.volunteerPhone}</div>
                    </td>
                    <td className="px-3.5 py-3 align-top text-ink/70 max-w-xs">
                      <span className="line-clamp-2">{v.volunteerMotivation}</span>
                    </td>
                    <td className="px-3.5 py-3 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busy === v.id}
                          onClick={async () => {
                            if (!(await dialog.confirm(`Approve ${v.name} as a volunteer?`))) return;
                            act(v.id, () => api.post(`/api/admin/volunteers/${v.id}/approve`));
                          }}
                          className="h-8 w-8 rounded-lg bg-success text-white flex items-center justify-center hover:bg-success-dark disabled:opacity-50"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          disabled={busy === v.id}
                          onClick={async () => {
                            const reason = await dialog.prompt(`Reason for rejecting ${v.name}'s application (optional, shown to them):`);
                            if (reason === null) return;
                            act(v.id, () => api.post(`/api/admin/volunteers/${v.id}/reject`, { reason: reason || undefined }));
                          }}
                          className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "cases" && (
        <div>
          <h2 className="font-display text-lg text-ink">Pending Cases</h2>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchCases}
                onChange={(e) => setSearchCases(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ExportButton baseUrl="/api/admin/cases/export?status=pending_review" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted">Filter by submitted date:</span>
            <input type="date" value={casesFrom} onChange={(e) => setCasesFrom(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs" />
            <span className="text-xs text-muted">to</span>
            <input type="date" value={casesTo} onChange={(e) => setCasesTo(e.target.value)} className="rounded-lg border border-border bg-white px-3 py-2 text-xs" />
            {(casesFrom || casesTo) && (
              <button onClick={() => { setCasesFrom(""); setCasesTo(""); }} className="text-xs text-primary font-semibold">Clear</button>
            )}
          </div>

          <BulkActionBar
            count={selectedCases.size}
            busy={bulkBusy}
            onApproveAll={bulkApproveCases}
            onRejectAll={bulkRejectCases}
            onClear={() => setSelectedCases(new Set())}
          />

          <div className="mt-5 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background/60 text-left text-xs font-semibold text-muted uppercase tracking-wide">
                  <th className="w-10 px-3.5 py-2.5">
                    <SelectAllCheckbox
                      ids={filteredPendingCases.map((c) => c.id)}
                      selected={selectedCases}
                      onToggle={() => toggleAllIds(setSelectedCases, filteredPendingCases.map((c) => c.id))}
                    />
                  </th>
                  <th className="px-3.5 py-2.5">Case</th>
                  <th className="px-3.5 py-2.5">Location / Amount</th>
                  <th className="px-3.5 py-2.5">Submitted by</th>
                  <th className="px-3.5 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPendingCases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3.5 py-6 text-center text-muted">No pending cases.</td>
                  </tr>
                )}
                {filteredPendingCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setReviewCase(c)}
                    className={`cursor-pointer hover:bg-background/40 transition-colors ${selectedCases.has(c.id) ? "bg-primary/5" : ""}`}
                  >
                    <td className="px-3.5 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="accent-primary"
                        checked={selectedCases.has(c.id)}
                        onChange={() => toggleOne(setSelectedCases, c.id)}
                      />
                    </td>
                    <td className="px-3.5 py-3 align-top">
                      <div className="flex gap-3">
                        {c.imageUrl && <img src={c.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover shrink-0" />}
                        <div>
                          <div className="font-display text-ink">{c.title}</div>
                          <div className="mt-0.5 text-xs text-ink/70 max-w-xs line-clamp-2">{c.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3 align-top text-ink/80">
                      <div>{c.location}</div>
                      <div className="mt-0.5 text-xs font-mono text-muted">PKR {c.amountNeeded.toLocaleString()}</div>
                    </td>
                    <td className="px-3.5 py-3 align-top text-ink/70 text-xs">{c.submitterName || "—"}</td>
                    <td className="px-3.5 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busy === c.id}
                          onClick={async () => {
                            if (!(await dialog.confirm(`Approve "${c.title}" and make it live?`))) return;
                            act(c.id, () => api.post(`/api/admin/cases/${c.id}/approve`));
                          }}
                          className="h-8 w-8 rounded-lg bg-success text-white flex items-center justify-center hover:bg-success-dark disabled:opacity-50"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          disabled={busy === c.id}
                          onClick={async () => {
                            const reason = await dialog.prompt(`Reason for rejecting "${c.title}" (optional, shown to the submitter):`);
                            if (reason === null) return;
                            act(c.id, () => api.post(`/api/admin/cases/${c.id}/reject`, { reason: reason || undefined }));
                          }}
                          className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {reviewCase && (
            <PendingCaseReviewModal
              caseRow={reviewCase}
              busy={busy === reviewCase.id}
              onClose={() => setReviewCase(null)}
              onApprove={async () => {
                if (!(await dialog.confirm(`Approve "${reviewCase.title}" and make it live?`))) return;
                await act(reviewCase.id, () => api.post(`/api/admin/cases/${reviewCase.id}/approve`));
                setReviewCase(null);
              }}
              onReject={async () => {
                const reason = await dialog.prompt(`Reason for rejecting "${reviewCase.title}" (optional, shown to the submitter):`);
                if (reason === null) return;
                await act(reviewCase.id, () => api.post(`/api/admin/cases/${reviewCase.id}/reject`, { reason: reason || undefined }));
                setReviewCase(null);
              }}
            />
          )}
        </div>
      )}

      {tab === "ongoing" && (
        <div>
          <h2 className="font-display text-lg text-ink">Manage Ongoing Cases</h2>

          <CaseVolunteerRequestsPanel dialog={dialog} onResolved={loadAll} />

          <h2 className="mt-8 font-display text-lg text-ink">All Ongoing Cases</h2>
          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchOngoing}
                onChange={(e) => setSearchOngoing(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ExportButton baseUrl="/api/admin/cases/export?status=ongoing" />
          </div>

          <div className="mt-5 space-y-2">
            {filteredOngoingCases.length === 0 && <p className="text-muted">No ongoing cases.</p>}
            {filteredOngoingCases.map((c) => (
              <OngoingRow key={c.id} caseRow={c} volunteers={volunteerBriefs} busy={busy === c.id} onChange={(fn) => act(c.id, fn)} dialog={dialog} />
            ))}
          </div>
        </div>
      )}

      {tab === "donations" && (
        <div>
          <h1 className="font-display text-2xl text-ink">Donations</h1>
          <DonationsPanel dialog={dialog} />
        </div>
      )}

      {tab === "recurring" && (
        <div>
          <h1 className="font-display text-2xl text-ink">Monthly Pledges</h1>
          <p className="text-sm text-muted mt-1">
            Donors who've committed to giving monthly. Each month's actual payment still shows up in Donations once they
            send and confirm it, this is just the standing commitment.
          </p>
          <RecurringDonationsPanel dialog={dialog} />
        </div>
      )}

      {tab === "approved" && (
        <div>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={searchApproved}
                onChange={(e) => setSearchApproved(e.target.value)}
                placeholder="Search by name, badge ID, or city..."
                className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <ExportButton baseUrl="/api/admin/volunteers/export?status=approved" />
          </div>

          <div className="mt-5 space-y-2">
            {filteredApproved.length === 0 && <p className="text-muted">No approved volunteers yet.</p>}
            {filteredApproved.map((v) => (
              <VolunteerEditRow key={v.id} volunteer={v} busy={busy === v.id} onChange={(fn) => act(v.id, fn)} dialog={dialog} />
            ))}
          </div>
        </div>
      )}

      {tab === "gallery" && (
        <div>
          <h2 className="font-display text-lg text-ink">Completed Cases</h2>
          <p className="text-sm text-muted mt-1">Every case marked complete. Hide any that shouldn't stay visible, hidden cases move to the Hidden Cases tab, admin-only.</p>
          <CompletedCasesPanel dialog={dialog} />

          <h2 className="mt-10 font-display text-lg text-ink">Public Gallery Highlights</h2>
          <p className="text-sm text-muted mt-1">Curated posts shown on the public "Completed Projects" page.</p>
          <GalleryManagementPanel dialog={dialog} />
        </div>
      )}

      {tab === "stories" && (
        <div>
          <h1 className="font-display text-2xl text-ink">Success Stories</h1>
          <SuccessStoriesManagementPanel dialog={dialog} />
        </div>
      )}

      {tab === "namechange" && (
        <div>
          <h2 className="font-display text-lg text-ink">Name Change Requests</h2>
          <NameChangeRequestsPanel dialog={dialog} />
        </div>
      )}

      {tab === "hidden" && (
        <div>
          <h2 className="font-display text-lg text-ink">Hidden Cases</h2>
          <HiddenCasesPanel dialog={dialog} />
        </div>
      )}

      {tab === "rejected" && (
        <div>
          <h2 className="font-display text-lg text-ink">Rejected Cases</h2>
          <RejectedCasesPanel dialog={dialog} />
        </div>
      )}

      {tab === "users" && (
        <div>
          <h1 className="font-display text-2xl text-ink">All Users</h1>
          <UsersPanel dialog={dialog} />
        </div>
      )}

      {tab === "summary" && (
        <div>
          <h1 className="font-display text-2xl text-ink">Daily Summary</h1>
          <TaglineSettingCard />
          <DailySummaryPanel />
        </div>
      )}
    </AdminLayout>
  );
}

// ─── Ongoing case row: multi-volunteer checklist, edit details, funds, complete ───

function OngoingRow({
  caseRow,
  volunteers,
  busy,
  onChange,
  dialog,
}: {
  caseRow: CaseRow;
  volunteers: VolunteerBrief[];
  busy: boolean;
  onChange: (fn: () => Promise<unknown>) => void;
  dialog: ReturnType<typeof useDialog>;
}) {
  const [amount, setAmount] = useState(String(caseRow.amountCollected));
  const [hours, setHours] = useState("0");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(caseRow.title);
  const [description, setDescription] = useState(caseRow.description);
  const [city, setCity] = useState(caseRow.city ?? caseRow.location.split(",")[0]?.trim() ?? "");
  const [province, setProvince] = useState(caseRow.province ?? caseRow.location.split(",")[1]?.trim() ?? "");
  const [contactPhone, setContactPhone] = useState(caseRow.contactPhone ?? "");
  const [amountNeeded, setAmountNeeded] = useState(String(caseRow.amountNeeded));
  const [category, setCategory] = useState(caseRow.category ?? "Other");
  const [images, setImages] = useState<File[]>([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [savingAssignment, setSavingAssignment] = useState(false);

  useEffect(() => {
    api.get<{ volunteers: { id: string }[] }>(`/api/admin/cases/${caseRow.id}/volunteers`).then((data) => {
      setAssignedIds(new Set(data.volunteers.map((v) => v.id)));
    });
  }, [caseRow.id]);

  function toggleVolunteer(id: string) {
    setAssignedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveAssignment() {
    setSavingAssignment(true);
    try {
      await api.post(`/api/admin/cases/${caseRow.id}/assign-volunteers`, { volunteerIds: Array.from(assignedIds) });
      setAssignOpen(false);
    } finally {
      setSavingAssignment(false);
    }
  }

  async function saveEdit() {
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("city", city);
    formData.append("province", province);
    formData.append("contactPhone", contactPhone);
    formData.append("amountNeeded", amountNeeded);
    formData.append("category", category);
    images.forEach((img) => formData.append("images", img));
    await api.patchForm(`/api/admin/cases/${caseRow.id}`, formData);
    setEditing(false);
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          {caseRow.imageUrl && <img src={caseRow.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />}
          <div>
            <h3 className="font-display text-lg text-ink">{caseRow.title}</h3>
            <p className="text-sm text-muted">{caseRow.location} &middot; Goal PKR {caseRow.amountNeeded.toLocaleString()}</p>
            <p className="text-xs text-muted mt-1">{assignedIds.size} volunteer(s) assigned</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditing((e) => !e)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-background">
            <Pencil size={14} />
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              if (!(await dialog.confirm(`Delete "${caseRow.title}"? This removes it entirely, including its volunteer assignments. This can't be undone.`))) return;
              onChange(() => api.delete(`/api/admin/cases/${caseRow.id}`));
            }}
            className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <CityPicker city={city} province={province} onChange={(c, p) => { setCity(c); setProvince(p); }} />
          <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact phone" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input type="number" value={amountNeeded} onChange={(e) => setAmountNeeded(e.target.value)} onWheel={(e) => e.currentTarget.blur()} placeholder="Amount needed" className="block w-40 rounded-lg border border-border px-3 py-2 text-sm" />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="block w-48 rounded-lg border border-border px-3 py-2 text-sm bg-white">
            {["Medical", "Food Drive", "Education", "Shelter", "Emergency Relief", "Other"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="file" accept="image/*" multiple onChange={(e) => setImages(Array.from(e.target.files ?? []).slice(0, 5))} className="block text-sm" />
          {images.length > 0 && <p className="text-xs text-muted mt-1">{images.length} new photo(s) selected, will replace existing photos.</p>}
          <button disabled={busy} onClick={() => onChange(saveEdit)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50">
            Save Changes
          </button>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-border">
        <button
          onClick={() => setAssignOpen((v) => !v)}
          className="text-sm font-semibold text-primary"
        >
          {assignOpen ? "Hide volunteer checklist" : "Assign / edit volunteers"}
        </button>

        {assignOpen && (
          <div className="mt-3 space-y-2">
            {volunteers.filter((v) => v.volunteerStatus !== "alumni").length === 0 && <p className="text-sm text-muted">No active volunteers yet.</p>}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {volunteers.filter((v) => v.volunteerStatus !== "alumni").map((v) => (
                <label key={v.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignedIds.has(v.id)}
                    onChange={() => toggleVolunteer(v.id)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-sm text-ink">{v.name}</span>
                  {v.badgeId && <span className="text-xs font-mono text-muted">{v.badgeId}</span>}
                </label>
              ))}
            </div>
            <button
              disabled={savingAssignment}
              onClick={saveAssignment}
              className="mt-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50"
            >
              {savingAssignment ? "Saving..." : "Save Assignment"}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-ink">Collected (PKR)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} onWheel={(e) => e.currentTarget.blur()} className="mt-1 block w-36 rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <button
          disabled={busy}
          onClick={() => onChange(() => api.post(`/api/admin/cases/${caseRow.id}/update-collected`, { amount: Number(amount) }))}
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50"
        >
          Update
        </button>

        <div className="ml-4">
          <label className="text-xs font-medium text-ink">Hours (credited to every assigned volunteer)</label>
          <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} onWheel={(e) => e.currentTarget.blur()} className="mt-1 block w-28 rounded-lg border border-border px-3 py-2 text-sm" />
        </div>
        <button
          disabled={busy}
          onClick={async () => {
            const ok = await dialog.confirm(
              `Mark "${caseRow.title}" as complete? ${hours} hour(s) will be credited to all ${assignedIds.size} assigned volunteer(s), and this moves the case to Gallery. This can't be easily undone.`,
            );
            if (!ok) return;
            onChange(() => api.post(`/api/admin/cases/${caseRow.id}/complete`, { hoursContributed: Number(hours) }));
          }}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-ink hover:bg-accent-dark disabled:opacity-50"
        >
          Mark Complete
        </button>
      </div>
    </div>
  );
}

// ─── Approved volunteer row: edit city/motto/motivation/hours/cases ───

function VolunteerEditRow({
  volunteer,
  busy,
  onChange,
  dialog,
}: {
  volunteer: VolunteerBrief;
  busy: boolean;
  onChange: (fn: () => Promise<unknown>) => void;
  dialog: ReturnType<typeof useDialog>;
}) {
  const [editing, setEditing] = useState(false);
  const [city, setCity] = useState(volunteer.city ?? "");
  const [motto, setMotto] = useState("");
  const [motivation, setMotivation] = useState("");
  const [hours, setHours] = useState("");
  const [cases, setCases] = useState("");
  const [status, setStatus] = useState<"approved" | "alumni">((volunteer.volunteerStatus as any) === "alumni" ? "alumni" : "approved");
  const [servedUntil, setServedUntil] = useState(volunteer.volunteerServedUntil ?? "");
  const [error, setError] = useState("");
  const isAlumni = volunteer.volunteerStatus === "alumni";

  async function save() {
    setError("");
    if (status === "alumni" && !servedUntil.trim()) {
      setError("Add a \"served until\" date for a past volunteer");
      return;
    }
    try {
      const patch: Record<string, unknown> = { status };
      if (city) patch.city = city;
      if (motto) patch.motto = motto;
      if (motivation) patch.motivation = motivation;
      if (hours !== "") patch.totalHoursContributed = Number(hours);
      if (cases !== "") patch.totalCasesCompleted = Number(cases);
      if (status === "alumni") patch.servedUntil = servedUntil;
      await api.patch(`/api/admin/volunteers/${volunteer.id}`, patch);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  async function handleDelete() {
    if (!(await dialog.confirm(`Delete ${volunteer.name}'s account permanently? This can't be undone.`))) return;
    try {
      await onChange(() => api.delete(`/api/admin/users/${volunteer.id}`));
    } catch (err) {
      await dialog.alert(err instanceof ApiError ? err.message : "Couldn't delete this user, please try again.", "Delete failed");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-lg text-ink">{volunteer.name}</h3>
            {isAlumni ? (
              <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-semibold text-warning-dark">Alumni</span>
            ) : (
              <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success-dark">Active</span>
            )}
          </div>
          <p className="text-sm text-muted font-mono">{volunteer.badgeId} &middot; {volunteer.city}</p>
          {isAlumni && volunteer.volunteerServedUntil && (
            <p className="mt-0.5 text-xs text-muted">Served until {volunteer.volunteerServedUntil}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditing((e) => !e)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-background">
            <Pencil size={14} />
          </button>
          <button disabled={busy} onClick={handleDelete} className="h-8 w-8 rounded-lg border border-border text-danger flex items-center justify-center hover:bg-danger/10 disabled:opacity-50" title="Delete volunteer">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input value={motto} onChange={(e) => setMotto(e.target.value)} placeholder="Public motto (one line)" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Internal notes / motivation" rows={2} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <div className="flex gap-3">
            <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} onWheel={(e) => e.currentTarget.blur()} placeholder="Total hours" className="block w-32 rounded-lg border border-border px-3 py-2 text-sm" />
            <input type="number" value={cases} onChange={(e) => setCases(e.target.value)} onWheel={(e) => e.currentTarget.blur()} placeholder="Cases completed" className="block w-32 rounded-lg border border-border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted">Volunteer status</label>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setStatus("approved")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${status === "approved" ? "bg-primary text-background" : "bg-background border border-border text-ink/70"}`}
              >
                Active (currently enrolled)
              </button>
              <button
                type="button"
                onClick={() => setStatus("alumni")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${status === "alumni" ? "bg-primary text-background" : "bg-background border border-border text-ink/70"}`}
              >
                Alumni (past volunteer)
              </button>
            </div>
          </div>
          {status === "alumni" && (
            <div>
              <label className="text-xs text-muted">Served until</label>
              <input value={servedUntil} onChange={(e) => setServedUntil(e.target.value)} placeholder="e.g. 2026 or December 2026" className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm" />
            </div>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
          <button disabled={busy} onClick={() => onChange(save)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50">
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Pending case review modal: full details + contact info + approve/reject in one place ───

function PendingCaseReviewModal({
  caseRow,
  busy,
  onClose,
  onApprove,
  onReject,
}: {
  caseRow: CaseRow;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const images = caseRow.images?.length ? caseRow.images : caseRow.imageUrl ? [caseRow.imageUrl] : [];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[88vh] overflow-y-auto p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150">
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-background flex items-center justify-center">
          <X size={16} />
        </button>

        {images.length > 0 && <ImageCarousel images={images} alt={caseRow.title} className="w-full h-56 object-cover rounded-xl" />}

        <span className="mt-4 inline-block text-xs font-semibold tracking-wide text-primary uppercase">{caseRow.category ?? "Case"}</span>
        <h2 className="mt-1 font-display text-2xl text-ink">{caseRow.title}</h2>
        <p className="mt-1 text-sm text-muted">{caseRow.location} &middot; PKR {caseRow.amountNeeded.toLocaleString()} needed</p>

        <p className="mt-4 text-sm text-ink/85 leading-relaxed whitespace-pre-wrap">{caseRow.description}</p>

        <div className="mt-5 rounded-xl bg-background p-4 grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted">Submitted by</p>
            <p className="font-semibold text-ink">{caseRow.submitterName ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Email</p>
            <p className="font-semibold text-ink">{caseRow.submitterEmail ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Phone</p>
            <p className="font-semibold text-ink">{caseRow.contactPhone ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Submitted on</p>
            <p className="font-semibold text-ink">{caseRow.createdAt ? new Date(caseRow.createdAt).toLocaleDateString() : "N/A"}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button disabled={busy} onClick={onApprove} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-success px-5 py-3 text-sm font-semibold text-white hover:bg-success-dark disabled:opacity-50">
            <Check size={16} /> Approve
          </button>
          <button disabled={busy} onClick={onReject} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-danger/10 px-5 py-3 text-sm font-semibold text-danger hover:bg-danger/20 disabled:opacity-50">
            <X size={16} /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completed cases: hide any that shouldn't stay publicly visible ───

function CompletedCasesPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ cases: CaseRow[] }>("/api/cases?status=completed").then((d) => setRows(d.cases)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
  }, [rows, search]);

  async function hide(c: CaseRow) {
    const reason = await dialog.prompt(`Why are you hiding "${c.title}"? (required, admin-only note)`);
    if (!reason) return;
    setBusy(c.id);
    try {
      await api.post(`/api/admin/cases/${c.id}/hide`, { reason });
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location..."
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <ExportButton baseUrl="/api/admin/cases/export?status=completed" />
      </div>

      <div className="mt-5 space-y-2">
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="text-muted">No completed cases yet.</p>}
        {filtered.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-white p-3.5 flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {c.imageUrl && <img src={c.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />}
              <div>
                <h3 className="font-display text-base text-ink">{c.title}</h3>
                <p className="text-sm text-muted">{c.location} &middot; PKR {c.amountCollected.toLocaleString()} raised</p>
              </div>
            </div>
            <button
              disabled={busy === c.id}
              onClick={() => hide(c)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-danger hover:bg-danger/10 disabled:opacity-50 shrink-0"
            >
              <EyeOff size={14} /> Hide
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Homepage tagline banner (shown at the very top of every page) ───

function TaglineSettingCard() {
  const [tagline, setTagline] = useState("");
  const [taglineCaseId, setTaglineCaseId] = useState<string>("");
  const [caseSearch, setCaseSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [ongoingCases, setOngoingCases] = useState<{ id: string; title: string }[]>([]);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const searchBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<{ tagline: string | null; taglineCase: { id: string; title: string } | null }>("/api/site-settings")
      .then((d) => {
        setTagline(d.tagline ?? "");
        setTaglineCaseId(d.taglineCase?.id ?? "");
        setCaseSearch(d.taglineCase?.title ?? "");
      });
    api.get<{ cases: { id: string; title: string }[] }>("/api/cases?status=ongoing").then((d) => setOngoingCases(d.cases));
  }, []);

  // Close the suggestions dropdown on outside click.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filteredCases = caseSearch.trim()
    ? ongoingCases.filter((c) => c.title.toLowerCase().includes(caseSearch.trim().toLowerCase()))
    : ongoingCases;

  function selectCase(c: { id: string; title: string }) {
    setTaglineCaseId(c.id);
    setCaseSearch(c.title);
    setShowSuggestions(false);
    setSaved(false);
  }

  function clearCaseSelection() {
    setTaglineCaseId("");
    setCaseSearch("");
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      await api.post("/api/admin/site-settings", { tagline, taglineCaseId: taglineCaseId || null });
      setSaved(true);
      setConfirmation(taglineCaseId ? "Tagline & case link added" : tagline.trim() ? "Tagline added" : "Tagline cleared");
      setTimeout(() => setConfirmation(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-5 mb-8 rounded-lg border border-border bg-white p-3.5">
      <h2 className="font-display text-base text-ink">Homepage Tagline</h2>
      <p className="text-sm text-muted mt-1">Shown as a blue strip at the very top of every page. Leave blank to hide it.</p>
      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        <input
          value={tagline}
          onChange={(e) => { setTagline(e.target.value); setSaved(false); }}
          maxLength={160}
          placeholder="e.g. Support the medicine case for Ahmed's family"
          className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          disabled={saving || saved}
          onClick={save}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50 shrink-0"
        >
          {saving ? "Saving..." : saved ? "Saved" : "Save"}
        </button>
      </div>

      {confirmation && (
        <p className="mt-2 text-xs font-semibold text-primary">✓ {confirmation}</p>
      )}

      <div className="mt-3" ref={searchBoxRef}>
        <label className="text-xs font-semibold text-muted uppercase tracking-wide">
          Link a "Support Now" button to a case (optional)
        </label>
        <div className="relative mt-1.5">
          <input
            value={caseSearch}
            onChange={(e) => { setCaseSearch(e.target.value); setTaglineCaseId(""); setShowSuggestions(true); setSaved(false); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search a case by title..."
            className="w-full rounded-full border border-border px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {taglineCaseId && (
            <button
              type="button"
              onClick={clearCaseSelection}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted hover:text-ink"
            >
              Clear
            </button>
          )}
          {showSuggestions && (
            <div className="absolute z-10 mt-1.5 w-full max-h-56 overflow-y-auto rounded-2xl border border-border bg-white shadow-lg">
              {filteredCases.length === 0 ? (
                <div className="px-4 py-2.5 text-sm text-muted">No matching ongoing cases</div>
              ) : (
                filteredCases.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => selectCase(c)}
                    className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 ${c.id === taglineCaseId ? "bg-primary/10 font-semibold text-primary" : "text-ink"}`}
                  >
                    {c.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted mt-1.5">
          When set, a "Support Now" button appears next to your tagline and takes visitors straight to that case.
        </p>
      </div>
    </div>
  );
}

// ─── Rejected cases: restore to pending, or delete for good ───

function RejectedCasesPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ cases: CaseRow[] }>("/api/admin/cases/rejected").then((d) => setRows(d.cases)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((c) => c.title.toLowerCase().includes(q) || c.location.toLowerCase().includes(q));
  }, [rows, search]);

  async function restore(c: CaseRow) {
    setBusy(c.id);
    try {
      await api.post(`/api/admin/cases/${c.id}/restore`, {});
      load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(c: CaseRow) {
    if (!(await dialog.confirm(`Permanently delete "${c.title}"? This can't be undone.`))) return;
    setBusy(c.id);
    try {
      await api.delete(`/api/admin/cases/${c.id}`);
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or location..."
          className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="mt-5 space-y-2">
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="text-muted">No rejected cases.</p>}
        {filtered.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-white p-3.5 flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {c.imageUrl && <img src={c.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />}
              <div>
                <h3 className="font-display text-base text-ink">{c.title}</h3>
                <p className="text-sm text-muted">{c.location}</p>
                {(c as any).rejectionReason && <p className="mt-1 text-sm text-danger">Reason: {(c as any).rejectionReason}</p>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button disabled={busy === c.id} onClick={() => restore(c)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-background disabled:opacity-50">
                <Undo2 size={14} /> Restore
              </button>
              <button disabled={busy === c.id} onClick={() => remove(c)} className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Name change requests: volunteers/donors asking to update their display name ───

type NameChangeRow = { id: string; name: string; pendingNameChange: string | null; email: string };

function NameChangeRequestsPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [rows, setRows] = useState<NameChangeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ requests: NameChangeRow[] }>("/api/admin/name-change-requests").then((d) => setRows(d.requests)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    try {
      await fn();
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      {loading && <p className="text-muted">Loading...</p>}
      {!loading && rows.length === 0 && <p className="text-muted">No pending name change requests.</p>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-white p-3.5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted">{r.email}</p>
              <p className="mt-1 text-ink">
                <span className="line-through text-muted">{r.name}</span>
                {" → "}
                <span className="font-display text-lg text-primary">{r.pendingNameChange}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                disabled={busy === r.id}
                onClick={() => act(r.id, () => api.post(`/api/admin/name-change-requests/${r.id}/approve`))}
                className="h-8 w-8 rounded-lg bg-success text-white flex items-center justify-center hover:bg-success-dark disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button
                disabled={busy === r.id}
                onClick={async () => {
                  if (!(await dialog.confirm(`Reject ${r.name}'s name change request?`))) return;
                  act(r.id, () => api.post(`/api/admin/name-change-requests/${r.id}/reject`));
                }}
                className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Hidden cases: pulled from public view but kept for admin records ───

function HiddenCasesPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [rows, setRows] = useState<(CaseRow & { hiddenReason?: string | null; hiddenAt?: string | null })[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    api.get<{ cases: any[] }>(`/api/admin/cases/hidden?${params}`).then((d) => setRows(d.cases)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function unhide(id: string) {
    setBusy(id);
    try {
      await api.post(`/api/admin/cases/${id}/unhide`, {});
      load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location..."
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <ExportButton baseUrl="/api/admin/cases/export?status=all" />
      </div>

      <div className="mt-5 space-y-2">
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && rows.length === 0 && <p className="text-muted">No hidden cases. Only admins can see this tab.</p>}
        {rows.map((c) => (
          <div key={c.id} className="rounded-lg border border-border bg-white p-3.5 flex items-start justify-between gap-4">
            <div className="flex gap-4">
              {c.imageUrl && <img src={c.imageUrl} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0 grayscale" />}
              <div>
                <h3 className="font-display text-lg text-ink">{c.title}</h3>
                <p className="text-sm text-muted">{c.location} &middot; status: {c.status}</p>
                {c.hiddenReason && <p className="mt-1 text-sm text-danger">Hidden: {c.hiddenReason}</p>}
              </div>
            </div>
            <button
              disabled={busy === c.id}
              onClick={() => unhide(c.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-background disabled:opacity-50 shrink-0"
            >
              <Eye size={14} /> Unhide
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Donations panel: filter by status, search, export CSV ───

type DonationStatusFilter = "pending" | "confirmed" | "rejected" | "all";

function DonationsPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [statusFilter, setStatusFilter] = useState<DonationStatusFilter>("pending");
  const [search, setSearch] = useState("");
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: statusFilter, search });
    const data = await api.get<{ donations: DonationRow[] }>(`/api/admin/donations?${params}`);
    setDonations(data.donations);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    setSelected(new Set());
  }, [statusFilter, search]);

  async function act(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    try {
      await action();
      await load();
    } finally {
      setBusy(null);
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkConfirm() {
    if (selected.size === 0) return;
    if (!(await dialog.confirm(`Confirm ${selected.size} donation(s)? This adds each to its case's collected total.`))) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selected].map((id) => api.post(`/api/admin/donations/${id}/confirm`)));
      setSelected(new Set());
      await load();
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkReject() {
    if (selected.size === 0) return;
    const reason = await dialog.prompt(`Reason for rejecting ${selected.size} donation(s) (optional, shown to the donors):`);
    if (reason === null) return;
    setBulkBusy(true);
    try {
      await Promise.all([...selected].map((id) => api.post(`/api/admin/donations/${id}/reject`, { reason: reason || undefined })));
      setSelected(new Set());
      await load();
    } finally {
      setBulkBusy(false);
    }
  }


  return (
    <div className="mt-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sender account/phone, donor name, email, or case..."
            className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <ExportButton baseUrl={`/api/admin/donations/export?${new URLSearchParams({ status: statusFilter, search })}`} />
      </div>

      <div className="mt-3 flex gap-2">
        {(["pending", "confirmed", "rejected", "all"] as DonationStatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors capitalize ${
              statusFilter === s ? "bg-primary text-background border-primary" : "bg-white text-ink border-border hover:bg-background"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {statusFilter === "pending" && (
        <BulkActionBar
          count={selected.size}
          busy={bulkBusy}
          onApproveAll={bulkConfirm}
          onRejectAll={bulkReject}
          onClear={() => setSelected(new Set())}
          approveLabel="Confirm All"
        />
      )}

      <div className="mt-5 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-xs font-semibold text-muted uppercase tracking-wide">
              {statusFilter === "pending" && (
                <th className="w-10 px-3.5 py-2.5">
                  <SelectAllCheckbox
                    ids={donations.map((d) => d.id)}
                    selected={selected}
                    onToggle={() =>
                      setSelected((prev) => {
                        const ids = donations.map((d) => d.id);
                        return ids.length > 0 && ids.every((id) => prev.has(id)) ? new Set() : new Set(ids);
                      })
                    }
                  />
                </th>
              )}
              <th className="px-3.5 py-2.5">Receipt</th>
              <th className="px-3.5 py-2.5">Donation</th>
              <th className="px-3.5 py-2.5">Sent from</th>
              <th className="px-3.5 py-2.5">Date</th>
              <th className="px-3.5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="px-3.5 py-6 text-center text-muted">Loading...</td></tr>
            ) : donations.length === 0 ? (
              <tr><td colSpan={6} className="px-3.5 py-6 text-center text-muted">No {statusFilter !== "all" ? statusFilter : ""} donations found.</td></tr>
            ) : (
              donations.map((d) => (
                <tr key={d.id} className={`hover:bg-background/40 transition-colors ${selected.has(d.id) ? "bg-primary/5" : ""}`}>
                  {statusFilter === "pending" && (
                    <td className="px-3.5 py-3 align-top">
                      <input type="checkbox" className="accent-primary" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} />
                    </td>
                  )}
                  <td className="px-3.5 py-3 align-top">
                    <a href={d.receiptImage} target="_blank" rel="noopener noreferrer">
                      <img src={d.receiptImage} alt="Payment receipt" className="h-12 w-12 rounded-lg object-cover border border-border hover:opacity-80 transition-opacity" />
                    </a>
                  </td>
                  <td className="px-3.5 py-3 align-top">
                    <div className="font-display text-ink">PKR {d.amount.toLocaleString()}, {d.caseTitle}</div>
                    <div className="mt-0.5 text-xs text-muted">{d.donorName} ({d.donorEmail}) &middot; {d.method.replace("_", " ")}</div>
                    {d.referenceNote && <div className="text-xs text-muted">Ref: {d.referenceNote}</div>}
                    {d.status === "rejected" && d.rejectionReason && <div className="mt-1 text-xs text-danger">Rejected: {d.rejectionReason}</div>}
                  </td>
                  <td className="px-3.5 py-3 align-top text-xs font-mono text-ink/70">{d.senderAccount}</td>
                  <td className="px-3.5 py-3 align-top text-xs text-muted">{new Date(d.createdAt).toLocaleString()}</td>
                  <td className="px-3.5 py-3 align-top">
                    <div className="flex justify-end gap-2">
                      {d.status === "pending" && (
                        <>
                          <button
                            disabled={busy === d.id}
                            onClick={async () => {
                              if (!(await dialog.confirm(`Confirm this PKR ${d.amount.toLocaleString()} donation? This adds it to the case's collected total.`))) return;
                              act(d.id, () => api.post(`/api/admin/donations/${d.id}/confirm`));
                            }}
                            className="h-8 w-8 rounded-lg bg-success text-white flex items-center justify-center hover:bg-success-dark disabled:opacity-50"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            disabled={busy === d.id}
                            onClick={async () => {
                              const reason = await dialog.prompt("Reason (optional, shown to the donor):");
                              if (reason === null) return;
                              act(d.id, () => api.post(`/api/admin/donations/${d.id}/reject`, { reason: reason || undefined }));
                            }}
                            className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {(d.status === "confirmed" || d.status === "rejected") && (
                        <button
                          disabled={busy === d.id}
                          onClick={async () => {
                            if (!(await dialog.confirm("Move this donation back to pending for re-review?"))) return;
                            act(d.id, () => api.post(`/api/admin/donations/${d.id}/revert`));
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-background disabled:opacity-50"
                        >
                          <Undo2 size={14} /> Undo
                        </button>
                      )}
                      <button
                        disabled={busy === d.id}
                        onClick={async () => {
                          if (!(await dialog.confirm(`Permanently delete this donation record (PKR ${d.amount.toLocaleString()})? This can't be undone.`))) return;
                          act(d.id, () => api.delete(`/api/admin/donations/${d.id}`));
                        }}
                        className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
                        title="Delete record"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type PledgeStatusFilter = "active" | "paused" | "cancelled" | "all";

function RecurringDonationsPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [statusFilter, setStatusFilter] = useState<PledgeStatusFilter>("active");
  const [pledges, setPledges] = useState<PledgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedPledgeId, setExpandedPledgeId] = useState<string | null>(null);
  const [history, setHistory] = useState<Record<string, DonationRow[]>>({});
  const [historyLoading, setHistoryLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await api.get<{ pledges: PledgeRow[] }>("/api/admin/recurring-donations");
    setPledges(data.pledges);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = statusFilter === "all" ? pledges : pledges.filter((p) => p.status === statusFilter);

  async function cancelPledge(p: PledgeRow) {
    if (!(await dialog.confirm(`Cancel ${p.donorName}'s monthly PKR ${p.amount.toLocaleString()} pledge for "${p.caseTitle}"?`))) return;
    setBusy(p.id);
    try {
      await api.post(`/api/admin/recurring-donations/${p.id}/cancel`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function toggleHistory(p: PledgeRow) {
    if (expandedPledgeId === p.id) {
      setExpandedPledgeId(null);
      return;
    }
    setExpandedPledgeId(p.id);
    if (!history[p.id]) {
      setHistoryLoading(p.id);
      const data = await api.get<{ donations: DonationRow[] }>(`/api/admin/donations?recurringDonationId=${p.id}`);
      setHistory((prev) => ({ ...prev, [p.id]: data.donations }));
      setHistoryLoading(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex gap-2">
        {(["active", "paused", "cancelled", "all"] as PledgeStatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold border transition-colors capitalize ${
              statusFilter === s ? "bg-primary text-background border-primary" : "bg-white text-ink border-border hover:bg-background"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="text-muted">No {statusFilter !== "all" ? statusFilter : ""} pledges found.</p>
        ) : (
          filtered.map((p) => {
            const isExpanded = expandedPledgeId === p.id;
            return (
              <div key={p.id} className="rounded-lg border border-border bg-white p-3.5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-display text-lg text-ink">PKR {p.amount.toLocaleString()}/month, {p.caseTitle}</h3>
                    <p className="text-sm text-muted">{p.donorName} ({p.donorEmail}) &middot; {p.method.replace("_", " ")}</p>
                    {p.status === "active" && (
                      <p className="mt-1 text-xs text-muted">Next due: {new Date(p.nextDueDate).toLocaleDateString()}</p>
                    )}
                    <p className="mt-1 text-xs text-muted">
                      {p.lastDonationDate ? <>Last payment: {new Date(p.lastDonationDate).toLocaleDateString()}</> : "No confirmed payment yet"}
                      {" "}&middot; Started {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                        p.status === "active" ? "text-success-dark bg-success/10" : p.status === "paused" ? "text-accent-dark bg-accent/10" : "text-muted bg-background"
                      }`}
                    >
                      {p.status}
                    </span>
                    {p.status !== "cancelled" && (
                      <button
                        disabled={busy === p.id}
                        onClick={() => cancelPledge(p)}
                        className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
                        title="Cancel pledge"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleHistory(p)}
                  className="mt-3 text-xs font-semibold text-primary hover:text-primary-dark"
                >
                  {isExpanded ? "Hide" : "View"} full donation history
                </button>

                {isExpanded && (
                  <div className="mt-2 border-t border-border pt-3">
                    {historyLoading === p.id ? (
                      <p className="text-xs text-muted">Loading history...</p>
                    ) : (history[p.id]?.length ?? 0) === 0 ? (
                      <p className="text-xs text-muted">No payments recorded against this pledge yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {history[p.id].map((d) => (
                          <div key={d.id} className="flex items-center justify-between text-xs">
                            <span className="text-ink/80">{new Date(d.createdAt).toLocaleDateString()} &middot; PKR {d.amount.toLocaleString()}</span>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold capitalize ${
                                d.status === "confirmed" ? "text-success-dark bg-success/10" : d.status === "pending" ? "text-accent-dark bg-accent/10" : "text-danger bg-danger/10"
                              }`}
                            >
                              {d.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Gallery management: list, edit, add new (editable — auto-created on case completion) ───

type GalleryEventRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  images: string[];
  families: string | null;
  items: string | null;
  funds: string | null;
};

function GalleryManagementPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [events, setEvents] = useState<GalleryEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get<{ events: GalleryEventRow[] }>("/api/gallery").then((data) => setEvents(data.events)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-5">
      <a
        href="/admin/gallery/new"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark transition-colors"
      >
        <Plus size={15} /> Add New Event
      </a>

      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-muted">No gallery events yet. They'll also appear automatically when you mark a case complete.</p>
        ) : (
          events.map((e) => <GalleryEditRow key={e.id} event={e} onSaved={load} dialog={dialog} />)
        )}
      </div>
    </div>
  );
}

function GalleryEditRow({ event, onSaved, dialog }: { event: GalleryEventRow; onSaved: () => void; dialog: ReturnType<typeof useDialog> }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description);
  const [location, setLocation] = useState(event.location);
  const [eventDate, setEventDate] = useState(event.eventDate);
  const [families, setFamilies] = useState(event.families ?? "");
  const [items, setItems] = useState(event.items ?? "");
  const [funds, setFunds] = useState(event.funds ?? "");
  const [saving, setSaving] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/api/admin/gallery/${event.id}`, { title, description, location, eventDate, families, items, funds });
      setEditing(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-white p-3.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          {event.images.length > 0 && (
            <div className="relative h-20 w-20 shrink-0">
              <img src={event.images[imgIndex]} alt="" className="h-20 w-20 rounded-lg object-cover" />
              {event.images.length > 1 && (
                <>
                  <button onClick={() => setImgIndex((i) => (i - 1 + event.images.length) % event.images.length)} className="absolute -left-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border border-border flex items-center justify-center">
                    <ChevronLeft size={11} />
                  </button>
                  <button onClick={() => setImgIndex((i) => (i + 1) % event.images.length)} className="absolute -right-2 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white border border-border flex items-center justify-center">
                    <ChevronRight size={11} />
                  </button>
                </>
              )}
            </div>
          )}
          <div>
            <h3 className="font-display text-lg text-ink">{event.title}</h3>
            <p className="text-sm text-muted">{event.location} &middot; {event.eventDate}</p>
            <p className="mt-1 text-xs text-muted">{event.families} &middot; {event.items} &middot; {event.funds}</p>
          </div>
        </div>
        <button onClick={() => setEditing((v) => !v)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-background shrink-0">
          <Pencil size={14} />
        </button>
        <button
          onClick={async () => {
            if (!(await dialog.confirm(`Delete "${event.title}" from Completed Projects? This can't be undone.`))) return;
            await api.delete(`/api/admin/gallery/${event.id}`);
            onSaved();
          }}
          className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 shrink-0 ml-2"
        >
          <X size={14} />
        </button>
      </div>

      {editing && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Title" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Location" />
          <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Date" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="block w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Description" />
          <div className="grid grid-cols-3 gap-2">
            <input value={families} onChange={(e) => setFamilies(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="Families/People" />
            <input value={items} onChange={(e) => setItems(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="Items" />
            <input value={funds} onChange={(e) => setFunds(e.target.value)} className="rounded-lg border border-border px-3 py-2 text-sm" placeholder="Funds used" />
          </div>
          <button disabled={saving} onClick={save} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Success stories management: list + add new (admin-curated) ───

type SuccessStoryRow = {
  id: string;
  name: string;
  title: string;
  storyDate: string;
  quote: string;
  beforeImage: string;
  afterImage: string;
};

function SuccessStoriesManagementPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [stories, setStories] = useState<SuccessStoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api.get<{ stories: SuccessStoryRow[] }>("/api/success-stories").then((data) => setStories(data.stories)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mt-5">
      <a
        href="/admin/success-stories/new"
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark transition-colors"
      >
        <Plus size={15} /> Add New Story
      </a>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : stories.length === 0 ? (
          <p className="text-muted">No success stories yet.</p>
        ) : (
          stories.map((s) => <SuccessStoryEditCard key={s.id} story={s} dialog={dialog} onChanged={load} />)
        )}
      </div>
    </div>
  );
}

function SuccessStoryEditCard({ story, dialog, onChanged }: { story: SuccessStoryRow; dialog: ReturnType<typeof useDialog>; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(story.name);
  const [title, setTitle] = useState(story.title);
  const [storyDate, setStoryDate] = useState(story.storyDate);
  const [quote, setQuote] = useState(story.quote);
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("title", title);
      formData.append("storyDate", storyDate);
      formData.append("quote", quote);
      if (before) formData.append("before", before);
      if (after) formData.append("after", after);
      await api.patchForm(`/api/admin/success-stories/${story.id}`, formData);
      setEditing(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!(await dialog.confirm(`Delete the success story "${story.title}"? This can't be undone.`))) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/success-stories/${story.id}`);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <div className="flex gap-3">
        <div className="grid grid-cols-2 gap-1 shrink-0">
          <img src={story.beforeImage} alt="Before" className="h-16 w-16 rounded-lg object-cover" />
          <img src={story.afterImage} alt="After" className="h-16 w-16 rounded-lg object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base text-ink truncate">{story.title}</h3>
          <p className="text-xs text-muted">{story.storyDate}</p>
          <p className="mt-1 text-xs text-ink/70 line-clamp-2">{story.quote}</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button onClick={() => setEditing((v) => !v)} className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-background">
            <Pencil size={13} />
          </button>
          <button onClick={remove} disabled={busy} className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50">
            <X size={13} />
          </button>
        </div>
      </div>

      {editing && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <input value={storyDate} onChange={(e) => setStoryDate(e.target.value)} placeholder="Date" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <textarea value={quote} onChange={(e) => setQuote(e.target.value)} rows={3} placeholder="Quote" className="block w-full rounded-lg border border-border px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted">Replace before photo</label>
              <input type="file" accept="image/*" onChange={(e) => setBefore(e.target.files?.[0] ?? null)} className="block text-xs mt-1" />
            </div>
            <div>
              <label className="text-xs text-muted">Replace after photo</label>
              <input type="file" accept="image/*" onChange={(e) => setAfter(e.target.files?.[0] ?? null)} className="block text-xs mt-1" />
            </div>
          </div>
          <button disabled={busy} onClick={save} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary-dark disabled:opacity-50">
            {busy ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Users management: search, ban/unban ───

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  banReason: string | null;
  createdAt: string;
};

function UsersPanel({ dialog }: { dialog: ReturnType<typeof useDialog> }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams(search ? { search } : {});
    const data = await api.get<{ users: UserRow[] }>(`/api/admin/users?${params}`);
    setUsers(data.users);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function act(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    try {
      await action();
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-5">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-border bg-white pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-muted">No users found.</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="rounded-2xl border border-border bg-white p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-ink text-sm truncate">{u.name} <span className="text-xs text-muted font-normal capitalize">({u.role})</span></p>
                <p className="text-xs text-muted truncate">{u.email}</p>
                {u.isBanned && <p className="text-xs text-danger mt-1">Banned{u.banReason ? `: ${u.banReason}` : ""}</p>}
              </div>
              {u.isBanned ? (
                <button
                  disabled={busy === u.id}
                  onClick={async () => {
                    if (!(await dialog.confirm(`Unban ${u.name}? They'll be able to sign in again.`))) return;
                    act(u.id, () => api.post(`/api/admin/users/${u.id}/unban`));
                  }}
                  className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-background disabled:opacity-50"
                >
                  Unban
                </button>
              ) : (
                <button
                  disabled={busy === u.id || u.role === "admin"}
                  onClick={async () => {
                    const reason = await dialog.prompt(`Reason for banning ${u.name} (optional):`, "Ban user");
                    if (reason === null) return;
                    try {
                      await act(u.id, () => api.post(`/api/admin/users/${u.id}/ban`, { reason: reason || undefined }));
                    } catch (err) {
                      await dialog.alert(err instanceof ApiError ? err.message : "Couldn't ban this user, please try again.", "Ban failed");
                    }
                  }}
                  className="shrink-0 rounded-lg bg-danger/10 text-danger px-4 py-2 text-xs font-semibold hover:bg-danger/20 disabled:opacity-50"
                >
                  Ban
                </button>
              )}
              {u.role !== "admin" && (
                <button
                  disabled={busy === u.id}
                  onClick={async () => {
                    if (!(await dialog.confirm(`Delete ${u.name}'s account permanently? This can't be undone.`))) return;
                    try {
                      await act(u.id, () => api.delete(`/api/admin/users/${u.id}`));
                    } catch (err) {
                      await dialog.alert(err instanceof ApiError ? err.message : "Couldn't delete this user, please try again.", "Delete failed");
                    }
                  }}
                  className="shrink-0 h-8 w-8 rounded-lg border border-border text-danger flex items-center justify-center hover:bg-danger/10 disabled:opacity-50"
                  title="Delete user"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Daily activity summary ───

type DailySummary = {
  date: string;
  volunteersApproved: number;
  casesApproved: number;
  casesCompleted: number;
  donationsConfirmed: number;
  fundsConfirmedToday: number;
  newSignups: number;
};

function DailySummaryPanel() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<DailySummary>(`/api/admin/daily-summary?date=${date}`).then((d) => {
      setSummary(d);
      setLoading(false);
    });
  }, [date]);

  return (
    <div className="mt-5">
      <div className="flex items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-border bg-white px-4 py-2.5 text-sm" />
        <a
          href={`/api/admin/daily-summary/export?date=${date}`}
          download
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-background transition-colors"
        >
          <Download size={15} /> Export CSV
        </a>
      </div>

      {loading ? (
        <p className="mt-6 text-muted">Loading...</p>
      ) : summary ? (
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          {[
            ["Volunteers Approved", summary.volunteersApproved],
            ["Cases Approved", summary.casesApproved],
            ["Cases Completed", summary.casesCompleted],
            ["Donations Confirmed", summary.donationsConfirmed],
            ["Funds Confirmed", `PKR ${summary.fundsConfirmedToday.toLocaleString()}`],
            ["New Signups", summary.newSignups],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-border bg-white p-3.5">
              <div className="text-xs text-muted uppercase tracking-wide">{label}</div>
              <div className="mt-1.5 font-display text-2xl text-ink">{value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

// ─── Case volunteer requests: join ("Join Request") or leave ("Withdrawal Request") a case ───

type CaseRequestRow = {
  id: string;
  type: "assignment" | "removal";
  reason: string | null;
  createdAt: string;
  caseId: string;
  caseTitle: string;
  volunteerName: string;
  volunteerEmail: string;
  volunteerBadgeId: string | null;
};

function CaseVolunteerRequestsPanel({ dialog, onResolved }: { dialog: ReturnType<typeof useDialog>; onResolved: () => void }) {
  const [requests, setRequests] = useState<CaseRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await api.get<{ requests: CaseRequestRow[] }>("/api/admin/case-volunteer-requests");
    setRequests(data.requests);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: () => Promise<unknown>) {
    setBusy(id);
    try {
      await action();
      await load();
      onResolved();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return null;
  if (requests.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-accent/30 bg-accent/5 p-5">
      <h2 className="font-display text-lg text-ink">Volunteer Requests ({requests.length})</h2>
      <p className="text-xs text-muted mt-1">Volunteers asking to join or step down from a case.</p>

      <div className="mt-4 space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-white p-4 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${r.type === "assignment" ? "bg-success/10 text-success-dark" : "bg-danger/10 text-danger"}`}>
                  {r.type === "assignment" ? "Join Request" : "Withdrawal Request"}
                </span>
                <span className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-1.5 text-sm text-ink">
                <span className="font-semibold">{r.volunteerName}</span> ({r.volunteerBadgeId}) &middot; {r.caseTitle}
              </p>
              {r.reason && <p className="mt-1 text-sm text-ink/70 italic">"{r.reason}"</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                disabled={busy === r.id}
                onClick={async () => {
                  const label = r.type === "assignment" ? "assign" : "remove";
                  if (!(await dialog.confirm(`${label === "assign" ? "Assign" : "Remove"} ${r.volunteerName} ${label === "assign" ? "to" : "from"} "${r.caseTitle}"?`))) return;
                  act(r.id, () => api.post(`/api/admin/case-volunteer-requests/${r.id}/approve`));
                }}
                className="h-8 w-8 rounded-lg bg-success text-white flex items-center justify-center hover:bg-success-dark disabled:opacity-50"
              >
                <Check size={16} />
              </button>
              <button
                disabled={busy === r.id}
                onClick={() => act(r.id, () => api.post(`/api/admin/case-volunteer-requests/${r.id}/reject`))}
                className="h-8 w-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
