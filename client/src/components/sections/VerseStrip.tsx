import { Quote } from "lucide-react";
import { motion } from "framer-motion";

export function VerseStrip({
  verse = "And whoever saves one life, it is as if he had saved all of mankind.",
  reference = "Quran 5:32",
}: {
  verse?: string;
  reference?: string;
}) {
  return (
    <motion.section
      className="mt-14"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="rounded-2xl bg-primary/5 border border-primary/10 px-8 py-10 text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
        >
          <Quote size={22} className="mx-auto text-primary/50" />
        </motion.div>
        <p className="mt-3 font-display text-lg sm:text-xl text-ink max-w-2xl mx-auto leading-relaxed">
          "{verse}"
        </p>
        <p className="mt-2 text-sm font-medium text-primary">— {reference}</p>
      </div>
    </motion.section>
  );
}
