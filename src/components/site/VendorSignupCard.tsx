import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { btn } from "./ui";

const KEEP_READY = ["Your mobile phone", "Your Aadhaar card", "Your UPI ID or bank details"];

/** Sends vendors to the real sign-up at /partner. */
export function VendorSignupCard() {
  return (
    <div className="relative grid gap-5 bg-white p-6 shadow-2xl sm:p-10">
      <div className="pointer-events-none absolute inset-0 m-2 border border-gold/30" aria-hidden />
      <h2 className="relative font-serif text-3xl text-navy">Sign up in 6 short steps</h2>
      <p className="relative leading-relaxed text-muted">English or Assamese. It takes about 5 minutes. Keep these ready:</p>
      <ul className="relative grid gap-3 text-[15px] text-navy">
        {KEEP_READY.map((t) => (
          <li key={t} className="flex items-center gap-3">
            <span className="text-forest" aria-hidden>❖</span>
            {t}
          </li>
        ))}
      </ul>
      <Link href="/partner" className={cn(btn.base, btn.primary, "relative w-full")}>
        Start sign-up <ArrowRight className="size-4" aria-hidden />
      </Link>
      <p className="relative text-sm text-muted">No fee to join. Our team checks your details and calls you.</p>
    </div>
  );
}
