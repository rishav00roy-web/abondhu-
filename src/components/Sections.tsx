"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarCheck, HandCoins, Plus, Recycle, Scale, ShieldCheck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { FAQS } from "@/lib/data";
import { cn, EASE_OUT } from "@/lib/utils";
import { Brand, btn, Container, SectionHead } from "./ui";

const TRUST: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Scale, title: "Weighed in front of you", body: "Calibrated digital scales" },
  { icon: HandCoins, title: "Paid on the spot", body: "UPI, bank transfer or cash" },
  { icon: ShieldCheck, title: "Verified partners", body: "ID-checked and in uniform" },
  { icon: Recycle, title: "Recycled, not dumped", body: "Licensed recyclers only" },
];

export function TrustStrip() {
  return (
    <section aria-label="Why Abondhu" className="border-y border-line bg-sunk py-8">
      <Container>
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-center gap-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-ink">
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="grid gap-0.5">
                <span className="text-[15px] font-semibold">{title}</span>
                <span className="text-sm text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: CalendarCheck,
    title: "Pick a day",
    body: "Choose your town and a date, and share your pincode. We text a two-hour window the evening before.",
  },
  {
    icon: Scale,
    title: "Watch it weighed",
    body: "Our partner sorts your scrap by type and weighs each pile. You see every reading.",
  },
  {
    icon: HandCoins,
    title: "Get paid",
    body: "Money reaches you before the partner leaves, with a digital receipt for every item.",
  },
];

/** Dotted line between the step markers. It draws itself once, left to right, when the row scrolls in. */
function Connector({ vertical = false }: { vertical?: boolean }) {
  const reduce = useReducedMotion();
  const dash = vertical
    ? "bg-[repeating-linear-gradient(to_bottom,var(--slate)_0_5px,transparent_5px_10px)]"
    : "bg-[repeating-linear-gradient(to_right,var(--slate)_0_5px,transparent_5px_10px)]";
  return (
    <motion.span
      aria-hidden
      className={cn("block", dash, vertical ? "w-[1.5px] origin-top" : "h-[1.5px] w-full origin-left")}
      initial={reduce ? false : vertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={vertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.15 }}
    />
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 border-t border-line py-[clamp(64px,9vw,112px)]">
      <Container>
        <SectionHead title="Three steps, and you never leave home." />
        <ol className="grid gap-0 md:grid-cols-3 md:gap-10">
          {STEPS.map(({ icon: Icon, title, body }, i) => {
            const last = i === STEPS.length - 1;
            return (
              <li key={title} className="relative grid content-start grid-cols-[52px_1fr] gap-x-5 md:grid-cols-1">
                {/* marker; the dotted connector runs beside the text on phones and across to the next marker from md up */}
                <div className="flex flex-col items-center md:items-start">
                  <span className="grid size-[52px] shrink-0 place-items-center rounded-full border-[1.5px] border-ink bg-surface text-ink">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                    <span className="sr-only">Step {i + 1}</span>
                  </span>
                  {!last && (
                    <span className="flex min-h-6 flex-1 justify-center py-2 md:hidden">
                      <Connector vertical />
                    </span>
                  )}
                </div>
                {!last && (
                  <span className="absolute left-[64px] right-[-28px] top-[25px] hidden md:flex">
                    <Connector />
                  </span>
                )}
                <div className={cn("grid content-start gap-2 pt-3 md:pt-7", !last && "pb-8 md:pb-0")}>
                  <h3 className="text-xl font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="max-w-[38ch] leading-relaxed text-muted">{body}</p>
                </div>
              </li>
            );
          })}
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
