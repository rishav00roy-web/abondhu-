"use client";

// Booking form for a signed-in customer: saves a real pickup request, then lists
// their pickups. Expects the browser Supabase client to already have a session.
import { AnimatePresence, motion } from "framer-motion";
import { useReducedSafe } from "@/lib/use-reduced";
import { ArrowRight, Check, Loader2, Package } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { btn } from "@/components/site/ui";
import { dayLabel, isJorhatPin, isMobile, pickupDays, pickupNote, takeDraft } from "@/lib/booking";
import { LOCALITIES } from "@/lib/site-data";
import { getSupabase, postJson } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";
import { cn, EASE_OUT } from "@/lib/utils";

const field =
  "h-12 w-full rounded-sm border border-navy/15 bg-white px-3.5 text-base text-ink transition-colors duration-200 placeholder:text-faint hover:border-navy/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/60 sm:text-[15px]";
const label = "text-[11px] font-bold uppercase tracking-[0.15em] text-navy";
const OTHER_AREA = "Elsewhere in Jorhat";

const STATUS: Record<string, string> = {
  requested: "Booked",
  assigned: "Collector assigned",
  accepted: "Collector confirmed",
  on_the_way: "On the way",
  weighed: "Weighed",
  completed: "Done",
  cancelled: "Cancelled",
};

interface MyPickup {
  id: string;
  code: string;
  status: string;
  customer_note: string | null;
  requested_at: string;
}

interface Form {
  name: string;
  phone: string;
  area: string;
  line1: string;
  pin: string;
  day: string;
  scrap: string;
}

/** Same limit as the database (can_book): stops fake bulk bookings. */
const MAX_WAITING = 3;

