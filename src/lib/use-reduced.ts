"use client";

import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Reduced-motion preference that is safe for server rendering: false on the server and during
 * hydration (so server and browser HTML match), then the real preference.
 */
export function useReducedSafe(): boolean {
  const reduce = useReducedMotion();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  return hydrated && !!reduce;
}
