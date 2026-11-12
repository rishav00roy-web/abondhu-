"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedSafe } from "@/lib/use-reduced";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SPRING_FAST } from "./motion";
import { Brand } from "./ui";
import { VendorLink } from "./VendorLink";

const LINKS = [
  ["/#how", "How it works"],
  ["/#rates", "Rates"],
  ["/#faq", "Questions"],
] as const;

const bookBtn =
  "h-10 items-center whitespace-nowrap rounded-full bg-gold px-5 text-[11px] font-bold uppercase tracking-[0.15em] text-midnight transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-navy hover:text-white active:scale-[0.97]";

export function Nav({ vendorPage = false }: { vendorPage?: boolean }) {
  const reduce = useReducedSafe();
  const [open, setOpen] = useState(false);

  // close on Escape, and when the viewport grows past the menu breakpoint
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const icon = reduce
    ? {}
    : {
        initial: { opacity: 0, scale: 0.8, filter: "blur(3px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.8, filter: "blur(3px)" },
        transition: { duration: 0.15 },
      };

  return (
    // Floating glass pill. The header takes no height, so each page's first section
    // carries the top padding that keeps its content clear of the pill.
    <header className="sticky top-0 z-50 h-0 px-3 sm:px-6">
      <div className="relative top-[calc(env(safe-area-inset-top)+12px)] mx-auto flex h-14 max-w-6xl items-center gap-3 rounded-full border border-white/70 bg-white/55 pl-5 pr-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.9),0_16px_40px_-18px_rgb(6_23_39_/_0.35)] backdrop-blur-2xl backdrop-saturate-[1.8] sm:pl-6 lg:gap-8">
        <Link href="/" aria-label="Abondhu home" className="mr-auto">
          <Brand />
        </Link>
        <nav aria-label="Main" className="hidden gap-7 text-sm font-medium lg:flex">
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="draw pb-1 text-navy/80 hover:text-navy">
              {label}
            </Link>
          ))}
          <VendorLink aria-current={vendorPage ? "page" : undefined} className={`draw pb-1 text-forest ${vendorPage ? "bg-[length:100%_1px]" : ""}`} />
        </nav>
        <Link href="/account" className={`${bookBtn} hidden sm:inline-flex`}>
          Book pickup
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="grid size-10 place-items-center rounded-full text-navy transition-[background-color,transform] duration-150 hover:bg-navy/5 active:scale-[0.92] lg:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={open ? "x" : "menu"} {...icon} className="grid">
              {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
            </motion.span>
          </AnimatePresence>
        </button>

        <AnimatePresence>
          {open && (
            <motion.nav
              id="mobile-menu"
              aria-label="Mobile"
              style={{ transformOrigin: "top right" }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -6, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)", transition: SPRING_FAST }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
              className="absolute right-0 top-[calc(100%+8px)] w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-xl lg:hidden"
            >
              {LINKS.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center border-b border-navy/5 px-5 text-sm font-semibold text-ink transition-colors active:bg-sunk"
                >
                  {label}
                </Link>
              ))}
              <VendorLink
                onClick={() => setOpen(false)}
                className="flex min-h-12 items-center justify-between border-b border-navy/5 px-5 text-sm font-semibold text-forest active:bg-sunk"
              >
                <span aria-hidden className="text-gold">●</span>
              </VendorLink>
              <Link
                href="/account"
                onClick={() => setOpen(false)}
                className="m-3 flex h-12 items-center justify-center rounded-full bg-navy text-xs font-bold uppercase tracking-[0.15em] text-white active:scale-[0.98]"
              >
                Book a free pickup
              </Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
