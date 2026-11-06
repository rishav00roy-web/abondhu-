"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarCheck, HandCoins, Plus, Recycle, Scale, ShieldCheck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { FAQS } from "@/lib/data";
import { cn, EASE_OUT } from "@/lib/utils";
import { TornEdge } from "./TornEdge";
import { Reveal, SPRING, SPRING_FAST, Stagger, StaggerItem } from "./motion";
import { Brand, btn, Container, Eyebrow, SectionHead, serifTitle } from "./ui";

const TRUST: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Scale, title: "Weighed in front of you", body: "Calibrated digital scales" },
  { icon: HandCoins, title: "Paid on the spot", body: "UPI, bank transfer or cash" },
  { icon: ShieldCheck, title: "Verified partners", body: "ID-checked and in uniform" },
  { icon: Recycle, title: "Recycled, not dumped", body: "Licensed recyclers only" },
];

export function TrustStrip() {
  return (
    <section aria-label="Why Abondhu" className="bg-midnight py-9 text-white md:py-10">
      <Container>
        <Stagger as="ul" className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <StaggerItem as="li" key={title} className="flex items-center gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold/40 text-gold">
                <Icon className="size-5" strokeWidth={1.5} aria-hidden />
              </span>
              <span className="grid gap-1">
                <span className="text-[15px] font-semibold">{title}</span>
                <span className="text-sm font-light text-white/65">{body}</span>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
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
    ? "bg-[repeating-linear-gradient(to_bottom,rgb(212_175_55_/_0.7)_0_5px,transparent_5px_10px)]"
    : "bg-[repeating-linear-gradient(to_right,rgb(212_175_55_/_0.7)_0_5px,transparent_5px_10px)]";
  return (
    <motion.span
      aria-hidden
      className={cn("block", dash, vertical ? "w-[1.5px] origin-top" : "h-[1.5px] w-full origin-left")}
      initial={reduce ? false : vertical ? { scaleY: 0 } : { scaleX: 0 }}
      whileInView={vertical ? { scaleY: 1 } : { scaleX: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.4 }}
    />
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 bg-forest py-20 text-white md:py-32">
      <TornEdge className="text-forest" />
      <Container>
        <SectionHead title="Three steps, and you never leave home." center dark>
          Book in a minute, watch every pile weighed, and get paid before the partner leaves. Then it goes to be recycled.
        </SectionHead>
        <Stagger as="ol" className="grid gap-0 md:grid-cols-3 md:gap-10" gap={0.12}>
          {STEPS.map(({ icon: Icon, title, body }, i) => {
            const last = i === STEPS.length - 1;
            return (
              <StaggerItem as="li" key={title} className="relative grid grid-cols-[56px_1fr] content-start gap-x-5 md:grid-cols-1">
                <div className="flex flex-col items-center md:items-start">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full border border-gold text-gold">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                    <span className="sr-only">Step {i + 1}</span>
                  </span>
                  {!last && (
                    <span className="flex min-h-6 flex-1 justify-center py-2 md:hidden">
                      <Connector vertical />
                    </span>
                  )}
                </div>
                {!last && (
                  <span className="absolute left-[68px] right-[-28px] top-[27px] hidden md:flex">
                    <Connector />
                  </span>
                )}
                <div className={cn("grid content-start gap-3 pt-3 md:pt-8", !last && "pb-10 md:pb-0")}>
                  <h3 className="font-serif text-2xl">{title}</h3>
                  <p className="max-w-[38ch] font-light leading-relaxed text-white/75">{body}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
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
    <section id="estates" className="relative scroll-mt-24 bg-sand">
      <TornEdge className="text-sand" />
      <div className="grid lg:grid-cols-2">
        <div className="tea-rows flex flex-col justify-end gap-4 px-6 py-12 text-white md:p-16 lg:min-h-[560px] xl:p-24">
          <p className="font-serif text-[clamp(56px,7vw,96px)] leading-none text-gold">6</p>
          <p className="max-w-[24ch] font-serif text-2xl italic leading-snug">
            towns across Assam, from Guwahati to Silchar, on a fixed van schedule.
          </p>
        </div>
        <Reveal className="flex flex-col justify-center gap-7 px-6 py-14 md:p-16 xl:p-24">
          <Eyebrow>For tea estates and business</Eyebrow>
          <h2 className={serifTitle}>Scheduled collection, invoiced properly</h2>
          <p className="max-w-[48ch] font-light leading-relaxed text-ink/80">
            A fixed weekly or monthly slot, a vehicle sized to the load, bank transfer, and a GST invoice with a weight report
            for every collection.
          </p>
          <Stagger as="ul" className="grid gap-x-8 gap-y-5 text-sm font-medium tracking-wide text-navy sm:grid-cols-2">
            {SEGMENTS.map(([title, body]) => (
              <StaggerItem as="li" key={title} className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-b border-navy/10 pb-4">
                <span className="text-forest" aria-hidden>❖</span>
                <span>{title}</span>
                <span className="col-start-2 text-[13px] font-light tracking-normal text-muted">{body}</span>
              </StaggerItem>
            ))}
          </Stagger>
          <a href="#contact" className={cn(btn.base, btn.primary, "self-start")}>
            Talk to our team <ArrowRight className="size-4" aria-hidden />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

export function Faq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative scroll-mt-20 bg-white py-20 md:py-32">
      <TornEdge className="text-white" />
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="grid content-start gap-3">
          <Eyebrow>Good to know</Eyebrow>
          <h2 className={serifTitle}>Questions</h2>
          <p id="contact" className="font-light leading-relaxed text-muted">
            Anything else? WhatsApp us on <span className="font-mono text-ink">+91 90000 00000</span>, 8am to 8pm.
          </p>
        </Reveal>
        <div className="divide-y divide-navy/10 border-y border-navy/10">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="py-4 sm:py-6">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex min-h-11 w-full items-center justify-between gap-6 text-left font-serif text-lg text-navy sm:text-xl"
                  >
                    {f.q}
                    <motion.span className="shrink-0" animate={{ rotate: isOpen ? 45 : 0 }} transition={reduce ? { duration: 0 } : SPRING_FAST}>
                      <Plus className="size-4 text-forest" aria-hidden />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      initial={reduce ? false : { height: 0, opacity: 0, filter: "blur(4px)" }}
                      animate={{ height: "auto", opacity: 1, filter: "blur(0px)", transition: SPRING }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0, transition: { ...SPRING_FAST, opacity: { duration: 0.1 } } }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[62ch] pt-3 font-light leading-relaxed text-muted">{f.a}</p>
                    </motion.div>
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
    <section className="bg-navy py-16 text-white md:py-24">
      <Container className="flex flex-wrap items-center justify-between gap-8">
        <Reveal as="h2" className="max-w-[18ch] font-serif text-[clamp(32px,4.4vw,54px)] leading-[1.08]">
          Clear the store room, <i className="font-light text-gold">not the riverbank.</i>
        </Reveal>
        <Reveal delay={0.1} className="w-full sm:w-auto">
          <a href="#book" className={cn(btn.base, btn.gold, "w-full sm:w-auto")}>
            Book a free pickup <ArrowRight className="size-4" aria-hidden />
          </a>
        </Reveal>
      </Container>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-midnight text-white">
      <TornEdge className="text-midnight" />
      <Container className="grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <a href="#top" className="justify-self-start"><Brand light /></a>
          <p className="max-w-[36ch] text-sm font-light leading-relaxed text-white/60">
            Doorstep recycling across Assam. Weighed in front of you, paid on the spot, and never dumped.
          </p>
        </div>
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">Explore</p>
          <nav className="grid gap-1 text-sm font-light text-white/70">
            {[["#rates", "Today's rates"], ["#how", "How it works"], ["#impact", "Where it goes"], ["#estates", "Tea estates and business"], ["#faq", "Questions"]].map(([href, label]) => (
              <a key={href} href={href} className="py-1.5 transition-[color,transform] duration-200 hover:translate-x-1 hover:text-white">{label}</a>
            ))}
          </nav>
        </div>
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">Contact</p>
          <div className="grid gap-3 text-sm font-light text-white/70">
            <span>WhatsApp <span className="font-mono text-white">+91 90000 00000</span></span>
            <span>8am to 8pm, every day</span>
            <span>Guwahati, Assam</span>
          </div>
        </div>
      </Container>
      <div className="border-t border-white/5 bg-black/20">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-xs font-light text-white/45 sm:flex-row">
          <span>© 2026 Abondhu. All rights reserved.</span>
          <span>Rates and figures are placeholders.</span>
        </Container>
      </div>
    </footer>
  );
}
