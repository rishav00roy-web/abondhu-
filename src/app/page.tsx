import { MotionConfig } from "framer-motion";
import { BookingBar } from "@/components/site/BookingBar";
import { Hero } from "@/components/site/Hero";
import { Nav } from "@/components/site/Nav";
import { RateBoard } from "@/components/site/RateBoard";
import { SecondLife } from "@/components/site/SecondLife";
import { Closing, Estates, Faq, Footer, HowItWorks, TrustStrip } from "@/components/site/Sections";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main id="top">
        <Hero />
        <TrustStrip />
        <BookingBar />
        <RateBoard />
        <HowItWorks />
        <SecondLife />
        <Estates />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </MotionConfig>
  );
}
