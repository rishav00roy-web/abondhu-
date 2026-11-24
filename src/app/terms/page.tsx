import type { Metadata } from "next";
import Link from "next/link";
import { EmailLink, LegalPage } from "@/components/site/LegalPage";
import { COMPANY } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Terms of use | Abondhu",
  description: "The simple rules for using Abondhu to book a scrap pickup with a verified dealer near you.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Last updated 24 November 2026" title="Terms of use">
      <section>
        <p>
          Abondhu is run by {COMPANY}, Jorhat, Assam. By using abondhu.com or booking a pickup, you agree to these terms.
          Our <Link href="/privacy">privacy policy</Link> explains how we handle your data.
        </p>
      </section>

      <section>
        <h2>What Abondhu does</h2>
        <p>
          Abondhu is a free service that connects you with an independent, verified scrap dealer near you. Abondhu does not
          buy your scrap. The dealer weighs it, buys it and pays you directly.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You must be 18 or older to book a pickup or join as a dealer.</li>
          <li>Give us correct details, and keep your login codes to yourself.</li>
          <li>We may block accounts that misuse the service or give false details.</li>
        </ul>
      </section>

      <section>
        <h2>Pickups</h2>
        <ul>
          <li>Booking and pickup are free.</li>
          <li>The dealer weighs your scrap on a digital scale in front of you and tells you the rate before you sell. You only sell if you agree.</li>
          <li>Rates shown on the site are a guide. The final amount depends on the actual weight and condition of your scrap and is agreed between you and the dealer.</li>
          <li>Only sell scrap that belongs to you. Dealers do not take hazardous waste, medical waste or stolen goods.</li>
          <li>You can change or cancel a pickup before the dealer arrives by messaging us on WhatsApp.</li>
        </ul>
      </section>

      <section>
        <h2>Dealers</h2>
        <p>
          Dealers are independent businesses verified by Abondhu. They must follow our pickup rules, weigh honestly and treat
          customers with respect. We may pause or remove a dealer who does not.
        </p>
      </section>

      <section>
        <h2>Our responsibility</h2>
        <p>
          We work hard to keep the service running and pickups on time, but we cannot promise it will never be delayed or
          unavailable. Report any problem with a pickup to us and we will look into it.
        </p>
      </section>

      <section>
        <h2>Changes and law</h2>
        <p>
          We may update these terms and will change the date at the top when we do. These terms follow the laws of India, and
          courts in Jorhat, Assam handle any dispute.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>Questions? Email <EmailLink />.</p>
      </section>
    </LegalPage>
  );
}
