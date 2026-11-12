import { IndianRupee, Recycle, Scale, Truck, type LucideIcon } from "lucide-react";
import { cn, delay } from "@/lib/utils";

/*
 * The hero's one picture: the pickup as a loop of four arrows, read clockwise from the top.
 * Pickup, weigh, pay, recycle, and back round as new material. One word per step here;
 * the detail lives in the How it works section below.
 * Entrance is plain CSS (.hero-* in globals.css): it plays from the first paint, without JavaScript.
 */
const SIZE = 720;
const C = SIZE / 2;
const R_OUT = 285;
const R_IN = 188;
const R_MID = (R_OUT + R_IN) / 2;

function pt(deg: number, r: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
}
const f = (n: number) => n.toFixed(1);

/** One arrow-shaped ring segment: notched at the start, pointed at the end. */
function arrow(a0: number, a1: number, tip = 7) {
  const [x0, y0] = pt(a0, R_OUT);
  const [x1, y1] = pt(a1, R_OUT);
  const [tx, ty] = pt(a1 + tip, R_MID);
  const [x2, y2] = pt(a1, R_IN);
  const [x3, y3] = pt(a0, R_IN);
  const [nx, ny] = pt(a0 + tip, R_MID);
  return `M${f(x0)} ${f(y0)} A${R_OUT} ${R_OUT} 0 0 1 ${f(x1)} ${f(y1)} L${f(tx)} ${f(ty)} L${f(x2)} ${f(y2)} A${R_IN} ${R_IN} 0 0 0 ${f(x3)} ${f(y3)} L${f(nx)} ${f(ny)} Z`;
}

const STEPS: { word: string; icon: LucideIcon; fill: string; place: string; align: string }[] = [
  { word: "Pickup", icon: Truck, fill: "var(--sand)", place: "right-0 top-0", align: "items-end text-right" },
  { word: "Weigh", icon: Scale, fill: "var(--navy)", place: "right-0 bottom-0", align: "items-end text-right" },
  { word: "Pay", icon: IndianRupee, fill: "var(--gold)", place: "left-0 bottom-0", align: "items-start" },
  { word: "Recycle", icon: Recycle, fill: "var(--forest)", place: "left-0 top-0", align: "items-start" },
];

export function ProcessRing({ className }: { className?: string }) {
  return (
    <figure className={cn("relative mx-auto aspect-square w-full max-w-[600px]", className)} aria-label="How a pickup works: pickup, weigh, pay, recycle">
      {/* dotted orbit on its own layer: turning a whole layer is cheap, turning an SVG shape repaints every frame */}
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="ring-spin absolute inset-0 size-full overflow-visible" aria-hidden>
        <circle
          cx={C}
          cy={C}
          r={R_OUT + 22}
          fill="none"
          stroke="rgb(10 37 64 / 0.22)"
          strokeWidth={1.5}
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
      </svg>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
        {STEPS.map((s, i) => (
          <path key={s.word} d={arrow(i * 90 + 2, i * 90 + 86)} fill={s.fill} className="hero-pop origin-center" style={delay(0.35 + i * 0.14)} />
        ))}
        <circle cx={C} cy={C} r={R_IN - 16} fill="#fff" />
      </svg>

      {/* icon chips sit on each arrow */}
      {STEPS.map(({ word, icon: Icon }, i) => {
        const [x, y] = pt(i * 90 + 45, R_MID);
        return (
          <span
            key={word}
            aria-hidden
            className="hero-pop absolute grid size-[13%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-navy shadow-[0_14px_24px_-12px_rgb(6_23_39_/_0.55)]"
            style={{ left: `${(x / SIZE) * 100}%`, top: `${(y / SIZE) * 100}%`, ...delay(0.47 + i * 0.14) }}
          >
            <Icon className="size-[44%]" strokeWidth={1.75} />
          </span>
        );
      })}

      {/* centre */}
      <div className="absolute inset-0 grid place-content-center justify-items-center text-center" aria-hidden>
        <span className="hero-turn text-gold" style={delay(0.9)}>
          <Recycle className="size-[clamp(32px,7vw,52px)]" strokeWidth={1.6} />
        </span>
        <span className="mt-2 font-serif text-[clamp(18px,3.4vw,26px)] text-navy sm:mt-3">Waste to wealth</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-forest sm:text-[11px]">Jorhat</span>
      </div>

      {/* step words in the four corners, a real list for screen readers */}
      <ol className="absolute -inset-2 sm:-inset-6">
        {STEPS.map((s, i) => (
          <li
            key={s.word}
            className={cn("hero-up absolute flex flex-col gap-1.5 sm:gap-2", s.place, s.align)}
            style={delay(0.6 + i * 0.14)}
          >
            <span className="grid size-6 place-items-center rounded-full bg-navy font-mono text-[11px] text-gold sm:size-7 sm:text-xs" aria-hidden>
              {i + 1}
            </span>
            <span className="font-serif text-lg font-semibold text-navy sm:text-2xl">{s.word}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}
