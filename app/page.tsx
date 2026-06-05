import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/home/HeroSection";
import PopularServices from "@/components/home/PopularServices";
import HowItWorks from "@/components/home/HowItWorks";
import OtherServices from "@/components/home/OtherServices";
import Contractor from "@/components/home/Contractor";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <PopularServices />
      <HowItWorks />
      <OtherServices />
      <Contractor />
      <Footer />
    </>
  );
}