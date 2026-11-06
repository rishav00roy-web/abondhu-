"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Brand, btn, Container } from "./ui";

const LINKS = [
  ["#rates", "Rates"],
  ["#how", "How it works"],
  ["#estates", "Tea estates and business"],
  ["#faq", "Questions"],
] as const;

export function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 8;
    if (next !== scrolled) setScrolled(next);
  });

  return (
    <header
      className={cn(
        "sticky top-[env(safe-area-inset-top)] z-50 border-b bg-bg/90 backdrop-blur-sm transition-colors duration-200",
        scrolled ? "border-line" : "border-transparent",
      )}
    >
      <Container className="flex h-16 items-center gap-8">
        <a href="#top" aria-label="Abondhu home">
          <Brand />
        </a>
        <nav aria-label="Main" className="ml-auto hidden gap-7 text-sm text-muted lg:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-ink">
              {label}
            </a>
          ))}
        </nav>
        <a href="#book" className={cn(btn.base, btn.primary, "ml-auto h-10 px-4 text-sm lg:ml-0")}>
          Book pickup
        </a>
      </Container>
    </header>
  );
}
