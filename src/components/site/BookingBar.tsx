"use client";

import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { dayLabel, pickupDays, saveDraft } from "@/lib/booking";
import { AREA_PINS, HOURS, LOCALITIES, OTHER_AREA, PIN_RE, pinForArea } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { Reveal } from "./motion";
import { btn, Container, serifTitle } from "./ui";

type Days = ReturnType<typeof pickupDays>;
let clientDays: Days | null = null;
const noop = () => () => {};
const getClientDays = () => (clientDays ??= pickupDays());
const NO_DAYS: Days = [];
const getServerDays = () => NO_DAYS;

const field =
  "h-12 w-full rounded-sm border border-navy/15 bg-white px-3.5 text-base text-ink transition-colors duration-200 sm:text-[15px] placeholder:text-faint hover:border-navy/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/60 aria-[invalid=true]:border-danger";
const label = "text-[11px] font-bold uppercase tracking-[0.15em] text-navy";
export function BookingBar() {
  const router = useRouter();
  const [area, setArea] = useState(LOCALITIES[0]);
  const [pin, setPin] = useState(AREA_PINS[LOCALITIES[0]][0]);
  const areaPins = AREA_PINS[area]; // undefined for "Elsewhere": the pincode is typed
  const [phone, setPhone] = useState("");
  const [day, setDay] = useState(0);
  const [error, setError] = useState<"pin" | "phone" | null>(null);
  const [sending, setSending] = useState(false);
  // Dates depend on the visitor's clock, so they are built on the client only (server and first paint match).
  const days = useSyncExternalStore(noop, getClientDays, getServerDays);

  const pinOk = (v: string) => PIN_RE.test(v.trim());
  const phoneOk = (v: string) => /^[6-9]\d{9}$/.test(v.replace(/\s/g, ""));

  /** On submit, point at the first field that needs fixing and put the cursor in it. */
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Read the fields from the form itself, so it also works when a browser agent fills them in (WebMCP).
    const f = new FormData(e.currentTarget);
    const pin = String(f.get("pincode") ?? "");
    const phone = String(f.get("phone") ?? "");
    const bad = !pinOk(pin) ? "pin" : !phoneOk(phone) ? "phone" : null;
    setError(bad);
    if (bad) return document.getElementById(bad)?.focus();
    // Carry what they typed over the login step; the booking form picks it up.
    saveDraft({ area: String(f.get("area") ?? area), pin: pin.trim(), phone: phone.replace(/\s/g, ""), day: days[Number(f.get("day") ?? day)] ?? days[0] });
    setSending(true); // the next page can take a moment on a slow phone connection
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
      ? "Pickups are open in Jorhat for now. Enter a 6-digit pincode starting with 785."
      : error === "phone"
        ? "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
        : "No charge for pickup. Next, log in with Google or email to confirm.";

  return (
    <section id="book" className="scroll-mt-20 bg-white py-16 md:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal className="grid content-start gap-5">
          <h2 className={serifTitle}>Book a pickup</h2>
          <p className="max-w-[40ch] font-light leading-relaxed text-muted">
            Pickups are open in Jorhat now, {HOURS}, with more cities joining as dealers sign up. Pick your area and a day, and we call you to confirm a time with a dealer near you.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="min-w-0"><form
              noValidate
              onSubmit={submit}
              toolname="book_scrap_pickup"
              tooldescription="Start booking a free doorstep scrap pickup with a verified dealer in Jorhat, Assam. After submitting, the person logs in to confirm the booking."
            >
              <div className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="area" className={label}>Area in Jorhat</label>
                    <select
                      id="area"
                      name="area"
                      toolparamdescription="Locality in Jorhat"
                      className={field}
                      value={area}
                      onChange={(e) => {
                        const next = pinForArea(e.target.value, pin);
                        setArea(e.target.value);
                        setPin(next);
                        if (error === "pin" && pinOk(next)) setError(null);
                      }}
                    >
                      {LOCALITIES.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value={OTHER_AREA}>{OTHER_AREA}</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="day" className={label}>Pickup day</label>
                    <select id="day" name="day" toolparamdescription="Pickup day (Monday to Saturday)" className={field} value={day} onChange={(e) => setDay(Number(e.target.value))}>
                      {days.map((d, i) => (
                        <option key={d} value={i}>{dayLabel(d)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="pin" className={label}>Pincode</label>
                    {areaPins ? (
                      <select
                        id="pin"
                        name="pincode"
                        toolparamdescription="Pincode in the chosen area"
                        autoComplete="postal-code"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className={field}
                      >
                        {areaPins.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="pin"
                        name="pincode"
                        toolparamdescription="6-digit Jorhat pincode, starting with 785"
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
                    )}
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="phone" className={label}>Mobile number</label>
                    <input
                      id="phone"
                      name="phone"
                      toolparamdescription="10-digit Indian mobile number"
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
                  <button type="submit" disabled={sending} className={cn(btn.base, btn.primary, "w-full sm:w-auto")}>
                    {sending ? (
                      <>
                        Opening <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
                      </>
                    ) : (
                      <>
                        Book pickup <ArrowRight className="size-4" aria-hidden />
                      </>
                    )}
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
