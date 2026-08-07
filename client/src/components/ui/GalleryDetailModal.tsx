import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { FundingBar, MetaItem, MetaGrid } from "@/components/ui/CaseMeta";
import { api } from "@/lib/api";
import { MapPin, ShieldCheck, UserCheck, CalendarDays, Users, HandHeart, Package, Wallet } from "lucide-react";

type GalleryEventDetail = {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  images: string[];
  families: string | null;
  items: string | null;
  funds: string | null;
  sourceCaseId: string | null;
  createdAt: string;
};

type SourceCase = {
  amountNeeded: number;
  amountCollected: number;
  createdAt: string;
  approvedAt: string | null;
  completedAt: string | null;
  donorCount: number;
  volunteerCount: number;
  submittedBy: { name: string; isAdmin: boolean };
};

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function GalleryDetailModal({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const [data, setData] = useState<{ event: GalleryEventDetail; sourceCase: SourceCase | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ event: GalleryEventDetail; sourceCase: SourceCase | null }>(`/api/gallery/${eventId}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [eventId]);

  return (
    <Modal onBackdropClick={onClose} onClose={onClose}>
      {loading || !data ? (
        <p className="text-muted text-sm py-8 text-center">Loading...</p>
      ) : (
        <div>
          {data.event.images.length > 0 && (
            <div className="-mx-6 -mt-6 mb-5">
              <ImageCarousel images={data.event.images} alt={data.event.title} className="w-full h-56 object-cover" />
            </div>
          )}

          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
            <ShieldCheck size={12} /> Verified Completed
          </span>

          <h2 className="mt-2 font-display text-2xl text-ink leading-tight">{data.event.title}</h2>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={13} /> {data.event.location}
          </p>

          {/* Funding breakdown — only available when this gallery entry
              traces back to a real case (has real financial data). */}
          {data.sourceCase && (
            <div className="mt-5 pt-5 border-t border-border">
              <FundingBar collected={data.sourceCase.amountCollected} needed={data.sourceCase.amountNeeded} />
            </div>
          )}

          <p className="mt-5 text-sm text-ink/80 leading-relaxed">{data.event.description}</p>

          {/* Admin-curated impact figures — distinct from the funding
              numbers above (these are hand-entered highlights like
              "12 families" or "3 tonnes of supplies", not derived from
              payment records), so shown as their own small row rather
              than folded into the meta grid below. */}
          {(data.event.families || data.event.items || data.event.funds) && (
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {data.event.families && (
                <div className="rounded-lg bg-background py-2.5">
                  <Users size={14} className="mx-auto text-primary" />
                  <div className="mt-1 text-xs font-semibold text-ink">{data.event.families}</div>
                </div>
              )}
              {data.event.items && (
                <div className="rounded-lg bg-background py-2.5">
                  <Package size={14} className="mx-auto text-primary" />
                  <div className="mt-1 text-xs font-semibold text-ink">{data.event.items}</div>
                </div>
              )}
              {data.event.funds && (
                <div className="rounded-lg bg-background py-2.5">
                  <Wallet size={14} className="mx-auto text-primary" />
                  <div className="mt-1 text-xs font-semibold text-ink">{data.event.funds}</div>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-border">
            {data.sourceCase ? (
              <MetaGrid>
                <MetaItem
                  icon={data.sourceCase.submittedBy.isAdmin ? ShieldCheck : UserCheck}
                  label="Submitted by"
                  value={data.sourceCase.submittedBy.name}
                />
                <MetaItem icon={ShieldCheck} label="Verified by" value="Aik Kadam" />
                <MetaItem icon={CalendarDays} label="Date started" value={formatDate(data.sourceCase.createdAt) ?? "—"} />
                <MetaItem icon={CalendarDays} label="Date completed" value={formatDate(data.sourceCase.completedAt) ?? formatDate(data.event.createdAt) ?? "—"} />
                <MetaItem icon={Users} label="Total donors" value={String(data.sourceCase.donorCount)} />
                <MetaItem icon={HandHeart} label="Total volunteers" value={String(data.sourceCase.volunteerCount)} />
              </MetaGrid>
            ) : (
              <MetaGrid>
                <MetaItem icon={ShieldCheck} label="Submitted by" value="Aik Kadam" />
                <MetaItem icon={ShieldCheck} label="Verified by" value="Aik Kadam" />
                <MetaItem icon={CalendarDays} label="Date posted" value={formatDate(data.event.createdAt) ?? "—"} />
                <MetaItem icon={CalendarDays} label="Event date" value={data.event.eventDate} />
              </MetaGrid>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
