import type { Metadata } from "next";
import { VendorSignupClient } from "@/components/client-only";

export const metadata: Metadata = {
  title: "Become an Abondhu partner | Jorhat",
  description: "Sign up as a scrap vendor with Abondhu in Jorhat.",
  alternates: { canonical: "/partner" },
};

export default function PartnerPage() {
  return <VendorSignupClient />;
}
