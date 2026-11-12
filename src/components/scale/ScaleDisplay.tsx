import { Segments } from "./Segments";

const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/**
 * The scale head: big weight readout, a smaller rate and amount row, and the "stable" lamp.
 * Pure presentation; the caller animates `weight`.
 */
export function ScaleDisplay({
  weight,
  unit,
  rate,
  amount,
  label,
  stable = true,
  className = "",
}: {
  weight: number;
  unit: "kg" | "pc";
  rate: number;
  amount: number;
  label: string;
  stable?: boolean;
  className?: string;
}) {
  const w = unit === "kg" ? weight.toFixed(2) : String(Math.round(weight));
  const unitLabel = unit === "kg" ? "kg" : "pcs";
  return (
    <figure
      className={`scale-head select-none p-3 text-[#c9ccc8] sm:p-4 ${className}`}
      aria-label={`Scale reads ${w} ${unitLabel} of ${label}: ${rate} rupees per ${unit === "kg" ? "kg" : "piece"}, ${inr.format(amount)} rupees`}
    >
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:text-[11px]">
        <span>Abondhu · Jorhat</span>
        <span className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${stable ? "lamp bg-[#3ddc6a]" : "bg-white/20"}`} aria-hidden />
          {stable ? "Stable" : "Weighing"}
        </span>
      </div>
      <div className="scale-glass grid grid-cols-[1fr_auto] items-end gap-2 px-3 pb-3 pt-4 sm:px-4">
        <Segments text={w} cells={5} className="h-auto w-full" />
        <span className="pb-1 text-sm font-bold text-[#ff3b2f]/80 sm:text-base">{unitLabel}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="scale-glass flex items-end justify-between gap-2 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">₹/{unit === "kg" ? "kg" : "pc"}</span>
          <Segments text={String(rate)} cells={4} className="h-6 w-auto sm:h-7" />
        </div>
        <div className="scale-glass flex items-end justify-between gap-2 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55">₹</span>
          <Segments text={String(Math.round(amount))} cells={5} className="h-6 w-auto sm:h-7" />
        </div>
      </div>
      <figcaption className="mt-2 truncate px-1 text-xs font-medium text-white/70">{label}</figcaption>
    </figure>
  );
}
