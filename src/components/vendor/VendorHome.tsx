"use client";

// Home screen for an approved vendor: who they are, their pickups, their area and help.
// Read-only for now; actions (accept, weigh, pay) arrive one by one in later releases.
import { motion, MotionConfig } from "framer-motion";
import {
  BadgeCheck, CalendarClock, CheckCircle2, Loader2, MapPin, MessageCircle, Navigation, Package, Phone, Scale, Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  HELP_PHONE, helpLink, maskPayout, mapsLink, monthStats, rupees, splitPickups, type PayoutLite, type PickupLite,
} from "@/lib/vendor-home";
import { homeStrings, type HomeStrings } from "@/lib/vendor-home-i18n";
import type { Lang, Strings } from "@/lib/vendor-i18n";

interface Data {
  name: string | null;
  phone: string | null;
  code: string | null;
  shopName: string | null;
  shopAddress: string | null;
  vehicle: string | null;
  areas: { pincode: string; area: string | null }[];
  pickups: PickupLite[];
  payouts: PayoutLite[];
  payTo: string | null;
}

// Supabase returns an embedded row as an object (or, without generated types, maybe an array).
const one = <T,>(v: unknown): T | null => ((Array.isArray(v) ? v[0] : v) ?? null) as T | null;

async function load(): Promise<Data> {
  const sb = getSupabase()!;
  const uid = (await sb.auth.getSession()).data.session?.user.id;
  if (!uid) throw new Error("signed out");
  const [prof, vend, areas, picks, pays, acct] = await Promise.all([
    sb.from("profiles").select("full_name, phone").eq("id", uid).single(),
    sb.from("vendors").select("application_code, business_name, vehicle_type, addresses(line1, pincode)").eq("id", uid).single(),
    sb.from("vendor_service_areas").select("pincode, pincodes(area_name)").eq("vendor_id", uid),
    sb
      .from("pickups")
      .select("id, code, status, pincode, requested_at, completed_at, total_weight_kg, customer_note, pickup_slots(slot_date, start_time), addresses(line1, landmark)")
      .eq("vendor_id", uid) // RLS also shows open pickups in the area; this home lists only the vendor's own
      .order("requested_at", { ascending: false })
      .limit(200),
    sb.from("vendor_payouts").select("amount, status, paid_at").eq("vendor_id", uid).limit(200),
    sb.from("vendor_payout_accounts").select("method, upi_id, account_number").eq("vendor_id", uid).limit(1).maybeSingle(),
  ]);
  const failed = [prof, vend, areas, picks, pays, acct].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  const shop = one<{ line1: string; pincode: string }>(vend.data?.addresses);
  return {
    name: prof.data?.full_name ?? null,
    phone: prof.data?.phone ?? null,
    code: vend.data?.application_code ?? null,
    shopName: vend.data?.business_name ?? null,
    shopAddress: shop ? `${shop.line1}, ${shop.pincode}` : null,
    vehicle: vend.data?.vehicle_type ?? null,
    areas: (areas.data ?? []).map((a) => ({
      pincode: a.pincode,
      area: one<{ area_name: string | null }>(a.pincodes)?.area_name ?? null,
    })),
    pickups: (picks.data ?? []).map((p) => {
      const slot = one<{ slot_date: string; start_time: string }>(p.pickup_slots);
      const addr = one<{ line1: string; landmark: string | null }>(p.addresses);
      return {
        id: p.id, code: p.code, status: p.status, pincode: p.pincode, requested_at: p.requested_at,
        completed_at: p.completed_at, total_weight_kg: p.total_weight_kg, note: p.customer_note,
        slot_date: slot?.slot_date ?? null, start_time: slot?.start_time ?? null,
        address: addr ? [addr.line1, addr.landmark].filter(Boolean).join(", ") : null,
      };
    }),
    payouts: (pays.data ?? []) as PayoutLite[],
    payTo: maskPayout(acct.data),
  };
}