export function BookPickup() {
  const sb = getSupabase();
  const reduce = useReducedSafe();
  const days = useMemo(() => pickupDays(), []);
  const [f, setF] = useState<Form>({ name: "", phone: "", area: LOCALITIES[0], line1: "", pin: "", day: days[0], scrap: "" });
  const [savedPhone, setSavedPhone] = useState<string | null>(null); // phone already on the profile
  const [lastAddress, setLastAddress] = useState<{ id: string; line1: string; pincode: string } | null>(null);
  const [pickups, setPickups] = useState<MyPickup[] | null>(null);
  const [booked, setBooked] = useState<string | null>(null); // code of the pickup just booked
  const { busy, err, run } = useAction();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    if (!sb) return;
    const uid = (await sb.auth.getSession()).data.session?.user.id;
    if (!uid) return;
    const [prof, addr, picks] = await Promise.all([
      sb.from("profiles").select("full_name, phone").eq("id", uid).single(),
      sb.from("addresses").select("id, line1, pincode").eq("profile_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("pickups").select("id, code, status, customer_note, requested_at").eq("customer_id", uid).order("requested_at", { ascending: false }).limit(20),
    ]);
    const draft = takeDraft();
    const phone = prof.data?.phone?.replace(/^\+91/, "") ?? null;
    setSavedPhone(phone);
    setLastAddress(addr.data ?? null);
    setPickups((picks.data as MyPickup[]) ?? []);
    setF((p) => ({
      ...p,
      name: p.name || prof.data?.full_name || "",
      phone: phone ?? (draft.phone || p.phone),
      area: draft.area && (LOCALITIES.includes(draft.area) || draft.area === OTHER_AREA) ? draft.area : p.area,
      line1: p.line1 || addr.data?.line1 || "",
      pin: draft.pin || p.pin || addr.data?.pincode || "",
      day: draft.day && days.includes(draft.day) ? draft.day : p.day,
    }));
  }, [sb, days]);

  useEffect(() => {
    // Loads the profile, last address and pickups once; state is set after the calls resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const fail = (msg: string): never => {
    throw new Error(msg);
  };

  const book = () =>
    run(async () => {
      const name = f.name.trim();
      const phone = f.phone.replace(/\s/g, "");
      const line1 = f.line1.trim();
      if (name.length < 2) fail("Please write your name.");
      if (!isMobile(phone)) fail("Enter a 10-digit mobile number starting with 6, 7, 8 or 9.");
      if (line1.length < 5) fail("Please write your house and street.");
      if (!isJorhatPin(f.pin)) fail("We only pick up in Jorhat for now. Enter a 6-digit pincode starting with 785.");
      const waiting = (pickups ?? []).filter((p) => p.status !== "completed" && p.status !== "cancelled").length;
      if (waiting >= MAX_WAITING) fail(`You already have ${MAX_WAITING} pickups waiting. Please wait for one to finish, or WhatsApp us.`);

      const uid = (await sb!.auth.getSession()).data.session?.user.id ?? fail("Please log in again.");
      const { data: pin } = await sb!.from("pincodes").select("town_id").eq("pincode", f.pin.trim()).eq("is_active", true).maybeSingle();
      if (!pin) fail("We don't cover this pincode yet. WhatsApp us and we'll try to help.");

      if (!savedPhone) {
        await postJson("/api/vendor/contact", { phone }).catch((e: Error) =>
          fail(e.message === "phone_taken" ? "This mobile number is already used by another account." : e.message),
        );
      }
      await sb!.from("profiles").update({ full_name: name }).eq("id", uid);

      // Reuse the last address when nothing changed, so repeat bookings don't pile up copies.
      const fullLine = f.area === OTHER_AREA || line1.toLowerCase().includes(f.area.toLowerCase()) ? line1 : `${line1}, ${f.area}`;
      let addressId = lastAddress && lastAddress.line1 === fullLine && lastAddress.pincode === f.pin.trim() ? lastAddress.id : null;
      if (!addressId) {
        const { data, error } = await sb!
          .from("addresses")
          .insert({ profile_id: uid, label: "home", line1: fullLine, pincode: f.pin.trim(), is_default: true })
          .select("id")
          .single();
        if (error) fail("Could not save your address. Please try again.");
        addressId = data!.id;
      }

      const { data: pickup, error } = await sb!
        .from("pickups")
        .insert({ customer_id: uid, address_id: addressId, pincode: f.pin.trim(), town_id: pin!.town_id, customer_note: pickupNote(f.day, f.scrap) })
        .select("code")
        .single();
      if (error) fail("Could not book the pickup. Please try again.");
      setBooked(pickup!.code);
      await load();
    });

  if (!sb) return <p className="text-muted">Booking is being set up. Please check back soon.</p>;
  if (pickups === null) return <Loader2 className="mx-auto size-6 animate-spin text-forest" aria-label="Loading" />;

  const swap = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6, filter: "blur(3px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, transition: { duration: 0.12 } },
        transition: { duration: 0.35, ease: EASE_OUT },
      };
  const open = pickups.filter((p) => p.status !== "completed" && p.status !== "cancelled");
  const past = pickups.filter((p) => p.status === "completed" || p.status === "cancelled");

  return (
    <div className="grid gap-10">
      <AnimatePresence mode="wait" initial={false}>
        {booked ? (
          <motion.div key="done" {...swap} className="grid gap-4 rounded-sm border border-line bg-white p-6 sm:p-8">
            <span className="grid size-12 place-items-center rounded-full border border-gold text-forest">
              <Check className="size-5" strokeWidth={2.2} aria-hidden />
            </span>
            <h2 className="font-serif text-3xl text-navy">Pickup booked</h2>
            <p className="max-w-[52ch] leading-relaxed text-muted">
              Your booking number is <b className="font-mono text-navy">{booked}</b>. We&apos;ll call you to confirm a time.
            </p>
            <button type="button" onClick={() => setBooked(null)} className={cn(btn.base, btn.quiet, "justify-self-start")}>
              Book another pickup
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            {...swap}
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              book();
            }}
            className="grid gap-5 rounded-sm border border-line bg-white p-6 sm:p-8"
          >
            <h2 className="font-serif text-3xl text-navy">Book a pickup</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="bp-name" label="Your name">
                <input id="bp-name" className={field} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field id="bp-phone" label="Mobile number">
                <input
                  id="bp-phone"
                  className={cn(field, savedPhone && "bg-sunk text-muted")}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="98640 12345"
                  maxLength={11}
                  readOnly={!!savedPhone}
                  value={f.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/[^\d ]/g, ""))}
                />
              </Field>
              <Field id="bp-line1" label="House and street" wide>
                <input id="bp-line1" className={field} autoComplete="street-address" placeholder="House 12, near the Namghar" value={f.line1} onChange={(e) => set("line1", e.target.value)} />
              </Field>
              <Field id="bp-area" label="Area in Jorhat">
                <select id="bp-area" className={field} value={f.area} onChange={(e) => set("area", e.target.value)}>
                  {LOCALITIES.map((a) => <option key={a}>{a}</option>)}
                  <option>{OTHER_AREA}</option>
                </select>
              </Field>
              <Field id="bp-pin" label="Pincode">
                <input id="bp-pin" className={field} inputMode="numeric" autoComplete="postal-code" placeholder="785001" maxLength={6} value={f.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))} />
              </Field>
              <Field id="bp-day" label="Pickup day">
                <select id="bp-day" className={field} value={f.day} onChange={(e) => set("day", e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
                </select>
              </Field>
              <Field id="bp-scrap" label="What scrap? (optional)">
                <input id="bp-scrap" className={field} placeholder="Newspapers, an old cooler" maxLength={300} value={f.scrap} onChange={(e) => set("scrap", e.target.value)} />
              </Field>
            </div>
            {err && <p role="alert" className="rounded-sm bg-red-50 p-3 text-sm text-danger">{err}</p>}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <button type="submit" disabled={busy} className={cn(btn.base, btn.primary, "w-full sm:w-auto")}>
                {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                Book pickup {!busy && <ArrowRight className="size-4" aria-hidden />}
              </button>
              <p className="text-sm text-muted">No charge for pickup. We call to confirm a time.</p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <section className="grid gap-4">
        <h2 className="font-serif text-2xl text-navy">Your pickups</h2>
        {pickups.length === 0 ? (
          <div className="flex items-center gap-3 rounded-sm border border-dashed border-navy/20 p-5 text-muted">
            <Package className="size-5 text-faint" aria-hidden /> No pickups yet. Your bookings will show here.
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-sm border border-line bg-white">
            {[...open, ...past].map((p) => (
              <li key={p.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-navy">{p.code}</p>
                  {p.customer_note && <p className="mt-0.5 text-sm text-muted">{p.customer_note}</p>}
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold", p.status === "cancelled" ? "bg-sunk text-faint" : p.status === "completed" ? "bg-[#E8F1EE] text-forest" : "bg-[#FFF9E6] text-navy ring-1 ring-gold")}>
                  {STATUS[p.status] ?? p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ id, label: text, wide, children }: { id: string; label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-2", wide && "sm:col-span-2")}>
      <label htmlFor={id} className={label}>{text}</label>
      {children}
    </div>
  );
}
