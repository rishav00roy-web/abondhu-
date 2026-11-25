"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { GOOGLE_CLIENT_ID, USE_GOOGLE_BUTTON } from "@/lib/site-data";

/* Minimal typing for the bits of Google Identity Services we use. */
interface Gsi {
  accounts: {
    id: {
      initialize(o: { client_id: string; callback: (r: { credential: string }) => void; nonce: string; use_fedcm_for_button?: boolean }): void;
      renderButton(el: HTMLElement, o: Record<string, string | number>): void;
    };
  };
}
declare global {
  interface Window { google?: Gsi }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

/** Loads Google's sign-in script once; resolves false if it cannot load (blocked or offline). */
function loadGsi(): Promise<boolean> {
  if (window.google?.accounts?.id) return Promise.resolve(true);
  return new Promise((resolve) => {
    let s = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = GSI_SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve(!!window.google?.accounts?.id));
    s.addEventListener("error", () => resolve(false));
    setTimeout(() => resolve(!!window.google?.accounts?.id), 10_000);
  });
}

/** Random nonce, and its SHA-256 hex for Google (Supabase checks the raw one against the hash in the token). */
async function makeNonce() {
  const raw = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  return { raw, hashed };
}

/**
 * Google's own "Continue with Google" button. The Google window opens on abondhu.com and
 * says "Sign in to abondhu.com", instead of sending people through our Supabase address.
 * Shows `fallback` (the old redirect button) if Google's script cannot load.
 */
export function GoogleButton({ fallback, onError }: { fallback: React.ReactNode; onError: (msg: string) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">(USE_GOOGLE_BUTTON ? "loading" : "failed");

  useEffect(() => {
    if (!USE_GOOGLE_BUTTON) return;
    let live = true;
    (async () => {
      const ok = await loadGsi();
      if (!live) return;
      if (!ok || !box.current) return setState("failed");
      const { raw, hashed } = await makeNonce();
      if (!live || !box.current) return;
      const g = window.google!.accounts.id;
      g.initialize({
        client_id: GOOGLE_CLIENT_ID,
        nonce: hashed,
        use_fedcm_for_button: true,
        callback: async ({ credential }) => {
          onError("");
          const { error } = await getSupabase()!.auth.signInWithIdToken({ provider: "google", token: credential, nonce: raw });
          if (error) onError("Google sign-in did not work. Please try again, or get a code below.");
        },
      });
      g.renderButton(box.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        logo_alignment: "center",
        width: Math.min(400, box.current.offsetWidth || 320),
      });
      setState("ready");
    })();
    return () => { live = false; };
  }, [onError]);

  if (state === "failed") return <>{fallback}</>;
  return (
    // Fixed height so the page does not jump while Google's button loads.
    <div ref={box} className="flex h-12 w-full items-center justify-center" aria-busy={state === "loading"} />
  );
}
