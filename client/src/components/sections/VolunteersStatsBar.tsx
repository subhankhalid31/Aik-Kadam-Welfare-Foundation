import { Users, Clock, Briefcase, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpStat } from "@/components/ui/CountUpStat";

export function VolunteersStatsBar({ verifiedVolunteers, hoursServed, projectsSupported }: {
  verifiedVolunteers: number;
  hoursServed: number;
  projectsSupported: number;
}) {
  const stats = [
    { icon: Users, value: `${verifiedVolunteers}`, label: "Verified Volunteers", sub: "Across Pakistan" },
    { icon: Clock, value: `${hoursServed.toLocaleString()}+`, label: "Hours Served", sub: "For communities in need" },
    { icon: Briefcase, value: `${projectsSupported}`, label: "Projects Supported", sub: "Across multiple cities" },
    { icon: ShieldCheck, value: "100%", label: "Identity Verified", sub: "By our admin team" },
  ];

  return (
    <motion.div
      className="mt-10 rounded-2xl border border-border bg-white px-6 sm:px-10 py-7 grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-7"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-center gap-2.5 sm:gap-3.5 min-w-0 ${i > 0 ? "sm:border-l sm:border-border sm:pl-8" : ""}`}>
          <motion.div
            className="h-9 w-9 sm:h-11 sm:w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1, ease: "easeOut" }}
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
