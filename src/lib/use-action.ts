"use client";

import { useCallback, useState } from "react";

/** Runs one async action at a time and keeps its error message for the screen. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = useCallback(async (fn: () => Promise<void>) => {
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, err, run };
}
