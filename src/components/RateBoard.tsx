"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CATEGORIES, type CategoryKey, RATES, SAMPLE_ESTIMATE } from "@/lib/data";
import { cn, EASE_OUT, inr } from "@/lib/utils";
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
  "grid size-8 place-items-center rounded-[8px] text-muted transition-colors hover:bg-sunk hover:text-ink active:scale-90";

export function RateBoard() {
  const [qty, setQty] = useState<Record<string, number>>(SAMPLE_ESTIMATE);
  const set = (id: string, v: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.round(v * 10) / 10) }));

  const chosen = RATES.filter((r) => (qty[r.id] ?? 0) > 0);
  const total = chosen.reduce((s, r) => s + qty[r.id] * r.price, 0);
  const kg = Math.round(chosen.filter((r) => r.unit === "kg").reduce((s, r) => s + qty[r.id], 0) * 10) / 10;
  const pcs = chosen.filter((r) => r.unit === "pc").reduce((s, r) => s + qty[r.id], 0);

  return (
    <section id="rates" className="scroll-mt-24 py-[clamp(64px,9vw,112px)]">
      <Container>
        <SectionHead title="Today's rates">
          Per kilogram unless marked per piece. Add rough amounts to see what a pickup would pay. The scale sets the final figure.
        </SectionHead>

        <div className="grid gap-x-16 gap-y-12 md:grid-cols-2">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
            <div key={key}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
                <span className="size-2 rounded-full" style={{ background: CATEGORIES[key].color }} />
                {CATEGORIES[key].name}
              </h3>
              <ul className="grid gap-1">
                {RATES.filter((r) => r.category === key).map((r) => {
                  const q = qty[r.id] ?? 0;
                  return (
                    <li key={r.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 rounded-[10px] py-1.5 pl-0 pr-0">
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
                            "h-8 w-10 rounded-[8px] bg-transparent text-center font-mono text-sm tabular focus:bg-sunk focus:outline-none",
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
            </div>
          ))}
        </div>

        <div
          aria-live="polite"
          className="sticky bottom-[max(16px,env(safe-area-inset-bottom))] z-10 mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-line bg-surface/95 px-5 py-4 shadow-soft backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-sm text-muted">Estimated payout</span>
            <Payout value={total} />
            <span className="text-sm text-faint">
              {chosen.length === 0
                ? "Add an item to start"
                : `${kg} kg${pcs ? ` and ${pcs} piece${pcs > 1 ? "s" : ""}` : ""}, sample rates`}
            </span>
          </div>
          <a href="#book" className={cn(btn.base, btn.primary)}>Book pickup</a>
        </div>
      </Container>
    </section>
  );
}
