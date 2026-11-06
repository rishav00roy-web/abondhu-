"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";
import { CATEGORIES, type CategoryKey } from "@/lib/data";
import { EASE_OUT } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { Container, SectionHead } from "./ui";

/** What happens to each stream after the van leaves. */
const STREAMS: { key: CategoryKey; examples: string; process: string; becomes: string }[] = [
  {
    key: "paper",
    examples: "Newspaper, cartons, old books",
    process: "Pulped at a paper mill",
    becomes: "New cartons, egg trays and notebooks",
  },
  {
    key: "metal",
    examples: "Iron, steel, aluminium, brass",
    process: "Sorted by grade and melted at a foundry",
    becomes: "Rods, sheets and new utensils",
  },
  {
    key: "plastic",
    examples: "PET bottles, buckets, crates",
    process: "Washed, shredded and pelletised",
    becomes: "Granules for pipes, crates and fibre",
  },
  {
    key: "ewaste",
    examples: "ACs, fridges, laptops",
    process: "Taken apart by an authorised e-waste recycler",
    becomes: "Copper, steel and safely recovered gas",
  },
];

/** Sample impact figures for the mock. */
const IMPACT = [
  { value: 482000, suffix: " kg", label: "kept out of landfills and riverbanks" },
  { value: 8200, suffix: "", label: "trees' worth of paper sent back to mills" },
  { value: 12400, suffix: "", label: "homes, shops and estates served" },
];

function Count({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? to : 0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString("en-IN") + suffix);
  useEffect(() => {
    if (!inView || reduce) return;
    const c = animate(mv, to, { duration: 1.4, ease: EASE_OUT });
    return () => c.stop();
  }, [inView, reduce, mv, to]);
  return <motion.span ref={ref} className="tabular">{text}</motion.span>;
}

export function SecondLife() {
  return (
    <section id="impact" className="scroll-mt-20 bg-white py-20 md:py-32">
      <Container>
        <SectionHead title="Where your scrap goes next" eyebrow="Recycled, not dumped">
          Every pickup is sorted by type and handed to a licensed recycler in Assam. Nothing we collect is burnt, buried or
          left by the river.
        </SectionHead>

        <Stagger as="ol" className="grid gap-px overflow-hidden border border-navy/10 bg-navy/10 sm:grid-cols-2 lg:grid-cols-4">
          {STREAMS.map((s) => (
            <StaggerItem as="li" key={s.key} className="grid content-start gap-4 bg-white p-6 sm:gap-5 sm:p-8">
              <div className="grid gap-2">
                <span className="h-1 w-10" style={{ background: CATEGORIES[s.key].color }} aria-hidden />
                <h3 className="font-serif text-2xl text-navy">{CATEGORIES[s.key].name}</h3>
                <p className="text-sm font-light text-muted">{s.examples}</p>
              </div>
              <div className="grid gap-2 text-[15px]">
                <p className="font-medium text-ink">{s.process}</p>
                <ArrowDown className="size-4 text-forest" aria-hidden />
                <p className="font-serif text-lg italic text-forest">{s.becomes}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <Stagger className="mt-14 grid gap-10 border-t border-navy/10 pt-12 md:mt-20 md:grid-cols-3 md:gap-12 md:pt-14">
          {IMPACT.map((m) => (
            <StaggerItem key={m.label} className="grid content-start gap-3">
              <span className="h-px w-12 bg-gold" aria-hidden />
              <p className="font-serif text-[clamp(40px,4.6vw,56px)] leading-none text-navy">
                <Count to={m.value} suffix={m.suffix} />
              </p>
              <p className="max-w-[26ch] font-light leading-relaxed text-muted">{m.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
        <p className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-faint">
          Sample figures for this demo. <a href="#book" className="inline-flex items-center gap-1 font-medium text-forest hover:underline">Add your store room to them <ArrowRight className="size-3.5" aria-hidden /></a>
        </p>
      </Container>
    </section>
  );
}
