"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { FAQS } from "@/lib/data";
import { cn, EASE_OUT } from "@/lib/utils";
import { Brand, btn, Container, SectionHead } from "./ui";

const STEPS = [
  ["Book", "Pick your town, a day and share your pincode. We text a two-hour window the evening before."],
  ["Weigh", "Our partner sorts your scrap by type and weighs each pile on a calibrated scale while you watch."],
  ["Get paid", "UPI or cash before the partner leaves, with a receipt listing every reading."],
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-t border-line py-[clamp(64px,9vw,112px)]">
      <Container>
        <SectionHead title="How a pickup works" />
        <ol className="grid gap-10 md:grid-cols-3 md:gap-12">
          {STEPS.map(([title, body], i) => (
            <li key={title} className="grid content-start gap-3">
              <span className="font-mono text-sm text-faint">{i + 1}</span>
              <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
              <p className="max-w-[36ch] leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

const SEGMENTS = [
  ["Tea estates and factories", "Gunny bags, machinery scrap, drums, old electricals"],
  ["Offices", "Shredded paper, IT equipment, furniture metal"],
  ["Housing societies", "One collection day for every flat"],
  ["Shops and godowns", "Cartons, packing plastic, damaged stock"],
];

export function Estates() {
  return (
    <section id="estates" className="scroll-mt-24 border-t border-line py-[clamp(64px,9vw,112px)]">
      <Container className="grid gap-12 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <h2 className="text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">
            Scheduled collection for tea estates and businesses
          </h2>
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-muted">
            A fixed weekly or monthly slot, a vehicle sized to the load, bank transfer, and a GST invoice with a weight report
            for every collection.
          </p>
          <a href="#contact" className="mt-2 inline-flex items-center gap-1.5 text-[15px] font-medium text-accent hover:underline">
            Talk to our team <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
        <dl className="grid content-start gap-6 sm:grid-cols-2">
          {SEGMENTS.map(([title, body]) => (
            <div key={title} className="grid gap-1">
              <dt className="font-medium">{title}</dt>
              <dd className="text-[15px] leading-relaxed text-muted">{body}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

export function Faq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-24 border-t border-line py-[clamp(64px,9vw,112px)]">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-3">
          <h2 className="text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">Questions</h2>
          <p id="contact" className="text-[17px] leading-relaxed text-muted">
            Anything else? WhatsApp us on <span className="font-mono text-ink">+91 90000 00000</span>, 8am to 8pm.
          </p>
        </div>
        <div className="divide-y divide-line border-y border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="py-5">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-6 text-left text-[17px] font-medium"
                  >
                    {f.q}
                    <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}>
                      <Plus className="size-4 text-faint" aria-hidden />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.p
                      id={`faq-${i}`}
                      initial={reduce ? false : { opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.1 } }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      className="mt-3 max-w-[62ch] leading-relaxed text-muted"
                    >
                      {f.a}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export function Closing() {
  return (
    <section className="border-t border-line py-[clamp(64px,9vw,112px)]">
      <Container className="flex flex-wrap items-end justify-between gap-8">
        <h2 className="max-w-[18ch] text-[clamp(32px,4.4vw,52px)] font-semibold leading-[1.05] tracking-[-0.035em]">
          Clear the store room this week.
        </h2>
        <a href="#book" className={cn(btn.base, btn.primary, "h-12 px-6")}>
          Book a free pickup <ArrowRight className="size-4" aria-hidden />
        </a>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line py-10 text-sm text-muted">
      <Container className="flex flex-wrap items-center justify-between gap-6">
        <a href="#top"><Brand /></a>
        <span>Doorstep scrap pickup in Assam</span>
        <span className="text-faint">© 2026 Abondhu. Rates and figures are placeholders.</span>
      </Container>
    </footer>
  );
}
