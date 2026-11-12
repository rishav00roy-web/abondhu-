import { clsx, type ClassValue } from "clsx";
import type { CSSProperties } from "react";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

/** Shared easing: smooth deceleration, no overshoot (production polish). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Start delay for a CSS entrance animation (.hero-* classes in globals.css). */
export const delay = (seconds: number) => ({ "--d": `${seconds}s` }) as CSSProperties;
