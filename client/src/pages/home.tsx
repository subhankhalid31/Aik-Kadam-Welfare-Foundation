import { PageLayout } from "@/components/layout/PageLayout";
import { Hero } from "@/components/sections/Hero";
import { Founder } from "@/components/sections/Founder";
import { ImpactStats } from "@/components/sections/ImpactStats";
import { YellowCallout } from "@/components/sections/YellowCallout";
import { FundTransparency } from "@/components/sections/FundTransparency";
import { SuccessStoriesTeaser } from "@/components/sections/SuccessStoriesTeaser";
import { CompletedProjectsTeaser } from "@/components/sections/CompletedProjectsTeaser";
import { VolunteersTeaser } from "@/components/sections/VolunteersTeaser";
import { OngoingTeaser } from "@/components/sections/OngoingTeaser";

export default function Home() {
  return (
    <PageLayout>
      <main>
        <Hero />
        <Founder />
        <ImpactStats />
        <YellowCallout />
        <FundTransparency />
        <SuccessStoriesTeaser />
        <CompletedProjectsTeaser />
        <VolunteersTeaser />
        <OngoingTeaser />
      </main>
    </PageLayout>
  );
}
