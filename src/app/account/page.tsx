import { MotionConfig } from "framer-motion";
import type { Metadata } from "next";
import { CustomerAccountClient } from "@/components/client-only";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Sections";

export const metadata: Metadata = {
  title: "Log in | Abondhu",
  description: "Log in to sell your scrap with Abondhu in Jorhat.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main id="main">
        <CustomerAccountClient />
      </main>
      <Footer />
    </MotionConfig>
  );
}
