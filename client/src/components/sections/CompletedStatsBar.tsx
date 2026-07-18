import { ClipboardCheck, Users, Wallet, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpStat } from "@/components/ui/CountUpStat";

export function CompletedStatsBar({ projectsCompleted, familiesHelped, fundsDistributed }: {
  projectsCompleted: number;
  familiesHelped: number;
  fundsDistributed: number;
}) {
  const fundsLabel =
    fundsDistributed >= 1_000_000
      ? `₨${(fundsDistributed / 1_000_000).toFixed(1)}M+`
      : `₨${fundsDistributed.toLocaleString()}`;

  const stats = [
    { icon: ClipboardCheck, value: `${projectsCompleted}+`, label: "Projects Completed", sub: "Verified by our team" },
    { icon: Users, value: `${familiesHelped}+`, label: "Families Helped", sub: "Across Pakistan" },
    { icon: Wallet, value: fundsLabel, label: "Funds Distributed", sub: "Fully documented" },
    { icon: ShieldCheck, value: "100%", label: "Verified Cases", sub: "Transparency guaranteed" },
  ];

  return (
    <motion.div
      className="mt-10 rounded-2xl border border-border bg-white px-6 sm:px-10 py-7 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-7"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: 0.32, ease: "easeOut" }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-center gap-2.5 sm:gap-3.5 min-w-0 ${i > 0 ? "sm:border-l sm:border-border sm:pl-8" : ""}`}>
          <motion.div
            className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.08, ease: "easeOut" }}
          >
            <s.icon size={16} className="sm:hidden" />
            <s.icon size={19} className="hidden sm:block" />
          </motion.div>
          <div className="min-w-0">
            <CountUpStat value={s.value} durationMs={900} className="font-display text-base sm:text-2xl text-ink" />
            <div className="text-xs font-medium text-ink/80">{s.label}</div>
            <div className="text-[11px] text-muted">{s.sub}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
