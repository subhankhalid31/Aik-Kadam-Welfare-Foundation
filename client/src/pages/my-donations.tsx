import { useEffect, useState } from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { LogIn, CheckCircle2, Clock, XCircle, Pause, Play, X, Repeat } from "lucide-react";

type DonationRow = {
  id: string;
  caseTitle: string;
  amount: number;
  method: string;
  receiptImage: string;
  status: "pending" | "confirmed" | "rejected";
  rejectionReason: string | null;
  createdAt: string;
  recurringDonationId: string | null;
};

type PledgeRow = {
  id: string;
  caseTitle: string;
  amount: number;
  method: string;
  status: "active" | "paused" | "cancelled";
  nextDueDate: string;
  lastDonationDate: string | null;
};

const statusConfig = {
  pending: { icon: Clock, label: "Pending confirmation", color: "text-accent-dark bg-accent/10" },
  confirmed: { icon: CheckCircle2, label: "Confirmed", color: "text-emerald-700 bg-emerald-50" },
  rejected: { icon: XCircle, label: "Not confirmed", color: "text-red-600 bg-red-50" },
};

export default function MyDonationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [pledges, setPledges] = useState<PledgeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pledgeActionId, setPledgeActionId] = useState<string | null>(null);
  const [expandedPledgeId, setExpandedPledgeId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get<{ donations: DonationRow[] }>("/api/account/my-donations"),
        api.get<{ pledges: PledgeRow[] }>("/api/account/my-recurring-donations"),
      ])
        .then(([d, p]) => {
          setDonations(d.donations);
          setPledges(p.pledges);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  async function handlePledgeAction(id: string, action: "pause" | "resume" | "cancel") {
    setPledgeActionId(id);
    try {
      const { pledge } = await api.post<{ pledge: PledgeRow }>(`/api/recurring-donations/${id}/${action}`);
      setPledges((prev) => prev.map((p) => (p.id === id ? pledge : p)));
    } finally {
      setPledgeActionId(null);
    }
  }

  if (authLoading) return null;

  if (!user) {
    return (
      <PageLayout>
        <main className="max-w-md mx-auto px-6 pt-24 pb-24 text-center">
          <LogIn className="mx-auto text-primary" size={40} />
          <h1 className="mt-5 font-display text-3xl text-ink">Sign in required</h1>
          <a href="/login" className="mt-8 inline-flex items-center justify-center w-full rounded-full bg-primary px-7 py-3.5 font-semibold text-background hover:bg-primary-dark transition-colors">
            Sign In
          </a>
        </main>
      </PageLayout>
    );
  }

  const totalConfirmed = donations.filter((d) => d.status === "confirmed").reduce((sum, d) => sum + d.amount, 0);

  return (
    <PageLayout>
      <main className="max-w-3xl mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">My Donations</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">Where your donations went.</h1>
        {donations.length > 0 && (
          <p className="mt-3 text-muted">
            You've contributed <span className="font-semibold text-primary">PKR {totalConfirmed.toLocaleString()}</span> (confirmed) across {new Set(donations.map((d) => d.caseTitle)).size} case(s).
          </p>
        )}

        {!loading && pledges.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-lg text-ink flex items-center gap-2">
              <Repeat size={18} className="text-primary" /> Monthly Pledges
            </h2>
            <div className="mt-3 space-y-3">
              {pledges.map((p) => {
                const history = donations.filter((d) => d.recurringDonationId === p.id);
                const isExpanded = expandedPledgeId === p.id;
                return (
                  <div key={p.id} className="rounded-2xl border border-border bg-white p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-display text-lg text-ink">{p.caseTitle}</h3>
                        <p className="text-sm text-muted">
                          PKR {p.amount.toLocaleString()}/month &middot; {p.method.replace("_", " ")}
                          {p.status === "active" && <> &middot; next due {new Date(p.nextDueDate).toLocaleDateString()}</>}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {p.lastDonationDate ? <>Last payment {new Date(p.lastDonationDate).toLocaleDateString()}</> : "No confirmed payment yet"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            p.status === "active" ? "text-emerald-700 bg-emerald-50" : p.status === "paused" ? "text-accent-dark bg-accent/10" : "text-muted bg-background"
                          }`}
                        >
                          {p.status === "active" ? "Active" : p.status === "paused" ? "Paused" : "Cancelled"}
                        </span>
                        {p.status !== "cancelled" && (
                          <>
                            <button
                              type="button"
                              disabled={pledgeActionId === p.id}
                              onClick={() => handlePledgeAction(p.id, p.status === "active" ? "pause" : "resume")}
                              title={p.status === "active" ? "Pause" : "Resume"}
                              className="rounded-full border border-border p-2 text-ink hover:bg-background transition-colors disabled:opacity-50"
                            >
                              {p.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button
                              type="button"
                              disabled={pledgeActionId === p.id}
                              onClick={() => handlePledgeAction(p.id, "cancel")}
                              title="Cancel"
                              className="rounded-full border border-border p-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {history.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setExpandedPledgeId(isExpanded ? null : p.id)}
                          className="mt-3 text-xs font-semibold text-primary hover:text-primary-dark"
                        >
                          {isExpanded ? "Hide" : "View"} payment history ({history.length})
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-1.5 border-t border-border pt-3">
                            {history.map((d) => {
                              const s = statusConfig[d.status];
                              return (
                                <div key={d.id} className="flex items-center justify-between text-xs">
                                  <span className="text-ink/80">{new Date(d.createdAt).toLocaleDateString()} &middot; PKR {d.amount.toLocaleString()}</span>
                                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${s.color}`}>
                                    <s.icon size={11} /> {s.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loading ? (
          <p className="mt-16 text-center text-muted">Loading...</p>
        ) : donations.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-muted">You haven't made any donations yet.</p>
            <a href="/ongoing-projects" className="mt-3 inline-block text-sm font-semibold text-primary">Browse ongoing cases &rarr;</a>
          </div>
        ) : (
          <div className="mt-10 space-y-3">
            {donations.map((d) => {
              const cfg = statusConfig[d.status];
              const Icon = cfg.icon;
              return (
                <div key={d.id} className="rounded-2xl border border-border bg-white p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <a href={d.receiptImage} target="_blank" rel="noopener noreferrer">
                      <img src={d.receiptImage} alt="Your receipt" className="h-14 w-14 rounded-lg object-cover border border-border" />
                    </a>
                    <div>
                      <h3 className="font-display text-lg text-ink">{d.caseTitle}</h3>
                      <p className="text-sm text-muted">
                        PKR {d.amount.toLocaleString()} &middot; {d.method.replace("_", " ")} &middot; {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                      {d.status === "rejected" && d.rejectionReason && (
                        <p className="mt-1 text-sm text-red-600">Reason: {d.rejectionReason}</p>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.color}`}>
                    <Icon size={13} /> {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </PageLayout>
  );
}
