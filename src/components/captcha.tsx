"use client";
import { useEffect, useRef } from "react";

// "Are you human?" check (Cloudflare Turnstile) in front of every login-code and
// password login, so bots can't burn through our email and SMS limits.
// Off until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; then also switch it on in
// Supabase (Authentication > Attack Protection) with the matching secret key.
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** True when the site shows the check (the site key is set). */
export const CAPTCHA_ON = !!SITE_KEY;

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("captcha script failed"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * The check box. Hands its one-time token to `onToken` (undefined when it expires).
 * A token works only once: after each try, give the box a new `key` to get a fresh one.
 * Shows nothing while the site key is not set.
 */
export function Captcha({ onToken }: { onToken: (token: string | undefined) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  useEffect(() => {
    cb.current = onToken;
  });

  useEffect(() => {
    if (!SITE_KEY) return;
    let gone = false;
    let id: string | null = null;
    cb.current(undefined);
    loadScript()
      .then(() => {
        if (gone || !box.current || !window.turnstile) return;
        id = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: (t: string) => cb.current(t),
          "expired-callback": () => cb.current(undefined),
          "error-callback": () => cb.current(undefined),
        });
      })
      .catch(() => {});
    return () => {
      gone = true;
      if (id) window.turnstile?.remove(id);
    };
  }, []);

  return SITE_KEY ? <div ref={box} className="min-h-[65px]" /> : null;
}
