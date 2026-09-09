import HeroSection from "@/components/home/HeroSection";
import PopularServices from "@/components/home/PopularServices";
import HowItWorks from "@/components/home/HowItWorks";
import MarketplacePreview from "@/components/home/MarketplacePreview";
import Contractor from "@/components/home/Contractor";
import Footer from "@/components/layout/Footer";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <HeroSection />
      <PopularServices />
      <HowItWorks />
      <MarketplacePreview />
      <Contractor />
      <Footer />
    </>
  );
}
