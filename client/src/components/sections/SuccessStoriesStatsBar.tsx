import { BookOpen, CheckCircle2, Users, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpStat } from "@/components/ui/CountUpStat";

export function SuccessStoriesStatsBar({ storiesPublished, completedProjects }: {
  storiesPublished: number;
  completedProjects: number;
}) {
  const stats = [
    { icon: BookOpen, value: `${storiesPublished}+`, label: "Stories Published", sub: "Verified and shared" },
    { icon: CheckCircle2, value: `${completedProjects}`, label: "Completed Projects", sub: "Making a difference" },
    { icon: Users, value: "3,250+", label: "Lives Impacted", sub: "Across Pakistan" },
    { icon: ShieldCheck, value: "100%", label: "Verified Stories", sub: "Transparency guaranteed" },
  ];

  return (
    <motion.div
      className="mt-10 rounded-2xl border border-border bg-white px-6 sm:px-10 py-7 grid grid-cols-2 sm:grid-cols-4 gap-y-7"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-center gap-3.5 ${i > 0 ? "sm:border-l sm:border-border sm:pl-8" : ""}`}>
          <motion.div
            className="h-11 w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.45 + i * 0.1, ease: "easeOut" }}
          >
            <s.icon size={19} />
          </motion.div>
          <div>
            <CountUpStat value={s.value} durationMs={1800} className="font-display text-2xl text-ink" />
            <div className="text-xs font-medium text-ink/80">{s.label}</div>
            <div className="text-[11px] text-muted">{s.sub}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
