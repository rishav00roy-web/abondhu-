"use client";

// Building blocks for the vendor screens: big text, big buttons, few words.
import { ArrowLeft, ArrowRight, Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Strings } from "@/lib/vendor-i18n";

export const input =
  "h-14 w-full rounded-xl border-2 border-line bg-white px-4 text-lg text-ink outline-none transition-colors focus:border-forest";

export function Shell({ t, onLang, step, onBack, onLogout, children }: {
  t: Strings; onLang: () => void; step?: number; onBack?: () => void; onLogout?: () => void; children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-sunk">
      <header className="bg-navy px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label={t.back} className="-ml-2 grid size-10 place-items-center">
              <ArrowLeft className="size-6" />
            </button>
          ) : null}
          <Link href="/" className="flex items-center gap-2 font-serif text-xl">
            <Image src="/abondhu-mark.png" alt="" width={32} height={24} className="h-6 w-auto rounded bg-white p-0.5" />
            Abondhu
          </Link>
          <button type="button" onClick={onLang} className="ml-auto rounded-full border border-gold px-3 py-1 text-sm text-gold">
            {t.switchTo}
          </button>
        </div>
        {step && (
          <div className="mx-auto mt-4 max-w-md">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-white/20")} />
              ))}
            </div>
            <p className="mt-2 text-sm text-gold">{t.step(step)}</p>
          </div>
        )}
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-5 py-6">{children}</main>
      {onLogout && (
        <div className="mx-auto max-w-md px-5 pb-8 text-center">
          <button type="button" onClick={onLogout} className="text-sm text-muted underline">
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
}

export const Title = ({ children }: { children: ReactNode }) => <h1 className="text-2xl font-bold leading-snug text-navy">{children}</h1>;

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[17px] font-semibold text-ink">{label}</span>
      {children}
    </div>
  );
}

export function Tile({ on, onClick, icon, label, row }: { on: boolean; onClick: () => void; icon?: ReactNode; label: string; row?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex min-h-14 items-center gap-2 rounded-xl border-2 bg-white px-3 py-3 font-semibold transition-colors [&_svg]:size-6 [&_svg]:text-navy",
        row ? "justify-start" : "flex-col justify-center text-center",
        on ? "border-gold bg-[#FFF9E6]" : "border-line",
      )}
    >
      {icon && <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand">{icon}</span>}
      {label}
    </button>
  );
}

export function PhotoPick({ label, file, onPick, t, front }: { label: string; file: File | null; onPick: (f: File | null) => void; t: Strings; front?: boolean }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return (
    <Field label={label}>
      <label className={cn("relative flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed bg-white font-semibold text-navy", file ? "border-forest" : "border-gold")}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        ) : null}
        <Camera className="relative size-9 text-gold" />
        <span className="relative">{file ? t.retake : t.takePhoto}</span>
        <input
          type="file"
          accept="image/*"
          capture={front ? "user" : "environment"}
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </label>
    </Field>
  );
}

export function Primary({ children, onClick, busy, disabled, t }: { children: ReactNode; onClick: () => void; busy: boolean; disabled?: boolean; t: Strings }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="mt-2 flex h-16 items-center justify-center gap-3 rounded-2xl bg-forest text-xl font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
    >
      {busy ? (
        <>
          <Loader2 className="size-6 animate-spin" /> {t.wait}
        </>
      ) : (
        <>
          {children} <ArrowRight className="size-6" />
        </>
      )}
    </button>
  );
}

export const Err = ({ msg }: { msg: string }) => (msg ? <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-danger">{msg}</p> : null);

export const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex flex-col gap-0.5 px-4 py-3">
    <dt className="text-sm text-muted">{k}</dt>
    <dd className="font-semibold text-ink">{v}</dd>
  </div>
);
