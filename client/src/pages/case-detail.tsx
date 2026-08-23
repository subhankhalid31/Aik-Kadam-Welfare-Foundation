import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { CaseFundingPanel, DonorCount, CaseDetailList, CaseDetailRow } from "@/components/ui/CaseDetailPanels";
import { OngoingCaseCard } from "@/components/ui/OngoingCaseCard";
import { ShareCasePopover } from "@/components/ui/ShareCasePopover";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDialog } from "@/lib/dialog-context";
import {
  MapPin, Clock3, CheckCircle2, UserCheck, ShieldCheck, CalendarDays,
  HandHeart, Heart, ArrowLeft, ArrowRight,
} from "lucide-react";
import charityImg from "@assets/gallery/charitable_work_in_pakistan_background.webp";

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

type SimilarCase = {
  id: string;
  title: string;
  description: string;
  location: string;
  amountNeeded: number;
  amountCollected: number;
  imageUrl: string | null;
  donorCount?: number;
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CaseDetailPage() {
  const { id: caseId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const dialog = useDialog();

  const [data, setData] = useState<{ case: CaseDetail; isAssigned: boolean; pendingRequestType: "assignment" | "removal" | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [similar, setSimilar] = useState<SimilarCase[]>([]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setData(null);
    setMessage("");
    window.scrollTo({ top: 0 });
    api
      .get<{ case: CaseDetail; isAssigned: boolean; pendingRequestType: "assignment" | "removal" | null }>(`/api/cases/${caseId}`)
      .then(setData)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => {
    api
      .get<{ cases: SimilarCase[] }>("/api/cases?status=ongoing")
      .then((d) => setSimilar(d.cases.filter((c) => c.id !== caseId).slice(0, 3)));
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

  // ── Loading state — its own minimal PageLayout so there's no flash of a
  // half-built hero before the case data (and its photo) arrives. ──
  if (loading) {
    return (
      <PageLayout>
        <main className="flex min-h-[70vh] items-center justify-center bg-background">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </main>
      </PageLayout>
    );
  }

  if (notFound || !data) {
    return (
      <PageLayout>
        <main className="mx-auto max-w-lg px-6 pb-24 pt-32 text-center">
          <h1 className="font-display text-2xl text-ink">Case not found</h1>
          <p className="mt-2 text-muted">This case may have been removed, completed, or the link is incorrect.</p>
          <Link href="/ongoing-projects" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">
            <ArrowLeft size={15} /> Back to Ongoing Cases
          </Link>
        </main>
      </PageLayout>
    );
  }

  const c = data.case;
  const images = c.images?.length ? c.images : c.imageUrl ? [c.imageUrl] : [charityImg];
  const donateHref = `/donate?case=${c.id}`;

  return (
    <PageLayout transparentHero navTheme="light">
      {/* Dark hero band — full-bleed and image-backed so the transparent nav
          reads clearly no matter how the two-column layout below is
          arranged (the gallery only covers the left half, so the band is
          what guarantees contrast site-wide, not just over the photo). */}
      <div className="relative overflow-hidden bg-ink">
        <img src={images[0]} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/55" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-10 pt-32 sm:pb-12 sm:pt-36">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }}>
            <Link href="/ongoing-projects" className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-white">
              <ArrowLeft size={14} /> Back to Ongoing Cases
            </Link>
            {c.category && (
              <span className="mt-4 inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                {c.category}
              </span>
            )}
            <h1 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-white sm:text-4xl">{c.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/70">
              <MapPin size={14} /> {c.location}
            </p>
          </motion.div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10">
          {/* ── Left: photo gallery — arrows built into ImageCarousel handle
              the left/right scrolling; this column just anchors it to the
              left side of the page, like a product gallery. ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}>
            <ImageCarousel images={images} alt={c.title} className="h-[300px] w-full rounded-2xl object-cover sm:h-[400px] lg:h-[480px]" />
          </motion.div>

          {/* ── Right: funding, donate/share, meta, volunteer actions ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: "easeOut" }}>
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <CaseFundingPanel collected={c.amountCollected} needed={c.amountNeeded} />

              {c.status === "ongoing" ? (
                <div className="mt-5 flex items-center gap-2.5">
                  <Link
                    href={donateHref}
                    className="glass-surface group/donate inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-green px-5 py-3.5 text-sm font-semibold text-background transition-all duration-150 hover:bg-brand-green-dark hover:shadow-lg active:scale-[0.98]"
                  >
                    <Heart size={16} fill="currentColor" /> Donate to This Case
                    <ArrowRight size={14} className="transition-transform duration-150 group-hover/donate:translate-x-1" />
                  </Link>
                  <ShareCasePopover caseId={c.id} title={c.title} />
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2.5">
                  <span className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-background px-5 py-3.5 text-sm font-semibold text-muted">
                    {c.status === "completed" ? "This case is now complete" : "This case isn't accepting donations"}
                  </span>
                  <ShareCasePopover caseId={c.id} title={c.title} />
                </div>
              )}

              <div className="mt-4 border-t border-border/70 pt-4">
                <DonorCount count={c.donorCount} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Case Details</p>
              <CaseDetailList>
                <CaseDetailRow icon={c.submittedBy.isAdmin ? ShieldCheck : UserCheck} label="Submitted by" value={c.submittedBy.name} />
                <CaseDetailRow icon={ShieldCheck} label="Verified by" value="Aik Kadam" />
                <CaseDetailRow icon={CalendarDays} label="Date submitted" value={formatDate(c.createdAt) ?? "—"} />
                <CaseDetailRow icon={HandHeart} label="Volunteers on this case" value={String(c.volunteerCount)} />
              </CaseDetailList>
            </div>

            {isApprovedVolunteer && c.status === "ongoing" && (
              <div className="mt-6 rounded-2xl border border-border bg-white p-6 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Volunteering</p>
                {data.pendingRequestType ? (
                  <p className="flex items-center gap-2 text-sm text-accent-dark">
                    <Clock3 size={15} />
                    {data.pendingRequestType === "assignment" ? "Join request pending admin review." : "Withdrawal request pending admin review."}
                  </p>
                ) : data.isAssigned ? (
                  <button
                    disabled={actionLoading}
                    onClick={requestWithdraw}
                    className="glass-surface glass-surface-outline w-full rounded-full border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                  >
                    Request Withdrawal
                  </button>
                ) : (
                  <button
                    disabled={actionLoading}
                    onClick={requestJoin}
                    className="glass-surface flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-primary-dark disabled:opacity-60"
                  >
                    <CheckCircle2 size={15} /> Request to Volunteer for This Case
                  </button>
                )}
                {message && <p className="mt-2 text-xs text-muted">{message}</p>}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Full description — its own section below the fold, not
            truncated like the card/modal versions. ── */}
        <motion.div
          className="mt-10 max-w-3xl border-t border-border pt-10 lg:mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="font-display text-xl text-ink sm:text-2xl">About This Case</h2>
          <p className="mt-4 whitespace-pre-wrap text-ink/80 leading-relaxed">{c.description}</p>
        </motion.div>

        {/* ── Similar cases — clicking any of these opens ITS page the same
            way, so from here on it's just page-to-page browsing. ── */}
        {similar.length > 0 && (
          <div className="mt-16 border-t border-border pt-12 sm:mt-20">
            <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.45, ease: "easeOut" }}>
              <h2 className="font-display text-2xl text-ink">Similar Cases</h2>
              <p className="mt-1 text-sm text-muted">Other ongoing cases you might also want to support.</p>
            </motion.div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {similar.map((sc, i) => (
                <motion.div
                  key={sc.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                >
                  <OngoingCaseCard
                    id={sc.id}
                    title={sc.title}
                    image={sc.imageUrl || charityImg}
                    location={sc.location}
                    description={sc.description}
                    collected={sc.amountCollected}
                    goal={sc.amountNeeded}
                    donorCount={sc.donorCount}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageLayout>
  );
}
