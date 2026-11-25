"use client";

// A small receipt printer: the screen shows what it is doing, then a paper slip feeds out.
// Adapted from Rishav's ReceiptPrinter to the site: framer-motion, lucide icons, the navy/gold palette,
// no texture images. Compound parts: Root > Machine > Screen > Status, then Output > Paper.
import { CheckCircle2, LoaderCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { type ComponentPropsWithoutRef, createContext, useContext } from "react";
import { useReducedSafe } from "@/lib/use-reduced";
import { cn } from "@/lib/utils";

export type ReceiptPrinterStage = "processing" | "printing" | "complete";

type Ctx = { move: boolean; stage: ReceiptPrinterStage };
const PrinterContext = createContext<Ctx | null>(null);

const easeOut = [0.23, 1, 0.32, 1] as const;

/** Torn (zig-zag) bottom edge for the paper. */
const TEETH = 40;
const DEPTH = 4;
const toothPoints = Array.from({ length: TEETH * 2 }, (_, i) => {
  const x = 100 - ((i + 1) * 100) / (TEETH * 2);
  return `${x}% ${i % 2 === 0 ? "100%" : `calc(100% - ${DEPTH}px)`}`;
}).join(", ");
const paperClip = `polygon(0 0, 100% 0, 100% calc(100% - ${DEPTH}px), ${toothPoints})`;

/** The paper feeds out one line at a time: move, pause, move, pause. */
const feedSteps = ["-100%", "-91%", "-91%", "-81%", "-81%", "-70%", "-70%", "-58%", "-58%", "-45%", "-45%", "-32%", "-32%", "-20%", "-20%", "-10%", "-10%", "-3%", "-3%", "0%"];
const feedTimes = [0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6, 0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1];
/** How long the paper takes to feed out; the caller waits this long before "complete". */
export const PRINT_SECONDS = 1.75;

const labels: Record<ReceiptPrinterStage, string> = {
  processing: "Working it out",
  printing: "Printing your estimate",
  complete: "Estimate ready",
};

function usePrinter(part: string) {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error(`${part} must be used inside ReceiptPrinter.Root.`);
  return ctx;
}

function Root({ stage, className, children, ...props }: ComponentPropsWithoutRef<"section"> & { stage: ReceiptPrinterStage }) {
  const move = !useReducedSafe();
  return (
    <PrinterContext.Provider value={{ move, stage }}>
      <section aria-label="Price estimate" data-stage={stage} className={cn("relative isolate flex w-full max-w-sm flex-col items-center", className)} {...props}>
        {children}
      </section>
    </PrinterContext.Provider>
  );
}

function Machine({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "relative isolate w-full rounded-2xl border border-midnight bg-navy p-3 pb-8 shadow-[0_20px_36px_-20px_rgb(6_23_39/0.6),inset_0_1px_0_rgb(255_255_255/0.1)]",
        className,
      )}
      {...props}
    >
      {children}
      {/* the paper slot */}
      <div aria-hidden className="absolute inset-x-6 bottom-3 z-40 h-2 rounded-[3px] bg-midnight shadow-inner shadow-black" />
    </div>
  );
}

function Screen({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-midnight bg-midnight px-4 py-3 text-cream shadow-[inset_0_0_24px_4px_rgb(0_0_0/0.45)]", className)} {...props}>
      {children}
    </div>
  );
}

function Status({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  const { move, stage } = usePrinter("ReceiptPrinter.Status");
  const done = stage === "complete";
  const fade = (from: number) => ({
    initial: { opacity: move ? 0 : 1, y: move ? from : 0 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: move ? 0 : 1, y: move ? -from : 0 },
    transition: { duration: move ? 0.18 : 0, ease: easeOut },
  });
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} {...props}>
      <span aria-hidden className="grid size-5 shrink-0 place-items-center">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span key={done ? "done" : "busy"} {...fade(0)} className={cn("col-start-1 row-start-1 grid place-items-center", done ? "text-gold" : "text-cream/70")}>
            {done ? <CheckCircle2 className="size-[18px]" /> : <LoaderCircle className="size-[18px] animate-spin motion-reduce:animate-none" />}
          </motion.span>
        </AnimatePresence>
      </span>
      <div role="status" aria-live="polite" className="grid min-w-0 flex-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div key={stage} {...fade(4)} className="col-start-1 row-start-1 truncate font-mono text-xs font-medium uppercase tracking-[0.12em] text-cream/80">
            {labels[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Output({ className, children, ...props }: ComponentPropsWithoutRef<"div">) {
  const { move, stage } = usePrinter("ReceiptPrinter.Output");
  const visible = stage !== "processing";
  const feeding = stage === "printing" && move;
  return (
    <div className={cn("relative z-50 -mt-4 w-[calc(80%+3rem)] max-w-full overflow-hidden px-6 pb-3", className)} {...props}>
      {visible && <div aria-hidden className="pointer-events-none absolute inset-x-6 -top-1 z-20 h-2 bg-midnight/70 blur-[6px]" />}
      <motion.div
        initial={false}
        animate={{ opacity: visible ? 1 : 0, y: feeding ? feedSteps : visible || !move ? "0%" : "-100%" }}
        transition={{
          opacity: { duration: move ? 0.16 : 0, ease: easeOut },
          y: { duration: move ? PRINT_SECONDS : 0, ease: "linear", times: feeding ? feedTimes : undefined },
        }}
        aria-hidden={stage !== "complete"}
        className="relative drop-shadow-[0_8px_16px_rgb(10_37_64/0.18)]"
      >
        {children}
      </motion.div>
    </div>
  );
}

function Paper({ className, style, children, ...props }: ComponentPropsWithoutRef<"article">) {
  return (
    <article className={cn("relative bg-white px-6 pb-8 pt-6 font-mono text-[13px] text-ink", className)} style={{ clipPath: paperClip, ...style }} {...props}>
      {children}
    </article>
  );
}

export const ReceiptPrinter = { Root, Machine, Screen, Status, Output, Paper };
