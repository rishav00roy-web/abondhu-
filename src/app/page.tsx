import { MotionConfig } from "framer-motion";
import { BookingBar } from "@/components/BookingBar";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { RateBoard } from "@/components/RateBoard";
import { SecondLife } from "@/components/SecondLife";
import { Closing, Estates, Faq, Footer, HowItWorks, TrustStrip } from "@/components/Sections";

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
