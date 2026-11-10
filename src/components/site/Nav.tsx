"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SPRING_FAST } from "./motion";
import { Brand, Container } from "./ui";

const LINKS = [
  ["#rates", "Rates"],
  ["#how", "How it works"],
  ["#impact", "Where it goes"],
  ["#estates", "For business"],
  ["#faq", "Questions"],
  ["/partner", "Become a partner"],
] as const;

const bookBtn =
  "h-10 items-center whitespace-nowrap rounded-lg border-2 border-white px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-[background-color,color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-white hover:text-midnight active:scale-[0.97] sm:px-5";

export function Nav() {
  const reduce = useReducedMotion();
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
    <header className="sticky top-0 z-50 bg-midnight pt-[env(safe-area-inset-top)] shadow-md">
      <Container className="relative flex h-16 items-center gap-3 lg:gap-8">
        <a href="#top" aria-label="Abondhu home" className="mr-auto">
          <Brand light />
        </a>
        <nav aria-label="Main" className="hidden gap-7 text-sm font-medium lg:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-white/80 transition-colors duration-200 hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <a href="#book" className={`${bookBtn} hidden sm:inline-flex`}>
          Book pickup
        </a>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
          className="-mr-2 grid size-11 place-items-center text-white transition-transform duration-150 active:scale-[0.92] lg:hidden"
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
              className="absolute right-4 top-[calc(100%+8px)] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl lg:hidden"
            >
              {LINKS.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center border-b border-navy/5 px-5 text-sm font-semibold text-ink transition-colors active:bg-sunk"
                >
                  {label}
                </a>
              ))}
              <a
                href="#book"
                onClick={() => setOpen(false)}
                className="m-3 flex h-12 items-center justify-center rounded-sm bg-navy text-xs font-bold uppercase tracking-[0.15em] text-white active:scale-[0.98]"
              >
                Book a free pickup
              </a>
            </motion.nav>
          )}
        </AnimatePresence>
      </Container>
    </header>
  );
}
