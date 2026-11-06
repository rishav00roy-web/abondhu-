"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AREAS } from "@/lib/data";
import { cn, EASE_OUT } from "@/lib/utils";
import { btn, Eyebrow } from "./ui";
import { WeighingReceipt } from "./WeighingReceipt";

/*
 * Willchris hero layout: a stone ground, a large panel on the right, and a white card
 * with an inset gold border overlapping it. The panel shows the weighing slip
 * instead of a stock photo.
 */
export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section className="relative flex min-h-[88vh] w-full items-center overflow-hidden bg-sunk">
      <div className="tea-rows absolute inset-y-0 right-0 hidden w-[62%] lg:block" aria-hidden />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-16 md:px-12 lg:py-24 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="relative bg-white p-8 shadow-2xl sm:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute inset-0 m-2 border border-gold/30" aria-hidden />
          <div className="relative grid gap-8">
            <Eyebrow tone="forest">Assam&apos;s doorstep scrap service</Eyebrow>
            <h1 className="font-serif text-[clamp(42px,5.4vw,72px)] leading-[1.05] text-navy">
              Sell your scrap without <i className="font-light text-forest">leaving</i> home.
            </h1>
            <p className="max-w-[44ch] text-lg font-light leading-relaxed tracking-wide text-ink/70">
              Doorstep pickup across Assam. We weigh everything in front of you and pay before we leave.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <a href="#book" className={cn(btn.base, btn.primary)}>
                Book a free pickup
              </a>
              <a href="#rates" className={cn(btn.base, btn.quiet)}>
                See today&apos;s rates
              </a>
            </div>
            <p className="text-sm text-muted">
              Now in {AREAS.map((a) => a.city).slice(0, -1).join(", ")} and {AREAS[AREAS.length - 1].city}.
            </p>
          </div>
        </motion.div>

        <div className="tea-rows -mx-6 px-6 py-12 md:-mx-12 md:px-12 lg:mx-0 lg:p-0 lg:[background:none]">
          <WeighingReceipt />
        </div>
      </div>
    </section>
  );
}
