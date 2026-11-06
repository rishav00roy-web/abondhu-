import { MotionConfig } from "framer-motion";
import { BookingBar } from "@/components/BookingBar";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { RateBoard } from "@/components/RateBoard";
import { Closing, Estates, Faq, Footer, HowItWorks } from "@/components/Sections";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main id="top">
        <Hero />
        <BookingBar />
        <RateBoard />
        <HowItWorks />
        <Estates />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </MotionConfig>
  );
}
