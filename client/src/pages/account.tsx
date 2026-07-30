import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { CompactRotatingBox } from "@/components/ui/CompactRotatingBox";
import { CaseDetailModal } from "@/components/ui/CaseDetailModal";
import { LogOut, ShieldCheck, Clock, CheckCircle2, Heart, Briefcase, Download, Settings, HelpCircle } from "lucide-react";

type CaseRow = {
  id: string;
  title: string;
  location: string;
  status: "pending_review" | "ongoing" | "completed" | "rejected";
  amountNeeded: number;
  amountCollected: number;
  rejectionReason: string | null;
};

const statusLabel: Record<CaseRow["status"], { label: string; color: string }> = {
  pending_review: { label: "Pending Review", color: "text-accent-dark bg-accent/10" },
  ongoing: { label: "Ongoing", color: "text-primary bg-emerald-50" },
  completed: { label: "Completed", color: "text-emerald-700 bg-emerald-50" },
  rejected: { label: "Not Approved", color: "text-red-600 bg-red-50" },
};

function CaseListItem({ c, onClick }: { c: CaseRow; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-xl border border-border bg-background/60 p-3.5 flex items-center justify-between gap-3 hover:bg-background transition-colors">
      <div className="min-w-0">
        <p className="font-medium text-ink text-sm truncate">{c.title}</p>
        <p className="text-xs text-muted truncate">{c.location}</p>
        {c.status === "rejected" && c.rejectionReason && (
          <p className="mt-1 text-xs text-red-600">Reason: {c.rejectionReason}</p>
        )}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusLabel[c.status].color}`}>
        {statusLabel[c.status].label}
      </span>
    </button>
  );
}

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const [myCases, setMyCases] = useState<CaseRow[]>([]);
  const [assignedCases, setAssignedCases] = useState<CaseRow[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<{ cases: CaseRow[] }>("/api/account/my-cases").then((d) => setMyCases(d.cases));
    if (user.volunteerStatus === "approved") {
      api.get<{ cases: CaseRow[] }>("/api/account/assigned-cases").then((d) => setAssignedCases(d.cases));
    }
  }, [user]);

  if (loading) return null;

  if (!user) {
    navigate("/login");
    return null;
  }

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  function initials(name: string) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  }

  const certificateUnlocked = user.totalHoursContributed >= 30;

  return (
    <PageLayout>
      <main className="max-w-xl mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Account</span>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 rounded-full overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary flex items-center justify-center font-display text-2xl text-background">
                  {initials(user.name)}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-display text-3xl text-ink">{user.name}</h1>
              <p className="text-muted">{user.email}</p>
            </div>
          </div>
          <div className="glass-pill-wrap shrink-0">
            <a href="/account/settings" className="glass-pill relative isolate rounded-full block h-10 w-10" title="Edit Profile">
              <span className="glass-pill-text flex items-center justify-center h-10 w-10">
                <Settings size={18} />
              </span>
            </a>
            <div className="glass-pill-shadow rounded-full" />
          </div>
        </div>

        {user.volunteerStatus === "approved" && (
          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <ShieldCheck size={18} /> Verified Volunteer
            </div>
            <p className="mt-1 text-sm font-mono text-muted">Badge: {user.badgeId}</p>
            {user.volunteerServedUntil && (
              <p className="mt-1 text-xs text-muted">Served until {user.volunteerServedUntil}</p>
            )}
            <div className="mt-4 flex gap-8">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted"><Clock size={13} /> Hours</div>
                <div className="mt-1 font-display text-xl text-ink">{user.totalHoursContributed}</div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-muted"><CheckCircle2 size={13} /> Cases Completed</div>
                <div className="mt-1 font-display text-xl text-ink">{user.totalCasesCompleted}</div>
              </div>
            </div>

            {certificateUnlocked ? (
              <div className="glass-pill-wrap mt-5 inline-block">
                <a href="/api/account/certificate" download className="glass-pill relative isolate rounded-full block">
                  <span className="glass-pill-text flex items-center gap-2 px-5 py-2.5 text-sm font-semibold">
                    <Download size={15} /> Download Volunteer Service Certificate
                  </span>
                </a>
                <div className="glass-pill-shadow rounded-full" />
              </div>
            ) : (
              <p className="mt-5 text-xs text-muted">
                Volunteer Service Certificate unlocks at 30 hours, you're at {user.totalHoursContributed}/30.
              </p>
            )}
          </div>
        )}

        {user.volunteerStatus === "pending" && (
          <div className="mt-6 rounded-2xl border border-border bg-white p-6 text-sm text-muted">
            Your volunteer application is pending admin review.
          </div>
        )}

        {user.volunteerStatus === "none" && (
          <div className="mt-6 rounded-2xl border border-border bg-white p-6">
            <p className="text-sm text-muted">Not registered as a volunteer yet.</p>
            <a href="/volunteers/register" className="mt-3 inline-block text-sm font-semibold text-primary">
              Apply to volunteer &rarr;
            </a>
          </div>
        )}

        {assignedCases.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 font-display text-lg text-ink mb-3"><Briefcase size={17} /> Cases You're Assigned To</h2>
            <CompactRotatingBox items={assignedCases} keyFor={(c) => c.id} renderItem={(c) => <CaseListItem c={c} onClick={() => setSelectedCaseId(c.id)} />} />
          </div>
        )}

        {myCases.length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg text-ink mb-3">Cases You Submitted</h2>
            <CompactRotatingBox items={myCases} keyFor={(c) => c.id} renderItem={(c) => <CaseListItem c={c} onClick={() => setSelectedCaseId(c.id)} />} />
          </div>
        )}

        <div className="glass-pill-wrap mt-6 block">
          <a href="/my-donations" className="glass-pill relative isolate rounded-2xl block">
            <span className="glass-pill-text flex items-center justify-between p-5">
              <span className="flex items-center gap-2 font-display text-lg text-ink"><Heart size={17} className="text-accent-dark" /> My Donations</span>
              <span className="text-sm text-primary font-medium">View &rarr;</span>
            </span>
          </a>
          <div className="glass-pill-shadow rounded-2xl" />
        </div>

        <div className="glass-pill-wrap mt-3 block">
          <a href="/help" className="glass-pill relative isolate rounded-2xl block">
            <span className="glass-pill-text flex items-center justify-between p-5">
              <span className="flex items-center gap-2 font-display text-lg text-ink"><HelpCircle size={17} className="text-primary" /> Help &amp; Support</span>
              <span className="text-sm text-primary font-medium">View &rarr;</span>
            </span>
          </a>
          <div className="glass-pill-shadow rounded-2xl" />
        </div>

        <div className="glass-pill-wrap mt-8 inline-block">
          <button onClick={handleLogout} className="glass-pill relative isolate rounded-full block">
            <span className="glass-pill-text flex items-center gap-2 px-6 py-2.5 text-sm font-semibold">
              <LogOut size={15} /> Log Out
            </span>
          </button>
          <div className="glass-pill-shadow rounded-full" />
        </div>
      </main>

      {selectedCaseId && <CaseDetailModal caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} />}
    </PageLayout>
  );
}
