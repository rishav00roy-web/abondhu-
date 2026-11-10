import { Laptop, Milk, Newspaper, Package, Refrigerator, Wrench, type LucideIcon } from "lucide-react";
import { BUY } from "@/lib/data";
import { inr } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { Container, SectionHead } from "./ui";

const ICONS: Record<string, LucideIcon> = {
  paper: Newspaper,
  cardboard: Package,
  metal: Wrench,
  plastic: Milk,
  ewaste: Laptop,
  appliance: Refrigerator,
};

/** Six things we buy and what they start at. One glance, no calculator. */
export function WhatWeBuy() {
  return (
    <section id="rates" className="scroll-mt-20 bg-cream py-20 md:py-28">
      <Container>
        <SectionHead title="Today's rates in Jorhat" eyebrow="What we buy" center>
          Starting prices. The digital scale at your door sets the final figure.
        </SectionHead>
        <Stagger as="ul" className="grid grid-cols-2 gap-px overflow-hidden border border-navy/10 bg-navy/10 md:grid-cols-3 lg:grid-cols-6">
          {BUY.map((b) => {
            const Icon = ICONS[b.id];
            return (
              <StaggerItem as="li" key={b.id} className="group grid content-start gap-3 bg-white p-5 transition-colors duration-200 hover:bg-[#fbfaf6] sm:p-6">
                <span className="grid size-12 place-items-center rounded-full bg-cream text-forest transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <h3 className="text-[15px] font-semibold leading-snug text-navy">{b.name}</h3>
                <p className="font-mono text-lg text-forest tabular">
                  {inr(b.price)}
                  <span className="text-sm text-faint">/{b.unit}</span>
                </p>
                <p className="text-[13px] font-light text-muted">{b.examples}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
