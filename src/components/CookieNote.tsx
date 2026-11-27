"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "abondhu-cookie-ok";

/** One-line cookie note at the bottom. "OK" hides it for good on this browser. */
export function CookieNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = localStorage.getItem(KEY) === "1";
    } catch {}
    // Shown only after load, so the server page and the first browser render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!seen) setShow(true);
  }, []);

  if (!show) return null;

  const ok = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
    setShow(false);
  };

  return (
    <div role="region" aria-label="Cookies" className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-xl items-center gap-3 rounded-lg bg-midnight px-4 py-3 text-sm text-white shadow-lg">
      <p className="flex-1 leading-snug">
        We only use cookies that keep you logged in.{" "}
        <Link href="/privacy" className="text-gold underline">Privacy</Link>
      </p>
      <button type="button" onClick={ok} className="min-h-11 shrink-0 rounded-md bg-gold px-5 font-bold text-midnight focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
        OK
      </button>
    </div>
  );
}
