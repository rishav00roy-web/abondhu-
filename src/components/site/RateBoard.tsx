"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CATEGORIES, type CategoryKey, RATES, SAMPLE_ESTIMATE } from "@/lib/site-data";
import { cn, EASE_OUT, inr } from "@/lib/utils";
import { Stagger, StaggerItem } from "./motion";
import { TornEdge } from "./TornEdge";
import { btn, Container, SectionHead } from "./ui";

function Payout({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => inr(Math.round(v)));
  useEffect(() => {
    if (reduce) return void mv.set(value);
    const c = animate(mv, value, { duration: 0.25, ease: EASE_OUT });
    return () => c.stop();
  }, [value, mv, reduce]);
  return <motion.span className="font-mono text-2xl font-medium tabular">{text}</motion.span>;
}

const stepBtn =
  "grid size-10 place-items-center rounded-sm text-muted transition-[background-color,color,transform] duration-150 hover:bg-white hover:text-navy active:scale-[0.88] sm:size-8";

export function RateBoard() {
  const [qty, setQty] = useState<Record<string, number>>(SAMPLE_ESTIMATE);
  const set = (id: string, v: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.round(v * 10) / 10) }));

  const chosen = RATES.filter((r) => (qty[r.id] ?? 0) > 0);
  const total = chosen.reduce((s, r) => s + qty[r.id] * r.price, 0);
  const kg = Math.round(chosen.filter((r) => r.unit === "kg").reduce((s, r) => s + qty[r.id], 0) * 10) / 10;
  const pcs = chosen.filter((r) => r.unit === "pc").reduce((s, r) => s + qty[r.id], 0);

  return (
    <section id="rates" className="relative scroll-mt-20 bg-sunk py-20 md:py-32">
      <TornEdge className="text-sunk" />
      <Container>
        <SectionHead title="Today's rates" eyebrow="Fair, published prices">
          Per kilogram unless marked per piece. Add rough amounts to see what a pickup would pay. The scale sets the final figure.
        </SectionHead>

        <Stagger className="grid gap-x-16 gap-y-10 md:grid-cols-2 md:gap-y-12" gap={0.1}>
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
            <StaggerItem key={key}>
              <h3 className="mb-4 flex items-center gap-3 border-b border-navy/10 pb-3 font-serif text-2xl text-navy">
                <span className="size-2 rounded-full" style={{ background: CATEGORIES[key].color }} />
                {CATEGORIES[key].name}
              </h3>
              <ul className="grid gap-1">
                {RATES.filter((r) => r.category === key).map((r) => {
                  const q = qty[r.id] ?? 0;
                  return (
                    <li key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-0.5 sm:gap-4 sm:py-1.5">
                      <span className="text-[15px]">{r.name}</span>
                      <span className="font-mono text-[15px] tabular">
                        {inr(r.price)}
                        <span className="text-faint">/{r.unit === "kg" ? "kg" : "pc"}</span>
                      </span>
                      <span className="flex items-center">
                        <button type="button" aria-label={`Less ${r.name}`} onClick={() => set(r.id, q - 1)} className={stepBtn}>
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <input
                          id={`q-${r.id}`}
                          inputMode="decimal"
                          aria-label={`${r.name}, ${r.unit === "kg" ? "kilograms" : "pieces"}`}
                          placeholder="0"
                          value={q ? String(q) : ""}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setQty((s) => ({ ...s, [r.id]: Number.isNaN(v) ? 0 : Math.max(0, v) }));
                          }}
                          className={cn(
                            "h-10 w-11 rounded-sm bg-transparent text-center font-mono text-base tabular focus:bg-white focus:outline-none sm:h-8 sm:w-10 sm:text-sm",
                            q ? "text-ink" : "text-faint",
                          )}
                        />
                        <button type="button" aria-label={`More ${r.name}`} onClick={() => set(r.id, q + 1)} className={stepBtn}>
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </StaggerItem>
          ))}
        </Stagger>

        <div
          aria-live="polite"
          className="sticky bottom-[max(12px,env(safe-area-inset-bottom))] z-10 -mx-2 mt-12 flex items-center justify-between gap-3 rounded-sm bg-navy py-3 pl-4 pr-3 text-white shadow-2xl sm:mx-0 sm:mt-14 sm:gap-4 sm:px-6 sm:py-4"
        >
          <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70">Estimated payout</span>
            <Payout value={total} />
            <span className="hidden text-sm font-light text-white/60 sm:inline">
              {chosen.length === 0
                ? "Add an item to start"
                : `${kg} kg${pcs ? ` and ${pcs} piece${pcs > 1 ? "s" : ""}` : ""}, sample rates`}
            </span>
          </div>
          <a href="#book" className={cn(btn.gold, "inline-flex h-12 shrink-0 items-center rounded-sm px-5 text-xs font-bold uppercase tracking-[0.15em] transition-[background-color,transform] duration-200 active:scale-[0.97] sm:px-8")}>Book pickup</a>
        </div>
      </Container>
    </section>
  );
}
