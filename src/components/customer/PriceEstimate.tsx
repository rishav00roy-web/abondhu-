"use client";

// Itemised price estimate for the booking form: each item's estimated weight x the sample dealer rate,
// printed as a receipt when the customer taps "Generate estimated bill".
// Abondhu does not buy scrap; the dealer weighs it at the door and sets the real price.
import { ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { btn } from "@/components/site/ui";
import { estimatePrice, KG_RATE_ID, readItems, type ReadyItem, type SCRAP_TYPES, type ScrapItem } from "@/lib/booking";
import { useReducedSafe } from "@/lib/use-reduced";
import { BUY } from "@/lib/site-data";
import { cn, inr } from "@/lib/utils";
import { PRINT_SECONDS, ReceiptPrinter, type ReceiptPrinterStage } from "./ReceiptPrinter";

const REAL_PRICE = "This is only an estimate. The real weight and price are set when the scrap dealer arrives and weighs your scrap.";

/** Sample rate per kg for a scrap kind, or null when it isn't priced by the kilo (phones, appliances, mixed). */
function rateFor(scrap: string) {
  const id = KG_RATE_ID[scrap as (typeof SCRAP_TYPES)[number]];
  return BUY.find((b) => b.id === id && b.unit === "kg") ?? null;
}

const sameItems = (a: ScrapItem[], b: ScrapItem[]) => JSON.stringify(a) === JSON.stringify(b);

export function PriceEstimate({ items }: { items: ScrapItem[] }) {
  const reduce = useReducedSafe();
  // What was printed: the slip disappears as soon as any item changes, so it never shows an old bill.
  const [printed, setPrinted] = useState<{ typed: ScrapItem[]; ready: ReadyItem[] } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [stage, setStage] = useState<ReceiptPrinterStage>("processing");
  const showing = printed !== null && sameItems(printed.typed, items);
  if (printed && !showing) setPrinted(null);

  useEffect(() => {
    if (!showing || stage === "complete") return;
    const t = setTimeout(() => setStage(stage === "processing" ? "printing" : "complete"), stage === "processing" ? 600 : PRINT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [showing, stage]);

  const generate = () => {
    const r = readItems(items);
    if ("error" in r) {
      setProblem(r.error);
      return;
    }
    setProblem(null);
    setStage(reduce ? "complete" : "processing");
    setPrinted({ typed: items, ready: r.items });
  };

  const lines = (printed?.ready ?? []).map((it) => {
    const rate = rateFor(it.scrap);
    return { ...it, rate: rate?.price ?? null, price: rate ? estimatePrice(it.kg, rate.price) : null };
  });
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0), 0);
  const priced = lines.some((l) => l.price !== null);
  const atDoor = lines.some((l) => l.price === null);

  return (
    <div className="grid gap-4 sm:col-span-2">
      {/* may wrap to two lines on small phones instead of spilling out of the card */}
      <button type="button" onClick={generate} className={cn(btn.base.replace("whitespace-nowrap", "text-center"), btn.quiet, "justify-self-start")}>
        <ReceiptText className="size-4" aria-hidden /> Generate estimated bill
      </button>
      {problem && <p role="alert" className="text-sm text-danger">{problem}</p>}

      {showing && (
        <ReceiptPrinter.Root stage={stage} className="justify-self-start">
          <ReceiptPrinter.Machine>
            <ReceiptPrinter.Screen>
              <ReceiptPrinter.Status />
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>
          <ReceiptPrinter.Output>
            <ReceiptPrinter.Paper>
              <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-navy">Abondhu</p>
              <p className="mt-1 text-center text-[11px] uppercase tracking-[0.15em] text-muted">Estimate bill</p>
              <hr className="my-4 border-dashed border-navy/25" />
              <ul className="grid gap-3">
                {lines.map((l, i) => (
                  <li key={i}>
                    <p className="font-medium text-navy">{l.name}</p>
                    <div className="mt-0.5 flex justify-between gap-3 text-muted">
                      <span>{l.rate !== null ? `${l.kg} kg × ${inr(l.rate)}/kg` : `${l.kg} kg`}</span>
                      <span className="text-right">{l.price !== null ? inr(l.price) : "At the door"}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <hr className="my-4 border-dashed border-navy/25" />
              {priced ? (
                <div className="flex items-baseline justify-between text-navy">
                  <span className="text-[11px] font-bold uppercase tracking-[0.15em]">Total about</span>
                  <span className="text-2xl font-bold">{inr(total)}</span>
                </div>
              ) : (
                <p className="text-center font-medium text-navy">The dealer tells you the price at your door.</p>
              )}
              {priced && atDoor && <p className="mt-2 text-[11px] text-muted">Plus the items priced at the door.</p>}
              <hr className="my-4 border-dashed border-navy/25" />
              <p className="text-center text-[11px] leading-relaxed text-muted">Estimate only, at sample rates. The dealer weighs it and sets the real price.</p>
            </ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>
      )}

      <p className="text-sm font-medium text-navy">{REAL_PRICE}</p>
    </div>
  );
}
