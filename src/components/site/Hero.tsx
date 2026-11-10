"use client";

import Link from "next/link";
import { ArrowRight, Recycle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { ProcessRing } from "./ProcessRing";
import { WasteToWealth } from "./WasteToWealth";
import { btn } from "./ui";
import { VendorLink } from "./VendorLink";

/*
 * Kept deliberately quiet: a headline, one line, one action, and the loop picture.
 * Everything else (steps, rates, booking) has its own section further down.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-10 sm:pt-14 md:px-12 lg:min-h-[calc(100svh-76px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:py-16">
        <Stagger className="grid content-start justify-items-start gap-6 sm:gap-7" gap={0.08}>
          <StaggerItem>
            <span className="inline-flex items-center gap-2 rounded-full border border-forest/30 bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-forest sm:text-xs">
              <Recycle className="size-4" strokeWidth={2} aria-hidden />
              Doorstep scrap pickup in Jorhat
            </span>
          </StaggerItem>
          <StaggerItem><WasteToWealth /></StaggerItem>
          <StaggerItem as="p" className="max-w-[34ch] text-lg font-light leading-relaxed text-muted sm:text-xl">
            We buy your scrap at your door in Jorhat and pay on the spot.
          </StaggerItem>
          <StaggerItem className="flex w-full flex-col gap-5 pt-1 sm:w-auto sm:flex-row sm:items-center sm:gap-8">
            <Link href="/account" className={cn(btn.base, btn.primary)}>
              Sell your scrap <ArrowRight className="size-4" aria-hidden />
            </Link>
            <VendorLink className="self-center border-b-2 border-gold pb-1 text-xs font-bold uppercase tracking-[0.15em] text-forest transition-colors duration-200 hover:text-navy sm:self-auto" />
          </StaggerItem>
        </Stagger>

        <ProcessRing className="max-w-[440px] sm:max-w-[560px] lg:max-w-[600px]" />
      </div>
    </section>
  );
}
