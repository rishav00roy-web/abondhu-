"use client";

import Link from "next/link";
import { VendorLink } from "./VendorLink";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, HandCoins, IndianRupee, Plus, Recycle, Scale, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { FAQS } from "@/lib/site-data";
import { cn, EASE_OUT } from "@/lib/utils";
import { TornEdge } from "./TornEdge";
import { Reveal, SPRING, SPRING_FAST, Stagger, StaggerItem } from "./motion";
import { Brand, btn, Container, SectionHead, serifTitle } from "./ui";

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
  { icon: Truck, title: "We come to you", body: "Book in a minute. Free pickup anywhere in Jorhat town, same or next day." },
  { icon: Scale, title: "Weighed at your door", body: "Each kind of scrap goes on a digital scale you can read for yourself." },
  { icon: IndianRupee, title: "Paid on the spot", body: "Cash or UPI before we leave, with a receipt for every item." },
  { icon: Recycle, title: "Recycled, not dumped", body: "Sorted and sent to licensed recyclers, so it comes back as new material." },
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
    <section id="how" className="relative scroll-mt-20 bg-white py-20 md:py-28">
      <Container>
        <SectionHead title="Four steps, about ten minutes at your door" eyebrow="How it works" center />
        <Stagger as="ol" className="grid gap-0 md:grid-cols-4 md:gap-8" gap={0.12}>
          {STEPS.map(({ icon: Icon, title, body }, i) => {
            const last = i === STEPS.length - 1;
            return (
              <StaggerItem as="li" key={title} className="relative grid grid-cols-[56px_1fr] content-start gap-x-5 md:grid-cols-1">
                <div className="flex flex-col items-center md:items-start">
                  <span className="grid size-14 shrink-0 place-items-center rounded-full border border-gold bg-cream text-forest">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  {!last && (
                    <span className="flex min-h-6 flex-1 justify-center py-2 md:hidden">
                      <Connector vertical />
                    </span>
                  )}
                </div>
                {!last && (
                  <span className="absolute left-[68px] right-[-20px] top-[27px] hidden md:flex">
                    <Connector />
                  </span>
                )}
                <div className={cn("grid content-start gap-2 pt-2 md:pt-7", !last && "pb-10 md:pb-0")}>
                  <span className="font-mono text-xs text-forest">Step {String(i + 1).padStart(2, "0")}</span>
                  <h3 className="font-serif text-2xl text-navy">{title}</h3>
                  <p className="max-w-[34ch] font-light leading-relaxed text-muted">{body}</p>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </Container>
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
          <Link href="/account" className={cn(btn.base, btn.gold, "w-full sm:w-auto")}>
            Book a free pickup <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}

const footLink = "py-1.5 transition-[color,transform] duration-200 hover:translate-x-1 hover:text-white";

export function Footer() {
  return (
    <footer className="relative bg-midnight text-white">
      <TornEdge className="text-midnight" />
      <Container className="grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="grid content-start gap-4">
          <Link href="/" aria-label="Abondhu home" className="justify-self-start"><Brand light /></Link>
          <p className="max-w-[36ch] text-sm font-light leading-relaxed text-white/60">
            Wealth from waste, in Jorhat. Weighed in front of you, paid on the spot, and never dumped.
          </p>
        </div>
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">Explore</p>
          <nav className="grid gap-1 text-sm font-light text-white/70">
            {[["/#how", "How it works"], ["/#rates", "Today's rates"], ["/#book", "Book a pickup"], ["/vendor", ""], ["/#faq", "Questions"]].map(([href, label]) =>
              href === "/vendor" ? (
                <VendorLink key={href} className={footLink} />
              ) : (
                <Link key={href} href={href} className={footLink}>{label}</Link>
              ),
            )}
          </nav>
        </div>
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/40">Contact</p>
          <div className="grid gap-3 text-sm font-light text-white/70">
            <span>WhatsApp <span className="font-mono text-white">+91 90000 00000</span></span>
            <span>8am to 8pm, every day</span>
            <span>Jorhat, Assam</span>
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
