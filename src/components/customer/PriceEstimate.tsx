"use client";

// Price estimate for the booking form, shown once a weight is typed: estimated weight x the sample dealer rate, printed as a receipt.
// Abondhu does not buy scrap; the dealer weighs it at the door and sets the real price.
import { useEffect, useState } from "react";
import { estimatePrice, KG_RATE_ID, parseKg, type SCRAP_TYPES } from "@/lib/booking";
import { useReducedSafe } from "@/lib/use-reduced";
import { BUY } from "@/lib/site-data";
import { inr } from "@/lib/utils";
import { PRINT_SECONDS, ReceiptPrinter, type ReceiptPrinterStage } from "./ReceiptPrinter";

const REAL_PRICE = "This is only an estimate. The real weight and price are set when the scrap dealer arrives and weighs your scrap.";

/** Sample rate per kg for a scrap kind, or null when it isn't priced by the kilo. */
function rateFor(scrap: string) {
  const id = KG_RATE_ID[scrap as (typeof SCRAP_TYPES)[number]];
  return BUY.find((b) => b.id === id && b.unit === "kg") ?? null;
}

export function PriceEstimate({ scrap, kgText }: { scrap: string; kgText: string }) {
  const reduce = useReducedSafe();
  const kg = parseKg(kgText);
  const rate = rateFor(scrap);
  // What was printed, so the slip disappears as soon as the scrap or weight changes.
  const [printed, setPrinted] = useState<{ scrap: string; kgText: string } | null>(null);
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const showing = printed?.scrap === scrap && printed.kgText === kgText;
  // Inputs changed: drop the old slip, so changing back doesn't bring it back without printing again.
  if (printed && !showing) setPrinted(null);

  useEffect(() => {
    if (!showing || stage === "complete") return;
    const t = setTimeout(() => setStage(stage === "processing" ? "printing" : "complete"), stage === "processing" ? 600 : PRINT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [showing, stage]);

  // Prints by itself a moment after the weight is typed (the pause lets them finish typing).
  useEffect(() => {
    if (!kg || !rate || showing) return;
    const t = setTimeout(() => {
      setStage(reduce ? "complete" : "processing");
      setPrinted({ scrap, kgText });
    }, 700);
    return () => clearTimeout(t);
  }, [kg, rate, showing, scrap, kgText, reduce]);

  const hint = !kgText.trim()
    ? null
    : !scrap
      ? "Choose what scrap it is to see a price estimate."
      : !rate
        ? "We can estimate paper, cardboard, plastic and iron. For this kind, the dealer tells you the price at your door."
        : !kg
          ? "Write the weight in kg, like 15."
          : null;

  return (
    <div className="grid gap-4 sm:col-span-2">
      {hint && <p role="status" className="text-sm text-muted">{hint}</p>}

      {showing && kg && rate && (
        <ReceiptPrinter.Root stage={stage} className="justify-self-start">
          <ReceiptPrinter.Machine>
            <ReceiptPrinter.Screen>
              <ReceiptPrinter.Status />
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>
          <ReceiptPrinter.Output>
            <ReceiptPrinter.Paper>
              <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-navy">Abondhu</p>
              <p className="mt-1 text-center text-[11px] uppercase tracking-[0.15em] text-muted">Price estimate</p>
              <hr className="my-4 border-dashed border-navy/25" />
              <p className="font-medium text-navy">{scrap}</p>
              <div className="mt-1 flex justify-between text-muted">
                <span>{kg} kg × {inr(rate.price)}/kg</span>
                <span>{inr(estimatePrice(kg, rate.price))}</span>
              </div>
              <hr className="my-4 border-dashed border-navy/25" />
              <div className="flex items-baseline justify-between text-navy">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em]">About</span>
                <span className="text-2xl font-bold">{inr(estimatePrice(kg, rate.price))}</span>
              </div>
              <hr className="my-4 border-dashed border-navy/25" />
              <p className="text-center text-[11px] leading-relaxed text-muted">Estimate only, at a sample rate. The dealer weighs it and sets the real price.</p>
            </ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>
      )}

      <p className="text-sm font-medium text-navy">{REAL_PRICE}</p>
    </div>
  );
}
