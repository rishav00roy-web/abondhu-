import { MotionConfig } from "framer-motion";
import type { Metadata } from "next";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Sections";
import { TornEdge } from "@/components/TornEdge";
import { Container, Eyebrow } from "@/components/ui";
import { VendorForm } from "@/components/VendorForm";

export const metadata: Metadata = {
  title: "Become a vendor | Abondhu",
  description: "Scrap collectors in Assam: get pickups booked on your route, a calibrated scale, daily UPI payouts and a verified Abondhu badge.",
};

const STEPS = [
  ["Register", "Send your name, number, town and how you collect. It takes a minute."],
  ["Meet the team", "We call within two working days, check your ID and ride one route with you."],
  ["Get your kit", "Scale, app, uniform and ID card. Your first bookings arrive that week."],
];

export default function VendorPage() {
  return (
    <MotionConfig reducedMotion="user">
      <Nav vendorPage />
      <main id="main">
        <section className="relative overflow-hidden bg-sunk">
          <div className="tea-rows tea-drift absolute inset-y-0 right-0 hidden w-[48%] lg:block" aria-hidden />
          <Container className="relative grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <Reveal className="grid content-start gap-6">
              <Eyebrow>For scrap collectors in Assam</Eyebrow>
              <h1 className="font-serif text-[clamp(38px,5vw,64px)] leading-[1.06] text-navy">
                Your route, <span className="italic text-forest">more bookings.</span>
              </h1>
              <p className="max-w-[46ch] text-[17px] font-light leading-relaxed text-ink/75">
                Households across Guwahati book pickups with Abondhu every day. We pass them to verified local vendors who
                know the lanes. You keep your trade and gain steady work, fair tools and daily pay.
              </p>
              <p className="max-w-[46ch] text-[15px] leading-relaxed text-ink/75">
                <span className="font-semibold text-navy">Who can join:</span> anyone 18 or older who already buys or collects scrap
                in an Abondhu town, on foot, by cart, auto or truck, with an Aadhaar card and a phone with UPI.
              </p>
              <ul className="grid gap-3 text-[15px] text-navy">
                {["No fee to join", "Paid every evening by UPI", "Choose the days and areas you work"].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="text-forest" aria-hidden>❖</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="grid gap-4">
              <VendorForm />
              <p className="text-center text-sm text-muted">
                Prefer to talk?{" "}
                <a
                  href="https://wa.me/919000000000?text=Hi%20Abondhu%2C%20I%20want%20to%20become%20a%20vendor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-forest underline decoration-forest/40 underline-offset-4 hover:decoration-forest"
                >
                  WhatsApp our vendor team
                </a>{" "}
                on +91 90000 00000.
              </p>
            </Reveal>
          </Container>
        </section>

        <section className="relative bg-forest py-20 text-white md:py-24">
          <TornEdge className="text-forest" />
          <Container>
            <Reveal as="h2" className="mb-12 font-serif text-4xl md:text-5xl">How joining works</Reveal>
            <Stagger as="ol" className="grid gap-10 md:grid-cols-3" gap={0.1}>
              {STEPS.map(([title, body], i) => (
                <StaggerItem as="li" key={title} className="grid content-start gap-3 border-t border-gold/40 pt-6">
                  <span className="font-mono text-sm text-gold tabular">0{i + 1}</span>
                  <h3 className="font-serif text-2xl">{title}</h3>
                  <p className="max-w-[36ch] font-light leading-relaxed text-white/75">{body}</p>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      </main>
      <Footer />
    </MotionConfig>
  );
}
