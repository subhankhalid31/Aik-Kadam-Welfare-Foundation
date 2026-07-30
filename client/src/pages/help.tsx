import { PageLayout } from "@/components/layout/PageLayout";
import { Mail, MessageCircle } from "lucide-react";

const FAQS = [
  { q: "How do I know my donation went where I intended?", a: "Every donation is tied to a specific case, and you can see its full status on your My Donations page, pending, confirmed, or (rarely) rejected with a reason." },
  { q: "How do I become a volunteer?", a: "Sign up, then apply from the Volunteers page. An admin reviews your application and issues a Badge ID once approved." },
  { q: "How do I get my Volunteer Service Certificate?", a: "Certificates unlock once you've logged 30 verified volunteer hours. Download it any time after that from your Account page." },
  { q: "I need to correct my name, how?", a: "Names can't be edited directly to protect record integrity. Submit a request from Settings, and an admin will verify and update it." },
  { q: "How do I submit a case for someone in need?", a: "Go to Ongoing Projects → Submit a Case. You can submit up to 2 cases per day." },
];

export default function HelpPage() {
  return (
    <PageLayout>
      <main className="max-w-2xl mx-auto px-6 pt-16 pb-24">
        <span className="text-xs font-semibold tracking-wide text-primary uppercase">Help &amp; Support</span>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl text-ink">We're here to help.</h1>

        <div className="mt-8 space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-2xl border border-border bg-white p-5">
              <h3 className="font-display text-lg text-ink">{f.q}</h3>
              <p className="mt-1.5 text-sm text-muted leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-white p-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-primary" />
            <span className="text-sm text-ink/80">Still need help? Reach out directly.</span>
          </div>
          <a href="/contact" className="glass-surface inline-flex items-center gap-1.5 rounded-full bg-primary/65 px-5 py-2.5 text-sm font-semibold text-background hover:bg-primary-dark transition-colors">
            <Mail size={15} /> Contact Us
          </a>
        </div>
      </main>
    </PageLayout>
  );
}
