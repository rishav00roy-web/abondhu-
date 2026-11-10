import { MotionConfig } from "framer-motion";
import { BookingBar } from "@/components/site/BookingBar";
import { Hero } from "@/components/site/Hero";
import { Nav } from "@/components/site/Nav";
import { VendorCta } from "@/components/site/VendorCta";
import { WhatWeBuy } from "@/components/site/WhatWeBuy";
import { Closing, Faq, Footer, HowItWorks, TrustStrip } from "@/components/site/Sections";

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
