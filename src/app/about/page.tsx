import type { Metadata } from "next";
import Link from "next/link";
import { EmailLink, LegalPage } from "@/components/site/LegalPage";
import { COMPANY, HOURS, PHONE, PHONE_E164, WHATSAPP_URL } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "About and contact | Abondhu",
  description: `Abondhu is run by ${COMPANY}, Jorhat, Assam. It connects you with verified scrap dealers near you. Reach us on WhatsApp or email.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalPage eyebrow="About Abondhu" title="About and contact">
      <section>
        <p>
          Abondhu makes selling scrap simple and fair: you book a free pickup, and a verified
          scrap dealer near you comes to your door, weighs your scrap on a digital scale in front of you and pays you on the
          spot. Abondhu itself does not buy scrap. We find you an honest dealer and stay with you if anything goes wrong.
        </p>
      </section>

      <section>
        <h2>Who we are</h2>
        <p>
          Abondhu is run by {COMPANY}, a company registered in Jorhat, Assam, India in 2026. Abondhu is for all of India and
          opens city by city as dealers join. Pickups are open in Jorhat now.
        </p>
      </section>

      <section>
        <h2>How dealers are checked</h2>
        <p>
          Every dealer signs up with their identity documents, which our team checks before they can take a pickup. Dealers
          carry a digital scale you can read yourself, and they send what they buy on to recyclers. Dealers can also{" "}
          <Link href="/vendor">join Abondhu here</Link>.
        </p>
      </section>

      <section id="contact" className="scroll-mt-28">
        <h2>Contact us</h2>
        <ul>
          <li>WhatsApp: <a href={WHATSAPP_URL}>{PHONE}</a></li>
          <li>Phone: <a href={`tel:${PHONE_E164}`}>{PHONE}</a></li>
          <li>Email: <EmailLink /></li>
          <li>Hours: {HOURS}</li>
          <li>Address: {COMPANY}, Jorhat, Assam, India</li>
        </ul>
        <p className="mt-3">
          Read our <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms of use</Link>.
        </p>
      </section>
    </LegalPage>
  );
}