export function VendorHome({ t, lang }: { t: Strings; lang: Lang }) {
  const h = homeStrings(lang);
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchData = useCallback(() => load().then(setData, () => setFailed(true)), []);
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  const refresh = () => {
    setFailed(false);
    fetchData();
  };

  if (failed) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <p className="text-lg text-muted">{h.loadErr}</p>
        <BigButton onClick={refresh} className="bg-forest text-white">{h.retry}</BigButton>
      </div>
    );
  }
  if (!data) return <Loader2 className="mx-auto mt-10 size-8 animate-spin text-forest" aria-label={t.wait} />;

  const { upcoming, done } = splitPickups(data.pickups);
  const stats = monthStats(data.pickups, data.payouts);
  const vehicle = data.vehicle && data.vehicle in t ? t[data.vehicle as "cycle" | "cart" | "auto" | "truck"] : data.vehicle;
  const locale = lang === "as" ? "as-IN" : "en-IN";

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className="flex flex-col gap-5"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {/* Who you are */}
        <Card className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-forest font-serif text-3xl text-white">
            {(data.name?.trim()[0] ?? "A").toUpperCase()}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-navy">{h.hello(data.name?.split(" ")[0] ?? "")}</h1>
            {data.shopName && <p className="truncate text-muted">{data.shopName}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F1EE] px-3 py-1 text-sm font-bold text-forest">
                <BadgeCheck className="size-4" /> {h.approved}
              </span>
              {data.code && <span className="font-mono text-sm text-muted">{data.code}</span>}
            </p>
          </div>
        </Card>

        {/* This month */}
        <motion.div variants={rise} className="grid grid-cols-3 gap-3">
          <Stat icon={<CheckCircle2 />} value={String(stats.count)} label={h.doneMonth} />
          <Stat icon={<Scale />} value={String(stats.kg)} label={h.kgMonth} />
          <Stat icon={<Wallet />} value={rupees(stats.paid)} label={h.paid} />
        </motion.div>

        {/* Pickups to do */}
        <Section icon={<CalendarClock />} title={h.pickups} count={upcoming.length}>
          {upcoming.length === 0 ? (
            <Empty icon={<Package />} title={h.noPickups} hint={h.noPickupsHint} />
          ) : (
            upcoming.map((p) => (
              <Card key={p.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xl font-bold text-navy">{when(p, h, locale)}</p>
                  <span className="shrink-0 rounded-full bg-[#FFF9E6] px-3 py-1 text-sm font-bold text-navy ring-1 ring-gold">
                    {h.status[p.status]}
                  </span>
                </div>
                <p className="flex gap-2 text-lg text-ink">
                  <MapPin className="mt-1 size-5 shrink-0 text-gold" />
                  <span>{p.address ?? p.pincode}{p.address && <span className="text-muted"> · {p.pincode}</span>}</span>
                </p>
                {p.note && <p className="rounded-xl bg-sunk px-3 py-2 text-muted">“{p.note}”</p>}
                <p className="font-mono text-sm text-faint">{p.code}</p>
                {p.address && (
                  <BigButton href={mapsLink(p.address, p.pincode)} className="bg-navy text-white">
                    <Navigation className="size-6" /> {h.directions}
                  </BigButton>
                )}
              </Card>
            ))
          )}
        </Section>

        {/* Finished pickups */}
        <Section icon={<CheckCircle2 />} title={h.history} count={done.length}>
          {done.length === 0 ? (
            <p className="px-1 text-muted">{h.noHistory}</p>
          ) : (
            <Card className="divide-y divide-line p-0">
              {done.slice(0, 10).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold text-ink">{p.completed_at ? day(p.completed_at, locale) : ""}</p>
                    <p className="font-mono text-xs text-faint">{p.code}</p>
                  </div>
                  <p className="font-mono text-lg font-bold text-navy">{p.total_weight_kg != null ? `${Number(p.total_weight_kg)} kg` : ""}</p>
                </div>
              ))}
            </Card>
          )}
        </Section>

        {/* Area */}
        <Section icon={<MapPin />} title={h.area}>
          {data.areas.length === 0 ? (
            <p className="px-1 text-muted">{h.noArea}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {data.areas.map((a) => (
                <span key={a.pincode} className="rounded-xl border-2 border-line bg-white px-4 py-2">
                  <b className="font-mono text-lg text-navy">{a.pincode}</b>
                  {a.area && <span className="ml-2 text-muted">{a.area}</span>}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* Details */}
        <Section title={h.details}>
          <Card className="divide-y divide-line p-0">
            {data.phone && <Line k={h.phone} v={data.phone.replace(/^\+91/, "+91 ")} />}
            {vehicle && <Line k={h.vehicle} v={vehicle} />}
            {data.shopAddress && <Line k={h.shop} v={data.shopAddress} />}
            {data.payTo && <Line k={h.payTo} v={data.payTo} />}
          </Card>
        </Section>

        {/* Help */}
        <Section title={h.help}>
          <div className="grid grid-cols-2 gap-3">
            <BigButton href={helpLink(data.name, data.code)} className="bg-[#1F8F4E] text-white">
              <MessageCircle className="size-6" /> {h.whatsapp}
            </BigButton>
            <BigButton href={`tel:+${HELP_PHONE}`} className="border-2 border-navy bg-white text-navy">
              <Phone className="size-6" /> {h.call}
            </BigButton>
          </div>
        </Section>
      </motion.div>
    </MotionConfig>
  );
}

// ---- small pieces ----

const rise = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div variants={rise} className={cn("rounded-2xl border border-line bg-white p-4 shadow-sm", className)}>
      {children}
    </motion.div>
  );
}

