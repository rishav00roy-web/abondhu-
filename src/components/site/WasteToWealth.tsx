"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SPRING } from "./motion";

/*
 * Signature moment: the headline crosses out "waste" and the word "wealth" settles in
 * below it, like a correction in a ledger. The full sentence is real text from the
 * first frame, so it reads the same with motion off.
 */
export function WasteToWealth() {
  const reduce = useReducedMotion();
  const letters = Array.from("wealth");
  return (
    <h1 className="font-serif text-[clamp(52px,7vw,92px)] leading-[1.02] tracking-[-0.01em] text-navy">
      From{" "}
      <span className="relative inline-block text-navy/40">
        waste
        <motion.span
          aria-hidden
          className="absolute left-[-3%] right-[-3%] top-[56%] h-[0.07em] origin-left rounded-full bg-gold"
          initial={reduce ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1], delay: reduce ? 0 : 0.9 }}
        />
      </span>
      <br />
      to{" "}
      <span className="inline-block whitespace-nowrap italic text-forest">
        {letters.map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={reduce ? false : { opacity: 0, y: "0.35em", filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ ...SPRING, delay: reduce ? 0 : 1.35 + i * 0.045 }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
      <br />
      again.
    </h1>
  );
}
