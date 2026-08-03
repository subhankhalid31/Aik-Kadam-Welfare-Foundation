import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { fundDistribution } from "@/lib/dummy-data";

const R = 70;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function FundTransparency() {
  const [active, setActive] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Auto-rotate through segments every 4 seconds
  useEffect(() => {
    if (isHovering) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % fundDistribution.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovering]);

  let offset = 0;
  const segments = fundDistribution.map((d, i) => {
    const dash = (d.value / 100) * CIRCUMFERENCE;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  const activeSegment = fundDistribution[active];

  return (
    <section className="relative py-24 bg-background">
      {/* Bottom curve for smooth transition to next section */}
      <svg className="absolute bottom-0 left-0 w-full h-20 text-white" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,40 C360,100 1080,100 1440,40 L1440,100 L0,100 Z" fill="currentColor" />
      </svg>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <span className="text-xs font-semibold tracking-wide text-brand-green uppercase">
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
            ].map((point, i) => (
              <motion.li
                key={point}
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.15 }}
              >
                <motion.span
                  className="mt-0.5 h-5 w-5 shrink-0 rounded-full flex items-center justify-center"
                  initial={{ backgroundColor: "rgba(10,12,16,0.06)" }}
                  whileInView={{ backgroundColor: "rgba(112,152,40,0.12)" }}
                  viewport={{ once: true, amount: 0.8 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.15 + 0.15 }}
                >
                  <motion.span
                    initial={{ color: "rgba(10,12,16,0.35)" }}
                    whileInView={{ color: "#465F19" }}
                    viewport={{ once: true, amount: 0.8 }}
                    transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.15 + 0.15 }}
                  >
                    <Check size={12} />
                  </motion.span>
                </motion.span>
                <span className="text-sm text-ink/80">{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-white p-8">
          <h3 className="font-display text-lg text-ink">Fund Distribution</h3>

          <div className="mt-6 flex items-center justify-center">
            <svg width="220" height="220" viewBox="0 0 220 220" className="rotate-0">
              <circle cx="110" cy="110" r={R} fill="none" stroke="#E7E7E4" strokeWidth="26" />
              {segments.map((seg, i) => (
                <motion.circle
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
                  onMouseEnter={() => { setActive(i); setIsHovering(true); }}
                  onMouseLeave={() => setIsHovering(false)}
                  className="cursor-pointer transition-all duration-200"
                  style={{ opacity: active === i ? 1 : 0.85 }}
                  initial={{ strokeDashoffset: CIRCUMFERENCE }}
                  whileInView={{ strokeDashoffset: -seg.offset }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1, ease: "easeOut", delay: i * 0.2 }}
                />
              ))}
              <motion.text
                x="110"
                y="120"
                textAnchor="middle"
                fontSize="34"
                fontWeight="700"
                fill={activeSegment.color}
                fontFamily="serif"
                key={activeSegment.value}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeSegment.value}%
              </motion.text>
              <motion.text
                x="110"
                y="128"
                textAnchor="middle"
                fontSize="11"
                fill="#6B7280"
                fontFamily="serif"
                letterSpacing="0.05em"
                key={activeSegment.label}
                initial={{ y: 128 + 5, opacity: 0 }}
                animate={{ y: 128, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {activeSegment.label.toUpperCase()}
              </motion.text>
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-center gap-5 flex-wrap">
            {fundDistribution.map((d, i) => (
              <button
                key={d.label}
                onMouseEnter={() => { setActive(i); setIsHovering(true); }}
                onMouseLeave={() => setIsHovering(false)}
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
