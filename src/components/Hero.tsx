"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { AREAS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { SPRING, Stagger, StaggerItem } from "./motion";
import { WasteToWealth } from "./WasteToWealth";
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
    <section className="relative flex w-full items-center overflow-hidden bg-sunk lg:min-h-[88vh]">
      <div className="tea-rows tea-drift absolute inset-y-0 right-0 hidden w-[62%] lg:block" aria-hidden />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pt-6 sm:px-6 sm:pt-12 md:px-12 lg:gap-12 lg:py-24 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={SPRING}
          className="relative bg-white px-6 py-9 shadow-2xl sm:p-12 lg:p-16"
        >
          <div className="pointer-events-none absolute inset-0 m-2 border border-gold/30" aria-hidden />
          <Stagger className="relative grid gap-6 sm:gap-8" gap={0.08}>
            <StaggerItem><Eyebrow tone="forest">Wealth from waste</Eyebrow></StaggerItem>
            <StaggerItem><WasteToWealth /></StaggerItem>
            <StaggerItem as="p" className="max-w-[44ch] text-[17px] font-light leading-relaxed text-ink/70 sm:text-lg sm:tracking-wide">
              Old newspaper, metal, plastic and appliances are worth money. We collect them from your door, weigh them in front of you, pay before we leave, and send every kilo to a recycler in Assam.
            </StaggerItem>
            <StaggerItem className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <a href="#book" className={cn(btn.base, btn.primary)}>
                Sell your scrap
              </a>
              <Link href="/vendor" className={cn(btn.base, btn.quiet)}>
                Become a vendor <ArrowRight className="size-4" aria-hidden />
              </Link>
            </StaggerItem>
            <StaggerItem as="p" className="text-sm text-muted">
              Now in {AREAS.map((a) => a.city).slice(0, -1).join(", ")} and {AREAS[AREAS.length - 1].city}.
            </StaggerItem>
          </Stagger>
        </motion.div>

        <div className="tea-rows tea-drift -mx-4 px-4 py-10 sm:-mx-6 sm:px-6 sm:py-12 md:-mx-12 md:px-12 lg:mx-0 lg:p-0 lg:[background:none]">
          <WeighingReceipt />
        </div>
      </div>
    </section>
  );
}
