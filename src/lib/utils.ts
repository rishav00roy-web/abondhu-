import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** Shared easing: smooth deceleration, no overshoot (production polish). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
