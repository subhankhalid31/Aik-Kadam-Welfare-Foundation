import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ImageCarousel } from "@/components/ui/ImageCarousel";
import { api } from "@/lib/api";
import { MapPin, Calendar, ShieldCheck, Users, Package, Wallet, CheckCircle2 } from "lucide-react";

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
        <div className="max-w-md">
          {data.event.images.length > 0 && (
            <div className="mb-4">
              <ImageCarousel images={data.event.images} alt={data.event.title} />
            </div>
          )}

          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
            <ShieldCheck size={12} /> Verified Completed
          </span>

          <h2 className="mt-2 font-display text-2xl text-ink">{data.event.title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={13} /> {data.event.location}
          </p>
          <p className="mt-3 text-sm text-ink/80 leading-relaxed">{data.event.description}</p>

          {/* Admin-curated impact figures */}
          {(data.event.families || data.event.items || data.event.funds) && (
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
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

          {/* Funds needed vs received — from the original case submission, if this project came from one */}
          {data.sourceCase && (
            <div className="mt-5 pt-4 border-t border-border">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Funding</p>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-ink/70">Requested by submitter</span>
                <span className="font-mono font-semibold text-ink">PKR {data.sourceCase.amountNeeded.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-ink/70">Actually received</span>
                <span className="font-mono font-semibold text-primary">PKR {data.sourceCase.amountCollected.toLocaleString()}</span>
              </div>

              <p className="mt-4 text-xs font-semibold text-muted uppercase tracking-wide">Timeline</p>
              <div className="mt-2 space-y-1.5 text-sm text-ink/80">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-muted shrink-0" />
                  Submitted {formatDate(data.sourceCase.createdAt)}
                </div>
                {data.sourceCase.approvedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-muted shrink-0" />
                    Approved {formatDate(data.sourceCase.approvedAt)}
                  </div>
                )}
                {data.sourceCase.completedAt && (
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={13} className="text-muted shrink-0" />
                    Completed {formatDate(data.sourceCase.completedAt)}
                  </div>
                )}
              </div>
            </div>
          )}

          {!data.sourceCase && (
            <p className="mt-4 pt-4 border-t border-border text-xs text-muted">
              Posted by our team on {formatDate(data.event.createdAt)} — {data.event.eventDate}.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