function Section({ icon, title, count, children }: { icon?: ReactNode; title: string; count?: number; children: ReactNode }) {
  return (
    <motion.section variants={rise} className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-xl font-bold text-navy [&_svg]:size-6 [&_svg]:text-gold">
        {icon}
        {title}
        {count ? <span className="ml-auto rounded-full bg-navy px-3 py-0.5 text-base text-white">{count}</span> : null}
      </h2>
      {children}
    </motion.section>
  );
}

const Stat = ({ icon, value, label }: { icon: ReactNode; value: string; label: string }) => (
  <div className="flex flex-col items-center gap-1 rounded-2xl bg-navy px-2 py-4 text-center text-white [&_svg]:size-6 [&_svg]:text-gold">
    {icon}
    <span className="font-mono text-2xl font-bold">{value}</span>
    <span className="text-xs leading-tight text-white/80">{label}</span>
  </div>
);

const Empty = ({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white px-4 py-8 text-center [&_svg]:size-10 [&_svg]:text-slate">
    {icon}
    <p className="text-lg font-bold text-ink">{title}</p>
    <p className="text-muted">{hint}</p>
  </div>
);

const Line = ({ k, v }: { k: string; v: string }) => (
  <div className="flex flex-col gap-0.5 px-4 py-3">
    <span className="text-sm text-muted">{k}</span>
    <span className="break-words font-semibold text-ink">{v}</span>
  </div>
);

function BigButton({ href, onClick, className, children }: { href?: string; onClick?: () => void; className: string; children: ReactNode }) {
  const cls = cn("flex h-16 items-center justify-center gap-2 rounded-2xl px-4 text-lg font-bold transition-transform active:scale-[0.98]", className);
  if (href) {
    const external = href.startsWith("http");
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

// ---- dates ----

const day = (iso: string, locale: string) => new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });

/** "Today, 10:00 am", "Tomorrow, 9:30 am", or "12 Nov, 10:00 am". Falls back to the request date. */
function when(p: PickupLite, h: HomeStrings, locale: string) {
  if (!p.slot_date) return day(p.requested_at, locale);
  const [y, m, d] = p.slot_date.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86_400_000);
  const label = diff === 0 ? h.today : diff === 1 ? h.tomorrow : date.toLocaleDateString(locale, { day: "numeric", month: "short" });
  if (!p.start_time) return label;
  const [hh, mm] = p.start_time.split(":").map(Number);
  const time = new Date(2000, 0, 1, hh, mm).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return `${label}, ${time}`;
}
