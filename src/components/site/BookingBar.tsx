"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { dayLabel, pickupDays, saveDraft } from "@/lib/booking";
import { LOCALITIES, PIN_RE } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";
import { btn, Container, serifTitle } from "./ui";

const field =
  "h-12 w-full rounded-sm border border-navy/15 bg-white px-3.5 text-base text-ink transition-colors duration-200 sm:text-[15px] placeholder:text-faint hover:border-navy/40 focus:border-navy focus:outline-none aria-[invalid=true]:border-danger";
const label = "text-[11px] font-bold uppercase tracking-[0.15em] text-navy";
export function BookingBar() {
  const router = useRouter();
  const [area, setArea] = useState(LOCALITIES[0]);
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState(0);
  const [error, setError] = useState<"pin" | "phone" | null>(null);
  const days = useMemo(() => pickupDays(), []);

  const pinOk = (v: string) => PIN_RE.test(v.trim());
  const phoneOk = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ""));

  /** On submit, point at the first field that needs fixing and put the cursor in it. */
  function submit(e: FormEvent) {
    e.preventDefault();
    const bad = !pinOk(pin) ? "pin" : !phoneOk(phone) ? "phone" : null;
    setError(bad);
    if (bad) return document.getElementById(bad)?.focus();
    // Carry what they typed over the login step; the booking form picks it up.
    saveDraft({ area, pin: pin.trim(), phone: phone.replace(/\s/g, ""), day: days[day] });
    router.push("/account");
  }

  /** On leaving a field: flag it only if something was typed, and clear the flag once fixed. */
  function check(field: "pin" | "phone", value: string) {
    const ok = field === "pin" ? pinOk(value) : phoneOk(value);
    if (!ok && value.trim()) setError(field);
    else if (error === field) setError(null);
  }

  const message =
    error === "pin"
      ? "We only pick up in Jorhat for now. Enter a 6-digit pincode starting with 785."
      : error === "phone"
        ? "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
        : "No charge for pickup. Next, log in with Google or your phone to confirm.";

  return (
    <section id="book" className="scroll-mt-20 bg-white py-16 md:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="grid content-start gap-5">
          <h2 className={serifTitle}>Book a pickup</h2>
          <p className="max-w-[40ch] font-light leading-relaxed text-muted">
            Anywhere in Jorhat town, every day of the week. Pick your area and a day, and we call you to confirm a time.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="min-w-0"><form noValidate onSubmit={submit}>
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="area" className={label}>Area in Jorhat</label>
                    <select id="area" className={field} value={area} onChange={(e) => setArea(e.target.value)}>
                      {LOCALITIES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value="Elsewhere in Jorhat">Elsewhere in Jorhat</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="day" className={label}>Pickup day</label>
                    <select id="day" className={field} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                      {days.map((d, i) => (
                        <option key={d} value={i}>{dayLabel(d)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="pin" className={label}>Pincode</label>
                    <input
                      id="pin"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="785001"
                      autoComplete="postal-code"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (error === "pin" && pinOk(e.target.value)) setError(null);
                      }}
                      onBlur={(e) => check("pin", e.target.value)}
                      aria-invalid={error === "pin"}
                      aria-describedby="book-msg"
                      className={field}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="phone" className={label}>Mobile number</label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      maxLength={11}
                      placeholder="98640 12345"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (error === "phone" && phoneOk(e.target.value)) setError(null);
                      }}
                      onBlur={(e) => check("phone", e.target.value)}
                      aria-invalid={error === "phone"}
                      aria-describedby="book-msg"
                      className={field}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button type="submit" className={cn(btn.base, btn.primary, "w-full sm:w-auto")}>
                    Book pickup <ArrowRight className="size-4" aria-hidden />
                  </button>
                  <p id="book-msg" aria-live="polite" className={cn("text-sm", error ? "text-danger" : "text-muted")}>
                    {message}
                  </p>
                </div>
              </div>
        </form></Reveal>
      </Container>
    </section>
  );
}
