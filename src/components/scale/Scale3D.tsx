"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { type CSSProperties, type ReactNode, useRef } from "react";
import { useReducedSafe } from "@/lib/use-reduced";
import { ScaleDisplay } from "./ScaleDisplay";

/*
 * The LED scale as a real 3D object, built from CSS boxes (no 3D library): a moulded base, a
 * stainless steel pan, a short pole and the LED head on top. It tilts toward the pointer on desktop,
 * turns a little with scroll on phones, and the pan dips while something is being weighed.
 * Reduced motion: a fixed three-quarter view.
 */

type Faces = Partial<Record<"front" | "back" | "left" | "right" | "top" | "bottom", string>>;

/** A w × h × d box centred on its own position. `front` children sit on the front face. */
function Box({ w, h, d, faces, style, children }: { w: number; h: number; d: number; faces: Faces; style?: CSSProperties; children?: ReactNode }) {
  const face = (cls: string | undefined, fw: number, fh: number, t: string, kids?: ReactNode) =>
    cls === undefined ? null : (
      <div className={`absolute ${cls}`} style={{ width: fw, height: fh, left: (w - fw) / 2, top: (h - fh) / 2, transform: t, backfaceVisibility: "hidden" }}>
        {kids}
      </div>
    );
  return (
    <div className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]" style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, ...style }}>
      {face(faces.front, w, h, `translateZ(${d / 2}px)`, children)}
      {face(faces.back, w, h, `rotateY(180deg) translateZ(${d / 2}px)`)}
      {face(faces.right, d, h, `rotateY(90deg) translateZ(${w / 2}px)`)}
      {face(faces.left, d, h, `rotateY(-90deg) translateZ(${w / 2}px)`)}
      {face(faces.top, w, d, `rotateX(90deg) translateZ(${h / 2}px)`)}
      {face(faces.bottom, w, d, `rotateX(-90deg) translateZ(${h / 2}px)`)}
    </div>
  );
}

const plastic = { front: "bg-[#1a1d1b]", back: "bg-[#121413]", left: "bg-[#0d0f0e]", right: "bg-[#0d0f0e]", top: "bg-[#2a2e2b]", bottom: "bg-[#080909]" };
const steel = {
  front: "bg-gradient-to-b from-[#c9ccc8] to-[#8e938f]",
  left: "bg-[#9a9f9b]",
  right: "bg-[#9a9f9b]",
  top: "bg-[linear-gradient(115deg,#f4f5f2_0%,#c3c7c3_30%,#eef0ec_48%,#aeb3ae_70%,#e4e6e2_100%)] shadow-[inset_0_0_0_2px_rgb(255_255_255/0.5),inset_0_0_0_3px_rgb(0_0_0/0.12)]",
};

export function Scale3D(props: Parameters<typeof ScaleDisplay>[0]) {
  const reduce = useReducedSafe();
  const ref = useRef<HTMLDivElement>(null);

  // pointer tilt (desktop) and scroll turn (phones), both eased by a spring
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scrollTurn = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const ry = useSpring(useTransform(() => -22 + px.get() * 18 + scrollTurn.get()), { stiffness: 80, damping: 18 });
  const rx = useSpring(useTransform(() => -14 - py.get() * 8), { stiffness: 80, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const weighing = !props.stable;

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="relative mx-auto h-[360px] w-full max-w-[560px] [perspective:1600px] sm:h-[500px]"
    >
      <motion.div
        className="absolute left-1/2 top-1/2 origin-center scale-[0.58] [transform-style:preserve-3d] sm:scale-[0.85] md:scale-100"
        style={reduce ? { rotateX: -14, rotateY: -22 } : { rotateX: rx, rotateY: ry }}
      >
        {/* floor shadow */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[340px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-[40%] bg-black/35 blur-2xl"
          style={{ transform: "translateY(150px) rotateX(90deg)" }}
        />
        {/* base */}
        <Box w={460} h={64} d={310} faces={plastic} style={{ transform: "translateY(150px)" }}>
          <div className="flex h-full items-center justify-between px-6">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">Calibrated · 150 kg max</span>
            <span className="flex gap-2" aria-hidden>
              {["Tare", "Zero", "Unit"].map((k) => (
                <span key={k} className="rounded-sm bg-[#2c302d] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-white/60 shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]">
                  {k}
                </span>
              ))}
            </span>
          </div>
        </Box>
        {/* steel pan: dips while weighing */}
        <motion.div
          className="absolute left-1/2 top-1/2 [transform-style:preserve-3d]"
          animate={{ y: weighing && !reduce ? 4 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
        >
          <Box w={420} h={14} d={270} faces={steel} style={{ transform: "translateY(109px) translateZ(14px)" }} />
        </motion.div>
        {/* pole */}
        <Box w={30} h={120} d={30} faces={plastic} style={{ transform: "translateY(58px) translateZ(-125px)" }} />
        {/* LED head */}
        <Box w={460} h={262} d={44} faces={plastic} style={{ transform: "translateY(-125px) translateZ(-125px) rotateX(8deg)" }}>
          <ScaleDisplay {...props} className="h-full w-full !shadow-none" />
        </Box>
      </motion.div>
    </div>
  );
}
