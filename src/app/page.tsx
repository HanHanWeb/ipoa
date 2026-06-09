import { NavBar } from "@/components/nav-bar";
import { HeroSection } from "@/components/hero-section";
import { StatsSection } from "@/components/stats-section";
import { AwardsSection } from "@/components/awards-section";
import { JudgesSection } from "@/components/judges-section";
import { QASection } from "@/components/qa-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <HeroSection />
      <StatsSection />
      <AwardsSection />
      <JudgesSection />
      <QASection />
      <Footer />
    </main>
  );
}
