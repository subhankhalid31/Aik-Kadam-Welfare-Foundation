import { Users, Heart, HandHeart, GraduationCap } from "lucide-react";
import { impactStats } from "@/lib/dummy-data";
import { CountUpStat } from "@/components/ui/CountUpStat";

const icons = { users: Users, heart: Heart, hand: HandHeart, cap: GraduationCap };

export function ImpactStats() {
  return (
    <section className="bg-primary">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
        {impactStats.map((stat) => {
          const Icon = icons[stat.icon as keyof typeof icons];
          return (
            <div key={stat.label} className="text-center md:text-left group cursor-default">
              <div className="mx-auto md:mx-0 h-11 w-11 rounded-xl bg-background/15 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:bg-background/25">
                <Icon size={20} className="text-background" />
              </div>
              <CountUpStat value={stat.value} className="mt-3 font-display text-3xl text-background" />
              <div className="mt-1 text-sm text-background/70">{stat.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
