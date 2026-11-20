import type { Metadata } from "next";
import { VendorSignupClient } from "@/components/client-only";

export const metadata: Metadata = {
  title: "Become an Abondhu partner | Jorhat",
  description: "Sign up as a scrap vendor with Abondhu in Jorhat.",
  // The sign-up form and vendor dashboard; /vendor is the public page that search should show.
  robots: { index: false, follow: false },
};

export default function PartnerPage() {
  return <VendorSignupClient />;
}
