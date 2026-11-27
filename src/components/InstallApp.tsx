"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

// Chrome's install offer can come before the page's scripts have loaded, so a tiny
// script in the layout (INSTALL_CATCHER) catches it first and keeps it on window.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
declare global {
  interface Window {
    __installOffer?: InstallEvent | null;
  }
}

/** Inline script for the layout: holds Chrome's install offer and says when it changes. */
export const INSTALL_CATCHER = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__installOffer=e;dispatchEvent(new Event("abondhu-install"))});addEventListener("appinstalled",function(){window.__installOffer=null;dispatchEvent(new Event("abondhu-install"))});`;

/**
 * "Install app" button. Shows only when Chrome can install the site; opens Chrome's install prompt.
 * `label` is what screen readers hear; `text` is the visible part (may hide words on small screens).
 */
export function InstallApp({ className, label = "Install app", text }: { className: string; label?: string; text?: React.ReactNode }) {
  const [can, setCan] = useState(false);

  useEffect(() => {
    const update = () => setCan(!!window.__installOffer);
    window.addEventListener("abondhu-install", update);
    update();
    return () => window.removeEventListener("abondhu-install", update);
  }, []);

  if (!can) return null;

  const install = async () => {
    const e = window.__installOffer;
    if (!e) return;
    await e.prompt();
    await e.userChoice.catch(() => null);
    window.__installOffer = null; // Chrome allows one prompt per offer
    window.dispatchEvent(new Event("abondhu-install"));
  };

  return (
    <button type="button" onClick={install} aria-label={label} className={className}>
      <Download className="size-4 shrink-0" aria-hidden /> {text ?? label}
    </button>
  );
}
