import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { UserRound, ClipboardCheck, HeartHandshake, Truck, FileText, type LucideIcon } from "lucide-react";

type Step = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    icon: UserRound,
    title: "Someone asks for help.",
    description:
      "A person or family reaches out to us with their request for support through our platform or volunteers.",
  },
  {
    icon: ClipboardCheck,
    title: "Every case is verified.",
    description:
      "Our volunteers visit, verify the need and complete a thorough assessment to ensure authenticity.",
  },
  {
    icon: HeartHandshake,
    title: "Donors make it possible.",
    description:
      "Verified cases are shared with our donors who choose to fund the cause with trust and transparency.",
  },
  {
    icon: Truck,
    title: "Aid is delivered.",
    description:
      "We deliver the promised support directly to the family and ensure it reaches those who truly need it.",
  },
  {
    icon: FileText,
    title: "Every donation becomes a story.",
    description:
      "We document the impact and share the success story so donors can see the change they made possible.",
  },
];

export function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = stepRefs.current.findIndex((el) => el === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      // A thin trigger band sitting at ~55-60% of the viewport height.
      { rootMargin: "-55% 0px -40% 0px", threshold: 0 }
    );

    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="relative py-24 bg-background">
      {/* Top curve for smooth transition from About section */}
      <svg className="absolute top-0 left-0 w-full h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill="currentColor" />
      </svg>

      {/* Bottom curve for smooth transition to FAQ section */}
      <svg className="absolute bottom-0 left-0 w-full h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,40 C360,100 1080,100 1440,40 L1440,100 L0,100 Z" fill="currentColor" />
      </svg>

      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">How It Works</span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl leading-tight text-ink">
            From a call for help to a <span className="italic text-primary">story of change.</span>
          </h2>
        </motion.div>

        <div className="relative mt-16">
          {/* Track (upcoming steps) */}
          <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" aria-hidden />
          {/* Progress line (completed / active steps) — grows smoothly with scroll */}
          <motion.div
            className="absolute left-[27px] top-2 w-px bg-primary origin-top"
            initial={{ height: "0%" }}
            animate={{ height: `calc((100% - 1rem) * ${activeIndex / (steps.length - 1)})` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            aria-hidden
          />

          <ol className="space-y-12">
            {steps.map((step, i) => {
              const isActive = i === activeIndex;
              const isDone = i < activeIndex;
              const Icon = step.icon;
              return (
                <li
                  key={step.title}
                  ref={(el) => (stepRefs.current[i] = el)}
                  className="group relative flex gap-5 cursor-default"
                >
                  {/* Step circle */}
                  <div className="relative shrink-0">
                    <motion.span
                      className="relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-xs font-mono font-semibold"
                      animate={{
                        scale: isActive ? [0.85, 1.15, 1] : 1,
                        backgroundColor: isActive || isDone ? "#709828" : "#FFFFFF",
                        borderColor: "#709828",
                        color: isActive || isDone ? "#FFFFFF" : "#709828",
                        boxShadow: isActive ? "0 0 0 8px rgba(112,152,40,0.15)" : "0 0 0 0px rgba(112,152,40,0)",
                      }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      {i + 1}
                    </motion.span>
                  </div>

                  {/* Icon chip */}
                  <motion.div
                    className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary transition-transform duration-250 group-hover:scale-[1.08] group-hover:rotate-[5deg]"
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0.55,
                      scale: isActive ? 1 : 0.92,
                      y: isActive ? 0 : 4,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <Icon size={20} />
                  </motion.div>

                  {/* Text */}
                  <motion.div
                    className="min-w-0 transition-transform duration-250 group-hover:translate-x-1"
                    animate={{ opacity: isActive ? 1 : 0.55 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <motion.h3
                      className={`font-display text-lg sm:text-xl transition-colors duration-300 ${
                        isActive ? "text-primary" : "text-ink group-hover:text-primary"
                      }`}
                      animate={{
                        y: isActive ? 0 : 6,
                        filter: isActive ? "blur(0px)" : "blur(1.5px)",
                      }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {step.title}
                    </motion.h3>
                    <motion.p
                      className="mt-1.5 text-sm text-muted leading-relaxed max-w-md group-hover:text-ink/80 transition-colors duration-250"
                      animate={{ opacity: isActive ? 1 : 0.7, y: isActive ? 0 : 4 }}
                      transition={{ duration: 0.45, ease: "easeOut", delay: isActive ? 0.1 : 0 }}
                    >
                      {step.description}
                    </motion.p>
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
