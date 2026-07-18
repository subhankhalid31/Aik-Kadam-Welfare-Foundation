import { Modal } from "@/components/ui/Modal";
import { ShieldCheck, Calendar, Quote } from "lucide-react";

export type SuccessStoryDetail = {
  title: string;
  date: string;
  quote: string;
  name: string;
  before: string;
  after: string;
};

export function SuccessStoryDetailModal({ story, onClose }: { story: SuccessStoryDetail; onClose: () => void }) {
  return (
    <Modal onBackdropClick={onClose} onClose={onClose}>
      <div className="max-w-md">
        <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden">
          <div className="relative">
            <img src={story.before} alt={`${story.title}, before`} className="w-full h-32 object-cover" />
            <span className="absolute top-2 left-2 rounded-full bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 uppercase">
              Before
            </span>
          </div>
          <div className="relative">
            <img src={story.after} alt={`${story.title}, after`} className="w-full h-32 object-cover" />
            <span className="absolute top-2 right-2 rounded-full bg-primary text-white text-[10px] font-semibold px-2 py-0.5 uppercase">
              After
            </span>
          </div>
        </div>

        <span className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1">
          <ShieldCheck size={12} /> Verified Story
        </span>

        <h2 className="mt-2 font-display text-2xl text-ink">{story.title}</h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={13} /> Completed {story.date}
        </p>

        <div className="mt-4 relative rounded-xl bg-background p-4">
          <Quote size={20} className="text-primary/25" />
          <p className="mt-1 text-sm italic text-ink/80 leading-relaxed">"{story.quote}"</p>
          <p className="mt-2 text-xs font-semibold text-primary">— {story.name}</p>
        </div>
      </div>
    </Modal>
  );
}
