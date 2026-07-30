import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";

export function VerificationBanner() {
  return (
    <motion.section
      id="verification"
      className="mt-14 glass-panel rounded-2xl px-6 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center gap-4">
        <motion.div
          className="h-11 w-11 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary"
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <ShieldCheck size={20} />
        </motion.div>
        <div>
          <p className="font-display text-base text-ink">Verified. Trusted. Transparent.</p>
          <p className="text-sm text-muted mt-0.5">
            Every volunteer is verified by our admin team. You can trust the people behind our mission.
          </p>
        </div>
      </div>

      <motion.a
        href="/about"
        className="group/link inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors duration-200 whitespace-nowrap"
        initial={{ opacity: 0, x: 16 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      >
        Learn About Verification
        <ArrowRight size={14} className="transition-transform duration-200 group-hover/link:translate-x-1.5" />
      </motion.a>
    </motion.section>
  );
}
