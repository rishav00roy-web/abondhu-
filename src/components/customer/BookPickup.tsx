"use client";

// Booking form for a signed-in customer: saves a real pickup request, then lists
// their pickups. Expects the browser Supabase client to already have a session.
import { AnimatePresence, motion } from "framer-motion";
import { useReducedSafe } from "@/lib/use-reduced";
import { ArrowRight, Camera, Check, Loader2, Package, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { btn } from "@/components/site/ui";
import { dayLabel, isJorhatPin, isMobile, itemsLine, MAX_ITEMS, OTHER_MAX, OTHER_SCRAP, pickupDays, pickupNote, readItems, SCRAP_TYPES, type ScrapItem, slotsFor, takeDraft, totalKg } from "@/lib/booking";
import { readyPhoto } from "@/lib/shrink-photo";
import { AREA_PINS, areaInLine, LOCALITIES, matchAreaPin, OTHER_AREA, pinForArea } from "@/lib/site-data";
import { authedFetch, getSupabase, isNetworkError, NETWORK_ERR, postJson } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";
import { PriceEstimate } from "./PriceEstimate";
import { cn, EASE_OUT } from "@/lib/utils";

const field =
  "h-12 w-full rounded-sm border border-navy/15 bg-white px-3.5 text-base text-ink transition-colors duration-200 placeholder:text-faint hover:border-navy/40 focus:border-navy focus:outline-none focus:ring-2 focus:ring-gold/60 sm:text-[15px]";
const label = "text-[11px] font-bold uppercase tracking-[0.15em] text-navy";

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
  slot: string;
  items: Row[]; // what scrap and about how many kg, one row per kind
  photo: File | null; // optional photo of all the scrap together
}

/** An item row as typed. `id` only keeps React's keys steady when rows are removed. */
type Row = ScrapItem & { id: number; photo: File | null };
let nextRowId = 1;
const emptyRow = (): Row => ({ id: nextRowId++, scrap: "", other: "", kg: "", photo: null });

