import { MotionConfig } from "framer-motion";
import { BookingBar } from "@/components/BookingBar";
import { Hero } from "@/components/Hero";
import { Nav } from "@/components/Nav";
import { VendorCta } from "@/components/VendorCta";
import { WhatWeBuy } from "@/components/WhatWeBuy";
import { Closing, Faq, Footer, HowItWorks, TrustStrip } from "@/components/Sections";

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main id="main">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <WhatWeBuy />
        <BookingBar />
        <VendorCta />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </MotionConfig>
  );
}
