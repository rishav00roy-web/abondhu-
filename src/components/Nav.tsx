"use client";

import { Brand, Container } from "./ui";

const LINKS = [
  ["#rates", "Rates"],
  ["#how", "How it works"],
  ["#impact", "Where it goes"],
  ["#estates", "For business"],
  ["#faq", "Questions"],
] as const;

export function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-midnight pt-[env(safe-area-inset-top)] shadow-md">
      <Container className="flex h-16 items-center gap-8">
        <a href="#top" aria-label="Abondhu home">
          <Brand light />
        </a>
        <nav aria-label="Main" className="ml-auto hidden gap-7 text-sm font-medium lg:flex">
          {LINKS.map(([href, label]) => (
            <a key={href} href={href} className="text-white/80 transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <a href="#book" className="ml-auto inline-flex h-10 items-center whitespace-nowrap rounded-lg border-2 border-white px-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white transition-colors hover:bg-white hover:text-midnight sm:px-5 lg:ml-0">
          Book pickup
        </a>
      </Container>
    </header>
  );
}
