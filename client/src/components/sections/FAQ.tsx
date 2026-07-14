import { useState } from "react";
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
    <section id="faq" className="py-24 bg-white border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
          FAQ
        </span>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl text-ink">
          Questions, answered.
        </h2>

        <div className="mt-10 divide-y divide-border border-t border-b border-border">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={faq.q}>
                <button
                  className="w-full flex items-center justify-between gap-4 py-5 text-left"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-display text-lg text-ink">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-primary transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ${
                    isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
                  }`}
                  style={{ display: "grid" }}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
