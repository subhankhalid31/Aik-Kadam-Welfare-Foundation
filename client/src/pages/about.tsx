import { motion } from "framer-motion";
import { PageLayout } from "@/components/layout/PageLayout";
import { About as AboutSection } from "@/components/sections/About";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FAQ } from "@/components/sections/FAQ";

export default function AboutPage() {
  return (
    <PageLayout>
      <main>
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-4">
          <motion.span
            className="inline-block text-xs font-semibold tracking-wide text-primary uppercase"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            About Aik Kadam
          </motion.span>
          <motion.h1
            className="mt-3 font-display text-4xl sm:text-5xl text-ink"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            Why we started walking.
          </motion.h1>
        </div>
        <AboutSection />
        <HowItWorks />
        <FAQ />
      </main>
    </PageLayout>
  );
}
