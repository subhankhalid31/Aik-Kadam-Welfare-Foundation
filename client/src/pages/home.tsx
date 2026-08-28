import { PageLayout } from "@/components/layout/PageLayout";
import { Hero } from "@/components/sections/Hero";
import { Founder } from "@/components/sections/Founder";
import { ImpactStats } from "@/components/sections/ImpactStats";
import { YellowCallout } from "@/components/sections/YellowCallout";
import { FundTransparency } from "@/components/sections/FundTransparency";
import { SuccessStoriesTeaser } from "@/components/sections/SuccessStoriesTeaser";
import { BlogsTeaser } from "@/components/sections/BlogsTeaser";
import { CompletedProjectsTeaser } from "@/components/sections/CompletedProjectsTeaser";
import { VolunteersTeaser } from "@/components/sections/VolunteersTeaser";
import { OngoingTeaser } from "@/components/sections/OngoingTeaser";
import { TopDonorsSection } from "@/components/sections/TopDonorsSection";

export default function Home() {
  return (
    <PageLayout transparentHero>
      <main>
        <Hero />
        <Founder />
        <ImpactStats />
        <YellowCallout />
        <FundTransparency />
        <SuccessStoriesTeaser />
        <BlogsTeaser />
        <CompletedProjectsTeaser />
        <VolunteersTeaser />
        <OngoingTeaser />
        <TopDonorsSection />
      </main>
    </PageLayout>
  );
}
