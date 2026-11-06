import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1120px] pl-[max(20px,env(safe-area-inset-left))] pr-[max(20px,env(safe-area-inset-right))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const btn = {
  base: "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-5 text-[15px] font-medium transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] disabled:opacity-50",
  primary: "bg-accent text-accent-ink hover:bg-[color-mix(in_srgb,var(--accent)_88%,black)]",
  quiet: "border border-line bg-surface text-ink hover:border-faint",
};

/** Section heading: the heading carries its own weight, no labels above it. */
export function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-10 grid max-w-[60ch] gap-3">
      <h2 className="text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">{title}</h2>
      {children && <p className="text-[17px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <Image src="/abondhu-mark.png" alt="" width={36} height={27} className="h-[26px] w-auto" priority />
      <span className="text-[17px] font-semibold leading-none tracking-[0.14em]">
        <span className="text-[var(--logo-blue)]">A</span>
        <span className="text-[var(--logo-red)]">B</span>
        <span className="text-[var(--logo-yellow)]">O</span>NDHU
      </span>
    </span>
  );
}
