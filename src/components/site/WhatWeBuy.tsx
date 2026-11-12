"use client";

import { animate, useInView, useMotionValue, useMotionValueEvent } from "framer-motion";
import { Laptop, Milk, Newspaper, Package, Refrigerator, Wrench, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Scale3D } from "@/components/scale/Scale3D";
import { BUY } from "@/lib/site-data";
import { useReducedSafe } from "@/lib/use-reduced";
import { cn, inr } from "@/lib/utils";
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

/** Sample amount put on the scale for each item (kg, or pieces). */
const SAMPLE: Record<string, number> = { paper: 14.2, cardboard: 6.5, metal: 9.8, plastic: 3.1, ewaste: 2, appliance: 1 };

/**
 * Six things we buy and what they start at, with the LED weight meter above them.
 * Tap an item and it goes on the scale: the digits run up, overshoot a hair and settle, like a real scale.
 */
export function WhatWeBuy() {
  const reduce = useReducedSafe();
  const [pick, setPick] = useState(0);
  const [shown, setShown] = useState(0);
  const [stable, setStable] = useState(false);
  const kg = useMotionValue(0);
  useMotionValueEvent(kg, "change", (v) => setShown(v));
  const meter = useRef<HTMLDivElement>(null);
  const seen = useInView(meter, { once: true, margin: "0px 0px -20% 0px" });

  const item = BUY[pick];
  const target = SAMPLE[item.id] ?? 1;

  useEffect(() => {
    if (!seen) return;
    const c = reduce
      ? animate(kg, target, { duration: 0, onComplete: () => setStable(true) })
      : animate(kg, [0, target * 1.025, target * 0.995, target], {
          duration: 1.2,
          times: [0, 0.55, 0.8, 1],
          ease: [0.22, 1, 0.36, 1],
          onPlay: () => setStable(false),
          onComplete: () => setStable(true),
        });
    return () => c.stop();
  }, [seen, target, reduce, kg]);

  return (
    <section id="rates" className="scroll-mt-20 bg-cream py-20 md:py-28">
      <Container>
        <SectionHead title="Today's rates in Jorhat" eyebrow="What we buy" center>
          Starting prices. The digital scale at your door sets the final figure. Tap an item to put it on the scale.
        </SectionHead>

        <div ref={meter} className="mx-auto mb-6 max-w-[560px]">
          <Scale3D
            weight={shown}
            unit={item.unit}
            rate={item.price}
            amount={shown * item.price}
            label={`${item.name} · sample reading`}
            stable={stable}
          />
        </div>

        <Stagger as="ul" className="grid grid-cols-2 gap-px overflow-hidden border border-navy/10 bg-navy/10 md:grid-cols-3 lg:grid-cols-6">
          {BUY.map((b, i) => {
            const Icon = ICONS[b.id];
            const on = i === pick;
            return (
              <StaggerItem as="li" key={b.id} className="grid">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => setPick(i)}
                  className={cn(
                    "group grid content-start gap-3 p-5 text-left transition-colors duration-200 hover:bg-[#fbfaf6] sm:p-6",
                    on ? "bg-[#fbfaf6] shadow-[inset_0_-3px_0_var(--gold)]" : "bg-white",
                  )}
                >
                  <span className="grid size-12 place-items-center rounded-full bg-cream text-forest transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="text-[15px] font-semibold leading-snug text-navy">{b.name}</span>
                  <span className="font-mono text-lg text-forest tabular">
                    {inr(b.price)}
                    <span className="text-sm text-faint">/{b.unit}</span>
                  </span>
                  <span className="text-[13px] font-light text-muted">{b.examples}</span>
                </button>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
    </section>
  );
}
