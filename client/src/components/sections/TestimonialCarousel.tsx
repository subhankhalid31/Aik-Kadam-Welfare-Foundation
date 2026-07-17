import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";

export function TestimonialCarousel({ quotes }: { quotes: { quote: string; name: string }[] }) {
  const [index, setIndex] = useState(0);
  if (quotes.length === 0) return null;

  function prev() {
    setIndex((i) => (i - 1 + quotes.length) % quotes.length);
  }
  function next() {
    setIndex((i) => (i + 1) % quotes.length);
  }

  const current = quotes[index];

  return (
    <motion.section
      className="mt-14 rounded-2xl bg-primary/5 border border-primary/10 px-8 sm:px-12 py-8 flex items-center gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {quotes.length > 1 && (
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="shrink-0 h-9 w-9 rounded-full bg-white border border-border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
        >
          <ChevronLeft size={16} className="text-ink" />
        </button>
      )}

      <div className="flex-1 min-w-0 flex items-start gap-3">
        <Quote size={22} className="shrink-0 text-primary/50 mt-1" />
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <p className="font-display text-base sm:text-lg text-ink leading-relaxed">"{current.quote}"</p>
            <p className="mt-2 text-sm font-medium text-primary">— {current.name}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {quotes.length > 1 && (
        <button
          onClick={next}
          aria-label="Next testimonial"
          className="shrink-0 h-9 w-9 rounded-full bg-white border border-border flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
        >
          <ChevronRight size={16} className="text-ink" />
        </button>
      )}
    </motion.section>
  );
}
