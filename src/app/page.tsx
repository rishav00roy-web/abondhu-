import { MotionConfig } from "framer-motion";
import type { Metadata } from "next";
import { BookingBar } from "@/components/site/BookingBar";
import { Hero } from "@/components/site/Hero";
import { Nav } from "@/components/site/Nav";
import { VendorCta } from "@/components/site/VendorCta";
import { WhatWeBuy } from "@/components/site/WhatWeBuy";
import { Closing, Faq, Footer, HowItWorks, TrustStrip } from "@/components/site/Sections";
import { SITE_JSON_LD } from "@/lib/structured-data";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
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
