import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-7xl pl-[max(24px,env(safe-area-inset-left))] pr-[max(24px,env(safe-area-inset-right))] md:px-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Buttons follow the Willchris site: square corners, small uppercase tracked labels. */
export const btn = {
  base: "inline-flex h-14 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-9 text-xs font-bold uppercase tracking-[0.15em] transition-colors duration-200 active:scale-[0.98] disabled:opacity-50",
  primary: "bg-navy text-white shadow-xl shadow-navy/10 hover:bg-forest",
  quiet: "border border-navy/20 text-navy hover:border-navy hover:bg-navy/5",
  light: "border border-white text-white hover:bg-white hover:text-midnight",
  gold: "bg-gold text-midnight hover:bg-white",
};

/** Short gold rule with a small uppercase line beside it. */
export function Eyebrow({ children, tone = "forest", className }: { children: ReactNode; tone?: "forest" | "gold"; className?: string }) {
  return (
    <p className={cn("flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em]", tone === "gold" ? "text-gold" : "text-forest", className)}>
      <span className="h-px w-8 bg-gold" aria-hidden />
      {children}
    </p>
  );
}

export const serifTitle = "font-serif text-4xl leading-[1.1] text-navy md:text-5xl";

/** Section heading in the Willchris style: optional eyebrow, serif title, gold rule when centred. */
export function SectionHead({
  title,
  eyebrow,
  center = false,
  dark = false,
  children,
}: {
  title: ReactNode;
  eyebrow?: string;
  center?: boolean;
  dark?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={cn("mb-14 grid max-w-2xl gap-5", center && "mx-auto justify-items-center text-center")}>
      {eyebrow && !center && <Eyebrow tone={dark ? "gold" : "forest"}>{eyebrow}</Eyebrow>}
      <h2 className={cn(serifTitle, dark && "text-white")}>{title}</h2>
      {center && <span className="h-px w-16 bg-gold" aria-hidden />}
      {children && (
        <p className={cn("text-[17px] font-light leading-relaxed", dark ? "text-white/80" : "text-muted")}>{children}</p>
      )}
    </div>
  );
}

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/abondhu-mark.png" alt="" width={36} height={27} className="h-[26px] w-auto" priority />
      <span className={cn("text-[17px] font-bold leading-none tracking-[0.14em]", light && "text-white")}>
        <span className="text-[var(--logo-blue)]">A</span>
        <span className="text-[var(--logo-red)]">B</span>
        <span className="text-[var(--logo-yellow)]">O</span>NDHU
      </span>
    </span>
  );
}
