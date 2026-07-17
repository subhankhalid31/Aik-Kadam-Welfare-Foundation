import { Users, Heart, ShieldCheck, HandHeart } from "lucide-react";
import { motion } from "framer-motion";
import { CountUpStat } from "@/components/ui/CountUpStat";

export function OngoingStatsBar({ activeCases }: { activeCases: number }) {
  const stats = [
    { icon: Users, value: "128+", label: "Families Helped", sub: "In the last 12 months" },
    // Live: reflects the actual number of ongoing cases right now, no manual update needed.
    { icon: Heart, value: `${activeCases}`, label: "Active Cases", sub: "Under process" },
    { icon: ShieldCheck, value: "100%", label: "Verified Cases", sub: "Transparency is our promise" },
    { icon: HandHeart, value: "2M+", label: "Lives Impacted", sub: "Since our beginning" },
  ];

  return (
    <motion.div
      className="mt-10 rounded-2xl border border-border bg-white px-6 sm:px-10 py-7 grid grid-cols-2 sm:grid-cols-4 gap-y-7"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {stats.map((s, i) => (
        <div key={s.label} className={`flex items-center gap-3.5 ${i > 0 ? "sm:border-l sm:border-border sm:pl-8" : ""}`}>
          <motion.div
            className="h-11 w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary"
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
          >
            <s.icon size={19} />
          </motion.div>
          <div>
            <CountUpStat value={s.value} className="font-display text-2xl text-ink" />
            <div className="text-xs font-medium text-ink/80">{s.label}</div>
            <div className="text-[11px] text-muted">{s.sub}</div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
