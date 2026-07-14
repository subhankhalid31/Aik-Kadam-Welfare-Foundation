import { PageLayout } from "@/components/layout/PageLayout";
import { About as AboutSection } from "@/components/sections/About";
import { FAQ } from "@/components/sections/FAQ";

export default function AboutPage() {
  return (
    <PageLayout>
      <main>
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-4">
          <span className="text-xs font-semibold tracking-wide text-primary uppercase">
            About Aik Kadam
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl text-ink">
            Why we started walking.
          </h1>
        </div>
        <AboutSection />
        <FAQ />
      </main>
    </PageLayout>
  );
}