export function BookPickup() {
  const sb = getSupabase();
  const reduce = useReducedSafe();
  // Days and slots follow the clock: past slots drop off when the page has been open a while.
  const [now, setNow] = useState(() => new Date());
  const days = useMemo(() => pickupDays(now), [now]);
  const [f, setF] = useState<Form>({ name: "", phone: "", area: LOCALITIES[0], line1: "", pin: "", day: days[0], slot: slotsFor(days[0])[0], items: [emptyRow()], photo: null });
  const [savedPhone, setSavedPhone] = useState<string | null>(null); // phone already on the profile
  const [lastAddress, setLastAddress] = useState<{ id: string; line1: string; pincode: string } | null>(null);
  const [pickups, setPickups] = useState<MyPickup[] | null>(null);
  const [booked, setBooked] = useState<{ code: string; photoFailed: boolean } | null>(null); // the pickup just booked
  const { busy, err, run } = useAction();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const slots = useMemo(() => slotsFor(f.day, now), [f.day, now]);
  const setItem = (id: number, patch: Partial<Omit<Row, "id">>) => setF((p) => ({ ...p, items: p.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));
  const addItem = () => setF((p) => (p.items.length < MAX_ITEMS ? { ...p, items: [...p.items, emptyRow()] } : p));
  const removeItem = (id: number) => setF((p) => (p.items.length > 1 ? { ...p, items: p.items.filter((it) => it.id !== id) } : p));
  // The estimate only needs what was typed, without the row ids.
  const typedItems = useMemo(() => f.items.map(({ scrap, other, kg }) => ({ scrap, other, kg })), [f.items]);
  const pickDay = (day: string) => setF((p) => ({ ...p, day, slot: slotsFor(day).includes(p.slot) ? p.slot : slotsFor(day)[0] }));
  const pickArea = (area: string) => setF((p) => ({ ...p, area, pin: pinForArea(area, p.pin) }));
  const areaPins = AREA_PINS[f.area]; // undefined for "Elsewhere": the pincode is typed

  /** Re-reads the clock; keeps the chosen day and time if still open, else moves to the first open one. */
  const refreshTimes = useCallback(() => {
    const t = new Date();
    const open = pickupDays(t);
    setNow(t);
    setF((p) => {
      const day = open.includes(p.day) ? p.day : open[0];
      const daySlots = slotsFor(day, t);
      const slot = daySlots.includes(p.slot) ? p.slot : daySlots[0];
      return day === p.day && slot === p.slot ? p : { ...p, day, slot };
    });
  }, []);

  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState === "visible") refreshTimes();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [refreshTimes]);

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
    const savedLine = addr.data?.line1 ?? "";
    setF((p) => {
      // A repeat booking opens on the area of the last address.
      const area = draft.area && (LOCALITIES.includes(draft.area) || draft.area === OTHER_AREA) ? draft.area : (areaInLine(savedLine) ?? p.area);
      return {
        ...p,
        name: p.name || prof.data?.full_name || "",
        phone: phone ?? (draft.phone || p.phone),
        ...matchAreaPin(area, draft.pin || p.pin || addr.data?.pincode || ""),
        line1: p.line1 || savedLine,
        ...(draft.day && days.includes(draft.day) ? { day: draft.day, slot: slotsFor(draft.day)[0] } : {}),
      };
    });
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
      if (!isJorhatPin(f.pin)) fail("Pickups are open in Jorhat for now. Enter a 6-digit pincode starting with 785.");
      const t = new Date();
      if (!pickupDays(t).includes(f.day) || !slotsFor(f.day, t).includes(f.slot)) {
        refreshTimes();
        fail("That pickup time has just passed. We picked the next open time. Please check it and book again.");
      }
      // Every field is needed: each item and about how much, and a photo, so the dealer knows what to bring.
      const checked = readItems(typedItems);
      if ("error" in checked) fail(checked.error);
      const items = "items" in checked ? checked.items : [];
      // A photo of each item is needed; the photo of everything together is optional.
      const noPhoto = f.items.findIndex((it) => !it.photo);
      if (noPhoto >= 0) fail(f.items.length > 1 ? `Item ${noPhoto + 1}: please add a photo.` : "Please add a photo of the scrap.");

      const uid = (await sb!.auth.getSession()).data.session?.user.id ?? fail("Please log in again.");
      const { data: pin, error: pinErr } = await sb!.from("pincodes").select("town_id").eq("pincode", f.pin.trim()).eq("is_active", true).maybeSingle();
      if (pinErr) fail(NETWORK_ERR); // a dropped connection must not read as "we don't cover this pincode"
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
        if (error) fail(isNetworkError(error.message) ? NETWORK_ERR : "Could not save your address. Please try again.");
        addressId = data!.id;
      }

      const { data: pickup, error } = await sb!
        .from("pickups")
        .insert({ customer_id: uid, address_id: addressId, pincode: f.pin.trim(), town_id: pin!.town_id, customer_note: pickupNote(f.day, f.slot, itemsLine(items)), estimated_weight_kg: totalKg(items) })
        .select("id, code")
        .single();
      if (error?.hint === "open_limit") fail("You already have 3 pickups booked. You can book again when one is done.");
      if (error?.hint === "daily_limit") fail("You have booked 5 pickups today. Please book again tomorrow.");
      if (error) fail(isNetworkError(error.message) ? NETWORK_ERR : "Could not book the pickup. Please try again.");

      // Photos go up after the pickup is saved; if only an upload fails, the pickup still stands.
      const uploads: [string, File][] = f.items.map((it, i) => [String(i + 1), it.photo!]);
      if (f.photo) uploads.push(["all", f.photo]);
      const results = await Promise.all(
        uploads.map(([item, file]) => {
          const fd = new FormData();
          fd.append("pickup_id", pickup!.id);
          fd.append("item", item);
          fd.append("file", file); // already shrunk when picked
          return authedFetch("/api/pickup/photo", { method: "POST", body: fd }).then(() => true, () => false);
        }),
      );
      const photoFailed = results.includes(false);
      // Tell the dealers who cover this pincode. If this fails, admin sees the pickup waiting and calls one.
      await postJson("/api/pickup/notify", { pickupId: pickup!.id }).catch(() => {});
      setBooked({ code: pickup!.code, photoFailed });
      setF((p) => ({ ...p, items: [emptyRow()], photo: null }));
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
              Your booking number is <b className="font-mono text-navy">{booked.code}</b>. We&apos;ll call you to confirm the time.
            </p>
            {booked.photoFailed && (
              <p className="max-w-[52ch] text-sm text-muted">A photo didn&apos;t upload. That&apos;s fine: you can show the scrap when the dealer comes.</p>
            )}
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
                <input id="bp-name" className={field} autoComplete="name" maxLength={100} value={f.name} onChange={(e) => set("name", e.target.value)} />
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
                <input id="bp-line1" className={field} autoComplete="street-address" placeholder="House 12, near the Namghar" maxLength={200} value={f.line1} onChange={(e) => set("line1", e.target.value)} />
              </Field>
              <Field id="bp-area" label="Area in Jorhat">
                <select id="bp-area" className={field} value={f.area} onChange={(e) => pickArea(e.target.value)}>
                  {LOCALITIES.map((a) => <option key={a}>{a}</option>)}
                  <option>{OTHER_AREA}</option>
                </select>
              </Field>
              <Field id="bp-pin" label="Pincode">
                {areaPins ? (
                  <select id="bp-pin" className={field} autoComplete="postal-code" value={f.pin} onChange={(e) => set("pin", e.target.value)}>
                    {areaPins.map((p) => <option key={p}>{p}</option>)}
                  </select>
                ) : (
                  <input id="bp-pin" className={field} inputMode="numeric" autoComplete="postal-code" placeholder="785001" maxLength={6} value={f.pin} onChange={(e) => set("pin", e.target.value.replace(/\D/g, ""))} />
                )}
              </Field>
              <Field id="bp-day" label="Pickup day">
                <select id="bp-day" className={field} value={f.day} onChange={(e) => pickDay(e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{dayLabel(d)}</option>)}
                </select>
              </Field>
              <Field id="bp-slot" label="Pickup time">
                <select id="bp-slot" className={field} value={f.slot} onChange={(e) => set("slot", e.target.value)}>
                  {slots.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <ScrapItems items={f.items} onChange={setItem} onAdd={addItem} onRemove={removeItem} />
              <PriceEstimate items={typedItems} />
              <AllScrapPhoto file={f.photo} onPick={(x) => set("photo", x)} />
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

/** One row per kind of scrap: what it is, about how many kg, and a photo. "Add more" adds a row; X removes one. */
function ScrapItems({ items, onChange, onAdd, onRemove }: { items: Row[]; onChange: (id: number, patch: Partial<Omit<Row, "id">>) => void; onAdd: () => void; onRemove: (id: number) => void }) {
  return (
    <fieldset className="grid gap-3 sm:col-span-2">
      <legend className={cn(label, "mb-1")}>What scrap, and about how many kg?</legend>
      {items.map((it, i) => {
        const n = items.length > 1 ? ` ${i + 1}` : "";
        return (
          <div key={it.id} className="grid grid-cols-[1fr_1fr_3rem] gap-2 sm:grid-cols-[1fr_7rem_9rem_3rem]">
            <select aria-label={`Item${n}: what scrap`} className={cn(field, "col-span-3 sm:col-span-1")} value={it.scrap} onChange={(e) => onChange(it.id, { scrap: e.target.value })}>
              <option value="">Choose a kind</option>
              {SCRAP_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <div className="relative">
              <input
                aria-label={`Item${n}: estimated weight in kg`}
                className={cn(field, "pr-10")}
                inputMode="decimal"
                placeholder="15"
                maxLength={7}
                value={it.kg}
                onChange={(e) => onChange(it.id, { kg: e.target.value.replace(/[^\d.,]/g, "") })}
              />
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3.5 grid place-items-center text-sm text-muted">kg</span>
            </div>
            <RowPhoto n={n} file={it.photo} onPick={(photo) => onChange(it.id, { photo })} />
            {items.length > 1 ? (
              <button type="button" onClick={() => onRemove(it.id)} aria-label={`Remove item${n}`} className="grid h-12 place-items-center rounded-sm border border-navy/15 text-muted transition-colors duration-200 hover:border-navy hover:text-navy focus:outline-none focus:ring-2 focus:ring-gold/60">
                <X className="size-4" aria-hidden />
              </button>
            ) : (
              <span aria-hidden />
            )}
            {it.scrap === OTHER_SCRAP && (
              <input aria-label={`Item${n}: what is it?`} className={cn(field, "col-span-3 sm:col-span-4")} placeholder="What is it? Like an old cooler" maxLength={OTHER_MAX} value={it.other} onChange={(e) => onChange(it.id, { other: e.target.value })} />
            )}
          </div>
        );
      })}
      {items.length < MAX_ITEMS && (
        <button type="button" onClick={onAdd} className={cn(btn.base, btn.quiet, "justify-self-start")}>
          <Plus className="size-4" aria-hidden /> Add more
        </button>
      )}
    </fieldset>
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

/** A picked photo as a preview link that is freed when it changes. */
function usePreview(file: File | null) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return url;
}

const BAD_PHOTO = "This photo can't be used. Please take a new photo, or choose a JPG.";

/** "Add pic" for one item row (needed to book). Camera or gallery; tap again to change it. */
function RowPhoto({ n, file, onPick }: { n: string; file: File | null; onPick: (f: File) => void }) {
  const url = usePreview(file);
  const [bad, setBad] = useState(false);
  const pick = async (picked: File | undefined) => {
    if (!picked) return;
    const ready = await readyPhoto(picked);
    setBad(!ready);
    if (ready) onPick(ready);
  };
  return (
    <>
    <label
      className={cn(
        "flex h-12 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-sm border bg-white px-2 text-[15px] font-medium text-navy transition-colors duration-200 hover:border-navy focus-within:ring-2 focus-within:ring-gold/60",
        file ? "border-forest/50" : "border-dashed border-navy/30",
        bad && "border-danger text-danger",
      )}
    >
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="size-8 shrink-0 rounded-sm object-cover" />
          <span className="truncate">Change</span>
        </>
      ) : (
        <>
          <Camera className="size-4 shrink-0" aria-hidden /> <span className="truncate">{bad ? "Try again" : "Add pic"}</span>
        </>
      )}
      <input type="file" accept="image/*" aria-label={`Item${n}: photo`} className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
    </label>
    {bad && <p role="alert" className="order-last col-span-3 text-sm text-danger sm:col-span-4">{BAD_PHOTO}</p>}
    </>
  );
}

/** Optional photo of all the scrap together. Camera or gallery. */
function AllScrapPhoto({ file, onPick }: { file: File | null; onPick: (f: File | null) => void }) {
  const url = usePreview(file);
  const [bad, setBad] = useState(false);
  const pick = async (picked: File | undefined) => {
    if (!picked) return;
    const ready = await readyPhoto(picked);
    setBad(!ready);
    if (ready) onPick(ready);
  };
  return (
    <div className="grid gap-2 sm:col-span-2">
      <span className={label}>Photo of all the scrap (optional)</span>
      {url ? (
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Your photo of all the scrap" className="size-20 rounded-sm border border-line object-cover" />
          <button type="button" onClick={() => onPick(null)} className={cn(btn.base, btn.quiet)}>
            <X className="size-4" aria-hidden /> Remove
          </button>
        </div>
      ) : (
        <label className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-navy/30 bg-white text-[15px] font-medium text-navy transition-colors duration-200 hover:border-navy focus-within:ring-2 focus-within:ring-gold/60">
          <Camera className="size-4" aria-hidden /> Add a photo
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}
      {bad && <p role="alert" className="text-sm text-danger">{BAD_PHOTO}</p>}
    </div>
  );
}
