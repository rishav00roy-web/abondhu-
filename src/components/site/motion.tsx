"use client";

import { motion, type Variants } from "framer-motion";
import { useReducedSafe } from "@/lib/use-reduced";
import type { ReactNode } from "react";

/*
 * Motion vocabulary for the page (marketing site: Jakub's production polish first,
 * Emil's restraint for forms, nav and steppers).
 *  - Arrivals: opacity + 10px rise + 4px blur, a zero-bounce spring, once per element.
 *  - Siblings stagger by 70ms so a row reads left to right instead of popping at once.
 *  - Exits are smaller than entrances. Steppers and other repeated taps get press feedback only.
 *  - Reduced motion: everything renders in its final state.
 */
export const SPRING = { type: "spring", duration: 0.6, bounce: 0 } as const;
export const SPRING_FAST = { type: "spring", duration: 0.35, bounce: 0 } as const;

// amount 0 + bottom margin: tall lists on phones still trigger as soon as their top is well inside the screen
const VIEWPORT = { once: true, amount: 0, margin: "0px 0px -12% 0px" } as const;

export const rise: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  shown: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPRING },
};

type Tag = "div" | "section" | "ol" | "ul" | "li" | "p" | "h2" | "span";

/** One element that rises into place the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: Tag;
}) {
  const reduce = useReducedSafe();
  const M = motion[as];
  // Same element on server and client; reduced motion just snaps to the final state.
  return (
    <M
      className={className}
      initial="hidden"
      {...(reduce ? { animate: "shown" } : { whileInView: "shown", viewport: VIEWPORT })}
      variants={{
        hidden: rise.hidden,
        shown: { ...rise.shown, transition: reduce ? { duration: 0 } : { ...SPRING, delay } },
      }}
    >
      {children}
    </M>
  );
}

/** A list whose children (StaggerItem) arrive one after another. */
export function Stagger({
  children,
  className,
  as = "div",
  gap = 0.07,
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
  gap?: number;
}) {
  const reduce = useReducedSafe();
  const M = motion[as];
  return (
    <M
      className={className}
      initial="hidden"
      {...(reduce ? { animate: "shown" } : { whileInView: "shown", viewport: VIEWPORT })}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: reduce ? 0 : gap } } }}
    >
      {children}
    </M>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: ReactNode; className?: string; as?: Tag }) {
  const M = motion[as];
  return (
    <M className={className} variants={rise}>
      {children}
    </M>
  );
}
