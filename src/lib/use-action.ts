"use client";

import { useCallback, useRef, useState } from "react";

/** Runs one async action at a time and keeps its error message for the screen. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const running = useRef(false); // blocks a second tap that lands before the button re-renders as busy
  const run = useCallback(async (fn: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, err, run };
}
