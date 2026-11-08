"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { type FormEvent, useState } from "react";
import { AREAS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SPRING } from "./motion";
import { btn } from "./ui";

const field =
  "h-12 w-full rounded-sm border border-navy/15 bg-white px-3.5 text-base text-ink transition-colors duration-200 placeholder:text-faint hover:border-navy/40 focus:border-navy focus:outline-none aria-[invalid=true]:border-danger sm:text-[15px]";
const label = "text-[11px] font-bold uppercase tracking-[0.15em] text-navy";
const VEHICLES = ["Hand cart or cycle", "Auto or e-rickshaw", "Pickup or small truck"];

export function VendorForm() {
  const reduce = useReducedMotion();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [town, setTown] = useState(AREAS[0].city);
  const [vehicle, setVehicle] = useState(VEHICLES[0]);
  const [error, setError] = useState<"name" | "phone" | null>(null);
  const [sent, setSent] = useState(false);
  const digits = phone.replace(/\s/g, "");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("name");
    if (!/^[6-9]\d{9}$/.test(digits)) return setError("phone");
    setError(null);
    setSent(true);
  }

  const swap = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8, filter: "blur(4px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: SPRING },
        exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
      };

  return (
    <div className="relative bg-white p-6 shadow-2xl sm:p-10">
      <div className="pointer-events-none absolute inset-0 m-2 border border-gold/30" aria-hidden />
      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.form key="form" {...swap} noValidate onSubmit={submit} className="relative grid gap-5">
            <h2 className="font-serif text-3xl text-navy">Register your interest</h2>
            <div className="grid gap-2">
              <label htmlFor="v-name" className={label}>Your name</label>
              <input id="v-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={error === "name"} aria-describedby="v-msg" className={field} placeholder="Bikash Das" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="v-phone" className={label}>Mobile number</label>
              <input id="v-phone" inputMode="tel" maxLength={11} autoComplete="tel-national" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={error === "phone"} aria-describedby="v-msg" className={field} placeholder="98640 12345" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="v-town" className={label}>Town</label>
                <select id="v-town" value={town} onChange={(e) => setTown(e.target.value)} className={field}>
                  {AREAS.map((a) => <option key={a.city}>{a.city}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <label htmlFor="v-vehicle" className={label}>You collect with</label>
                <select id="v-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} className={field}>
                  {VEHICLES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className={cn(btn.base, btn.primary, "w-full")}>
              Send my details <ArrowRight className="size-4" aria-hidden />
            </button>
            <p id="v-msg" aria-live="polite" className={cn("text-sm", error ? "text-danger" : "text-muted")}>
              {error === "name"
                ? "Tell us your name so our team knows who to ask for."
                : error === "phone"
                  ? "Enter a 10-digit mobile number starting with 6, 7, 8 or 9."
                  : "Our vendor team calls you within two working days. No fee to join."}
            </p>
          </motion.form>
        ) : (
          <motion.div key="done" {...swap} className="relative grid gap-4">
            <span className="grid size-12 place-items-center rounded-full border border-gold text-forest">
              <Check className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <h2 className="font-serif text-3xl text-navy">Thank you, {name.trim().split(" ")[0]}</h2>
            <p className="leading-relaxed text-muted">
              Our vendor team will call {digits.slice(0, 5)} {digits.slice(5)} about routes in {town}. Keep your Aadhaar and a
              photo of your {vehicle.toLowerCase()} handy.
            </p>
            <p className="text-sm text-faint">Demo page: nothing was sent.</p>
            <button type="button" onClick={() => setSent(false)} className={cn(btn.base, btn.quiet, "justify-self-start")}>
              Change details
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
