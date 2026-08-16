import { motion, useReducedMotion, type Variants } from "framer-motion";
import { forwardRef } from "react";

// The previous approach gave every card its own `whileInView`, which means
// every card runs its own IntersectionObserver and its own animation
// instance — with a few dozen cards on screen that's a few dozen observers
// firing in the same scroll frame, which is what caused the stutter.
//
// StaggerGrid/StaggerItem use ONE observer on the parent; children just
// inherit the parent's "hidden"/"show" state through variants, and only
// transform/opacity are animated (both are cheap, GPU-composited
// properties — no layout or paint work).

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const StaggerGrid = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...rest }, ref) => {
    const reduceMotion = useReducedMotion();
    if (reduceMotion) {
      return (
        <div ref={ref} className={className} {...(rest as any)}>
          {children}
        </div>
      );
    }
    return (
      <motion.div
        ref={ref}
        className={className}
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.08, margin: "0px 0px -60px 0px" }}
        {...(rest as any)}
      >
        {children}
      </motion.div>
    );
  },
);
StaggerGrid.displayName = "StaggerGrid";

export function StaggerItem({ className, children }: { className?: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants} style={{ willChange: "transform, opacity" }}>
      {children}
    </motion.div>
  );
}
