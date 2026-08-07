import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { FundingBar, MetaItem, MetaGrid } from "@/components/ui/CaseMeta";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";
import { MapPin, Clock3, CheckCircle2, UserCheck, ShieldCheck, CalendarDays, Users, HandHeart } from "lucide-react";

type CaseDetail = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string | null;
  status: string;
  amountNeeded: number;
  amountCollected: number;
  imageUrl: string | null;
  images?: string[];
  createdAt: string;
  approvedAt: string | null;
  donorCount: number;
  volunteerCount: number;
  submittedBy: { name: string; isAdmin: boolean };
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CaseDetailModal({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const { user } = useAuth();
  const dialog = useDialog();
  const [data, setData] = useState<{ case: CaseDetail; isAssigned: boolean; pendingRequestType: "assignment" | "removal" | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get<{ case: CaseDetail; isAssigned: boolean; pendingRequestType: "assignment" | "removal" | null }>(`/api/cases/${caseId}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [caseId]);

  const isApprovedVolunteer = user?.volunteerStatus === "approved";

  async function requestJoin() {
    setActionLoading(true);
    setMessage("");
    try {
      await api.post(`/api/cases/${caseId}/request-join`);
      setMessage("Request sent to admin for review.");
      setData((d) => (d ? { ...d, pendingRequestType: "assignment" } : d));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  async function requestWithdraw() {
    const reason = await dialog.prompt("Why can't you continue on this case? (optional)", "Request withdrawal");
    if (reason === null) return;
    setActionLoading(true);
    setMessage("");
    try {
      await api.post(`/api/cases/${caseId}/request-withdraw`, { reason: reason || undefined });
      setMessage("Request sent to admin for review.");
      setData((d) => (d ? { ...d, pendingRequestType: "removal" } : d));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Modal onBackdropClick={onClose} onClose={onClose}>
      {loading || !data ? (
        <p className="text-muted text-sm py-8 text-center">Loading...</p>
      ) : (
        <div>
          {((data.case.images && data.case.images.length > 0) || data.case.imageUrl) && (
            <div className="-mx-6 -mt-6 mb-5">
              <ImageCarousel
                images={data.case.images?.length ? data.case.images : [data.case.imageUrl!]}
                alt={data.case.title}
                className="w-full h-56 object-cover"
              />
            </div>
          )}

          {data.case.category && (
            <span className="inline-block text-[11px] font-semibold rounded-full bg-emerald-50 text-primary px-2.5 py-1 mb-2">
              {data.case.category}
            </span>
          )}
          <h2 className="font-display text-2xl text-ink leading-tight">{data.case.title}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted"><MapPin size={13} /> {data.case.location}</p>

          <div className="mt-5 pt-5 border-t border-border">
            <FundingBar collected={data.case.amountCollected} needed={data.case.amountNeeded} />
          </div>

          <p className="mt-5 text-sm text-ink/80 leading-relaxed">{data.case.description}</p>

          <div className="mt-5 pt-5 border-t border-border">
            <MetaGrid>
              <MetaItem
                icon={data.case.submittedBy.isAdmin ? ShieldCheck : UserCheck}
                label="Submitted by"
                value={data.case.submittedBy.name}
              />
              <MetaItem icon={ShieldCheck} label="Verified by" value="Aik Kadam" />
              <MetaItem icon={CalendarDays} label="Date submitted" value={formatDate(data.case.createdAt) ?? "—"} />
              <MetaItem icon={Users} label="Donors so far" value={String(data.case.donorCount)} />
              <MetaItem icon={HandHeart} label="Volunteers on this case" value={String(data.case.volunteerCount)} />
            </MetaGrid>
          </div>

          {isApprovedVolunteer && data.case.status === "ongoing" && (
            <div className="mt-5 pt-5 border-t border-border">
              {data.pendingRequestType ? (
                <p className="flex items-center gap-2 text-sm text-accent-dark">
                  <Clock3 size={15} /> {data.pendingRequestType === "assignment" ? "Join request pending admin review." : "Withdrawal request pending admin review."}
                </p>
              ) : data.isAssigned ? (
                <button
                  disabled={actionLoading}
                  onClick={requestWithdraw}
                  className="glass-surface glass-surface-outline w-full rounded-full border border-red-200 text-red-600 px-5 py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-60"
                >
                  Request Withdrawal
                </button>
              ) : (
                <button
                  disabled={actionLoading}
                  onClick={requestJoin}
                  className="glass-surface w-full rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} /> Request to Volunteer for This Case
                </button>
              )}
              {message && <p className="mt-2 text-xs text-muted">{message}</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
