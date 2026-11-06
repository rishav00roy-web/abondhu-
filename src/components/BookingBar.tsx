"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { AREAS } from "@/lib/data";
import { cn, EASE_OUT } from "@/lib/utils";
import { btn, Container } from "./ui";

const field =
  "h-12 w-full rounded-[10px] border border-line bg-surface px-3.5 text-[15px] text-ink transition-colors placeholder:text-faint hover:border-faint focus:border-accent focus:outline-none aria-[invalid=true]:border-danger";
const label = "text-sm font-medium";
const DAY_CODES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Next five pickup days for a town, following its van schedule. */
function pickupDays(city: string) {
  const schedule = AREAS.find((a) => a.city === city)?.days ?? "Every day";
  const fmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const out: { date: Date; label: string }[] = [];
  const today = new Date();
  for (let d = 0; out.length < 5 && d < 21; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    if (schedule !== "Every day" && !schedule.includes(DAY_CODES[date.getDay()])) continue;
    out.push({ date, label: (d === 0 ? "Today, " : d === 1 ? "Tomorrow, " : "") + fmt.format(date) });
  }
  return out;
}

export function BookingBar() {
  const reduce = useReducedMotion();
  const [city, setCity] = useState(AREAS[0].city);
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState(0);
  const [error, setError] = useState<"pin" | "phone" | null>(null);
  const [booked, setBooked] = useState(false);
  const days = useMemo(() => pickupDays(city), [city]);
  const digits = phone.replace(/\s/g, "");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^78\d{4}$/.test(pin.trim())) return setError("pin");
    if (!/^[6-9]\d{9}$/.test(digits)) return setError("phone");
    setError(null);
    setBooked(true);
  }

  const message =
    error === "pin"
      ? "We only pick up in Assam. Enter a 6-digit pincode starting with 78."
      : error === "phone"
        ? "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
        : "No charge for pickup. We text you a two-hour slot the evening before.";

  const swap = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6, filter: "blur(3px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, transition: { duration: 0.12 } },
        transition: { duration: 0.35, ease: EASE_OUT },
      };

  return (
    <section id="book" className="scroll-mt-24 border-y border-line bg-surface py-[clamp(56px,7vw,88px)]">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="grid content-start gap-3">
          <h2 className="text-[clamp(28px,3.4vw,40px)] font-semibold leading-[1.1] tracking-[-0.03em]">Book a pickup</h2>
          <p className="max-w-[40ch] text-[17px] leading-relaxed text-muted">
            Guwahati gets a van every day. Other towns have set days, and the dates below follow them.
          </p>
        </div>

        <form noValidate onSubmit={submit} className="min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {!booked ? (
              <motion.div key="form" {...swap} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="city" className={label}>Town</label>
                    <select
                      id="city"
                      className={field}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setDay(0);
                      }}
                    >
                      {AREAS.map((a) => (
                        <option key={a.city} value={a.city}>
                          {a.city} ({a.days.toLowerCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="day" className={label}>Pickup day</label>
                    <select id="day" className={field} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                      {days.map((d, i) => (
                        <option key={d.label} value={i}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="pin" className={label}>Pincode</label>
                    <input
                      id="pin"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="781028"
                      autoComplete="postal-code"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      aria-invalid={error === "pin"}
                      aria-describedby="book-msg"
                      className={field}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="phone" className={label}>Mobile number</label>
                    <input
                      id="phone"
                      inputMode="tel"
                      maxLength={11}
                      placeholder="98640 12345"
                      autoComplete="tel-national"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      aria-invalid={error === "phone"}
                      aria-describedby="book-msg"
                      className={field}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <button type="submit" className={cn(btn.base, btn.primary, "h-12 px-6")}>
                    Book pickup <ArrowRight className="size-4" aria-hidden />
                  </button>
                  <p id="book-msg" aria-live="polite" className={cn("text-sm", error ? "text-danger" : "text-muted")}>
                    {message}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="done" {...swap} className="grid gap-4">
                <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                  <Check className="size-5" strokeWidth={2.2} aria-hidden />
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.02em]">Pickup booked</h3>
                <p className="max-w-[52ch] leading-relaxed text-muted">
                  We&apos;ll come to {pin}, {city} on{" "}
                  {new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(days[day].date)}.
                  Your two-hour slot goes to {digits.slice(0, 5)} {digits.slice(5)} the evening before.
                </p>
                <p className="text-sm text-faint">Demo page: nothing was sent.</p>
                <button type="button" onClick={() => setBooked(false)} className={cn(btn.base, btn.quiet, "justify-self-start")}>
                  Change details
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Container>
    </section>
  );
}
