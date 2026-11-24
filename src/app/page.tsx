import { MotionConfig } from "framer-motion";
import type { Metadata } from "next";
import { BookingBar } from "@/components/site/BookingBar";
import { Hero } from "@/components/site/Hero";
import { Nav } from "@/components/site/Nav";
import { VendorCta } from "@/components/site/VendorCta";
import { WhatWeBuy } from "@/components/site/WhatWeBuy";
import { Closing, Faq, Footer, HowItWorks, TrustStrip } from "@/components/site/Sections";
import { LOCAL_BUSINESS_JSON_LD } from "@/lib/seo";

// Title, description and link preview come from the root layout.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <MotionConfig reducedMotion="user">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LOCAL_BUSINESS_JSON_LD }} />
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
