import { useState } from "react";
import { Check } from "lucide-react";
import { fundDistribution } from "@/lib/dummy-data";

const R = 70;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function FundTransparency() {
  const [active, setActive] = useState(0);

  let offset = 0;
  const segments = fundDistribution.map((d, i) => {
    const dash = (d.value / 100) * CIRCUMFERENCE;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  const activeSegment = fundDistribution[active];

  return (
    <section className="py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            100% Transparency
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ink leading-tight">
            Every rupee is tracked and visible.
          </h2>
          <p className="mt-4 text-muted leading-relaxed max-w-md">
            We believe you have the right to know exactly where your money
            goes. That's why we maintain an open ledger policy.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              "85% of funds go directly to beneficiaries (industry leading)",
              "Verified proofs of delivery uploaded within 48 hours",
              "Zero hidden platform fees for donors",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check size={12} className="text-primary-dark" />
                </span>
                <span className="text-sm text-ink/80">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-white p-8">
          <h3 className="font-display text-lg text-ink">Fund Distribution</h3>

          <div className="mt-6 flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
              <circle cx="110" cy="110" r={R} fill="none" stroke="#E7E7E4" strokeWidth="26" />
              {segments.map((seg, i) => (
                <circle
                  key={seg.label}
                  cx="110"
                  cy="110"
                  r={R}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={active === i ? 30 : 26}
                  strokeDasharray={`${seg.dash} ${CIRCUMFERENCE - seg.dash}`}
                  strokeDashoffset={-seg.offset}
                  strokeLinecap="butt"
                  onMouseEnter={() => setActive(i)}
                  className="cursor-pointer transition-all duration-200"
                  style={{ opacity: active === i ? 1 : 0.85 }}
                />
              ))}
              <text
                x="110"
                y="104"
                textAnchor="middle"
                className="rotate-90"
                style={{ transform: "rotate(90deg)", transformOrigin: "110px 110px" }}
                fontSize="34"
                fontWeight="700"
                fill={activeSegment.color}
                fontFamily="'JetBrains Mono', monospace"
              >
                {activeSegment.value}%
              </text>
              <text
                x="110"
                y="128"
                textAnchor="middle"
                style={{ transform: "rotate(90deg)", transformOrigin: "110px 110px" }}
                fontSize="11"
                fill="#6B7280"
                fontFamily="'Niveau Grotesk', sans-serif"
                letterSpacing="0.05em"
              >
                {activeSegment.label.toUpperCase()}
              </text>
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-5 flex-wrap">
            {fundDistribution.map((d, i) => (
              <button
                key={d.label}
                onMouseEnter={() => setActive(i)}
                onClick={() => setActive(i)}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: d.color }}
                />
                <span className={active === i ? "text-ink font-medium" : "text-muted"}>
                  {d.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
