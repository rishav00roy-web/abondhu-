"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Leaf } from "lucide-react";
import { useEffect } from "react";
import { CATEGORIES, RECEIPT } from "@/lib/site-data";
import { EASE_OUT } from "@/lib/utils";

/*
 * The page's one authored moment: the slip prints line by line while the scale
 * reading climbs to each running total, then PAID is stamped. It shows the
 * promise (fair weight, instant payment) instead of stating it.
 */
const ROW_START = 0.45;
const ROW_GAP = 0.3;
const TOTAL_AT = ROW_START + RECEIPT.length * ROW_GAP + 0.2;
const totalKg = RECEIPT.reduce((s, r) => s + r.kg, 0);
const totalRs = RECEIPT.reduce((s, r) => s + r.kg * r.rate, 0);
const money = (n: number) => "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function WeighingReceipt() {
  const reduce = useReducedMotion();
  const kg = useMotionValue(0);
  const reading = useTransform(kg, (v) => v.toFixed(2));

  useEffect(() => {
    if (reduce) {
      kg.set(totalKg);
      return;
    }
    let running = 0;
    const controls = RECEIPT.map((row, i) => {
      running += row.kg;
      return animate(kg, running, { delay: ROW_START + i * ROW_GAP + 0.1, duration: 0.4, ease: EASE_OUT });
    });
    return () => controls.forEach((c) => c.stop());
  }, [kg, reduce]);

  const enter = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 6, filter: "blur(3px)" },
          animate: { opacity: 1, y: 0, filter: "blur(0px)" },
          transition: { duration: 0.45, ease: EASE_OUT, delay },
        };

  return (
    <figure className="mx-auto w-full max-w-[380px] px-1 sm:px-0" aria-label="Example pickup receipt from Guwahati">
      <div className="receipt-edge rounded-t-sm bg-surface px-6 pb-8 pt-6 shadow-2xl">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] text-muted">On the scale</span>
          <span className="text-[13px] text-faint">±10 g</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2 border-b border-line pb-5">
          <motion.span className="font-mono text-[56px] font-medium leading-none tracking-[-0.04em] text-navy tabular">{reading}</motion.span>
          <span className="font-mono text-sm text-muted">kg</span>
        </div>

        <div className="mt-4 flex justify-between text-xs text-faint">
          <span>Pickup AB-20419, Beltola</span>
          <span>Sat 8 Nov, 10:42</span>
        </div>

        <div className="mt-3">
          {RECEIPT.map((row, i) => (
            <motion.div
              key={row.name}
              {...enter(ROW_START + i * ROW_GAP)}
              className="grid grid-cols-[8px_1fr_auto] items-baseline gap-3 py-[7px] text-sm"
            >
              <span className="size-2 translate-y-[-1px] rounded-full" style={{ background: CATEGORIES[row.category].color }} />
              <span>
                {row.name}
                <span className="block font-mono text-xs text-faint min-[420px]:ml-2 min-[420px]:inline">
                  {row.kg} kg × ₹{row.rate}
                </span>
              </span>
              <span className="font-mono text-[13px] tabular">{money(row.kg * row.rate)}</span>
            </motion.div>
          ))}
        </div>

        <motion.div {...enter(TOTAL_AT)} className="mt-3 flex items-baseline justify-between border-t border-dashed border-line pt-4">
          <span className="text-sm text-muted">Paid by UPI</span>
          <span className="flex items-baseline gap-3">
            <motion.span
              initial={reduce ? false : { opacity: 0, scale: 1.25 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT, delay: reduce ? 0 : TOTAL_AT + 0.3 }}
              className="rounded-sm border border-forest px-1.5 py-0.5 text-[11px] font-bold tracking-[0.14em] text-forest"
            >
              PAID
            </motion.span>
            <b className="font-mono text-xl font-medium tabular">{money(totalRs)}</b>
          </span>
        </motion.div>
        <motion.p {...enter(TOTAL_AT + 0.5)} className="mt-4 flex items-center gap-2 text-xs font-medium text-forest">
          <Leaf className="size-3.5" aria-hidden />
          {totalKg.toFixed(1)} kg sent to licensed recyclers, not a dump
        </motion.p>
      </div>
    </figure>
  );
}
