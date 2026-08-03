import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How do I know my donation actually reaches someone?",
    a: "Every project shows funds collected vs. funds spent, and completed projects move to our Achievements gallery with the exact amount used and the volunteer who verified it in person.",
  },
  {
    q: "How can I become a verified volunteer?",
    a: "Sign up and apply through the Volunteers page. An admin reviews your application, and once approved you get a verifiable badge ID you can list on your resume or CV.",
  },
  {
    q: "What payment methods are supported?",
    a: "JazzCash, Easypaisa, and direct bank transfer are currently supported, with card payments coming soon.",
  },
  {
    q: "Can I request help for someone in need?",
    a: "Yes, any registered user can post a case. Our admin team verifies the details before it becomes an active fundraising project.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 bg-beige">
      {/* Top curve for smooth transition from HowItWorks section */}
      <svg className="absolute top-0 left-0 w-full h-20 text-background" viewBox="0 0 1440 100" fill="none" preserveAspectRatio="none">
        <path d="M0,60 C360,0 1080,0 1440,60 L1440,0 L0,0 Z" fill="currentColor" />
      </svg>

      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            FAQ
          </span>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ink">
            Questions, answered.
          </h2>
        </motion.div>

        <motion.div
          className="mt-10 divide-y divide-border border-t border-b border-border"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        >
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 + i * 0.15 }}
              >
                <motion.button
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.span
                    className="font-display text-lg text-ink"
                    animate={{ color: isOpen ? "#709828" : "#0A0C10" }}
                    transition={{ duration: 0.3 }}
                  >
                    {faq.q}
                  </motion.span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <ChevronDown
                      size={20}
                      className="shrink-0 text-primary"
                    />
                  </motion.div>
                </motion.button>
                <motion.div
                  className={`grid transition-all duration-200 ${
                    isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                  }`}
                  style={{ display: "grid" }}
                  initial={false}
                  animate={{ opacity: isOpen ? 1 : 0.6 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
