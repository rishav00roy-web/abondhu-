import Link from "next/link";
import { ArrowRight, BadgeCheck, Route, Scale, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Stagger, StaggerItem } from "./motion";
import { TornEdge } from "./TornEdge";
import { btn, Container, Eyebrow } from "./ui";

const PERKS = [
  { icon: Route, title: "Pickups booked on your route", body: "Households near you book online. You get the list the evening before." },
  { icon: Scale, title: "A calibrated scale and the app", body: "Weigh in front of the customer, print the slip, no arguments." },
  { icon: Wallet, title: "Paid every day by UPI", body: "Your earnings land the same evening, with a statement for every pickup." },
  { icon: BadgeCheck, title: "A verified Abondhu badge", body: "ID card and uniform, so households know who is at the door." },
];

/** For the kabadiwalas and scrap collectors who make the whole thing work. */
export function VendorCta() {
  return (
    <section id="vendors" className="relative scroll-mt-20 bg-midnight py-20 text-white md:py-28">
      <TornEdge className="text-midnight" />
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <Reveal className="grid content-start gap-6">
          <Eyebrow tone="gold">For scrap collectors</Eyebrow>
          <h2 className="font-serif text-[clamp(36px,4.4vw,56px)] leading-[1.06]">
            Already collect scrap? <span className="italic text-gold">Earn more with us.</span>
          </h2>
          <p className="max-w-[44ch] text-[17px] font-light leading-relaxed text-white/75">
            Abondhu is built on local vendors. We bring the bookings, the tools and the trust. You bring the cart, the
            auto or the truck, and keep the route you know.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <Link href="/vendor" className={cn(btn.base, btn.gold)}>
              Become a vendor <ArrowRight className="size-4" aria-hidden />
            </Link>
            <span className="text-sm font-light text-white/55">Free to join. Guwahati first, then every town we serve.</span>
          </div>
        </Reveal>
        <Stagger as="ul" className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <StaggerItem as="li" key={title} className="grid content-start gap-3 bg-midnight p-6 sm:p-7">
              <Icon className="size-5 text-gold" strokeWidth={1.5} aria-hidden />
              <h3 className="font-serif text-xl">{title}</h3>
              <p className="text-sm font-light leading-relaxed text-white/65">{body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
