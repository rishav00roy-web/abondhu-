"use client";

// Admin: pickups customers have booked that are not finished yet, newest first.
// Every dealer covering the pincode is told about a new pickup; the first to accept takes it.
// Waiting pickups also list those dealers with a one-tap WhatsApp message (wa.me can't send by itself).
// One still waiting after an hour is flagged so the team can call a dealer.
import { Eye, MessageCircle, Phone, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { alertText, placeLabel, whatsappLink } from "@/lib/dealer-alert";
import { SITE_URL } from "@/lib/site-data";
import { getSupabase } from "@/lib/supabase";
import { Panel, Skeleton } from "./AdminHome";
import { openPhoto } from "./open-photo";

interface Row {
  id: string;
  code: string;
  status: string;
  pincode: string;
  customer_note: string | null;
  requested_at: string;
  customer: { full_name: string | null; phone: string | null } | null;
  address: { line1: string } | null;
  photos: { storage_path: string }[];
  place: { area_name: string | null } | null;
}

/** An approved dealer and the pincodes they cover. */
interface Dealer {
  name: string;
  phone: string;
  pincodes: string[];
}

const OPEN = ["requested", "assigned", "accepted", "on_the_way", "weighed"];
const HOUR = 60 * 60 * 1000;
/** True when nobody has accepted the pickup within an hour of booking. */
const unclaimed = (p: Row, now: number) => p.status === "requested" && now - new Date(p.requested_at).getTime() > HOUR;

export function PickupsPanel({ version }: { version: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    Promise.all([
      sb.from("pickups")
        .select("id, code, status, pincode, customer_note, requested_at, customer:profiles!pickups_customer_id_fkey(full_name, phone), address:addresses!pickups_address_id_fkey(line1), photos:pickup_photos(storage_path), place:pincodes(area_name)")
        .in("status", OPEN)
        .order("requested_at", { ascending: false })
        .limit(50),
      sb.from("vendors")
        .select("business_name, profile:profiles!vendors_id_fkey(full_name, phone), areas:vendor_service_areas(pincode)")
        .eq("status", "approved"),
    ]).then(([picks, vends]) => {
      const e = picks.error ?? vends.error;
      if (e) return setError(e.message);
      setRows(picks.data as unknown as Row[]);
      type V = { business_name: string | null; profile: { full_name: string | null; phone: string | null } | null; areas: { pincode: string }[] };
      setDealers(
        (vends.data as unknown as V[])
          .filter((v) => v.profile?.phone)
          .map((v) => ({ name: v.business_name || v.profile!.full_name || "Dealer", phone: v.profile!.phone!, pincodes: v.areas.map((a) => a.pincode) })),
      );
    });
  }, [version]);

  return (
    <Panel title={rows && rows.length ? `Pickups booked · ${rows.length}` : "Pickups booked"} icon={Truck}>
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : rows === null ? (
        <Skeleton rows={3} />
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted">No open pickups. New bookings from the website show here.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((p) => (
            <li key={p.id} className="grid gap-1 rounded-lg border border-line p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-navy">{p.code}</span>
                  {unclaimed(p, now) && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-danger">No dealer yet</span>}
                </span>
                <span className="text-xs text-muted">
                  {new Date(p.requested_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <p className="font-semibold text-ink">{p.customer?.full_name ?? "Customer"}</p>
              {p.customer?.phone && (
                <a href={`tel:${p.customer.phone}`} className="inline-flex items-center gap-1.5 font-mono text-forest underline">
                  <Phone className="size-3.5" aria-hidden /> {p.customer.phone}
                </a>
              )}
              <p className="text-muted">{p.address?.line1 ? `${p.address.line1}, ` : ""}{p.pincode}</p>
              {p.customer_note && <p className="text-ink">{p.customer_note}</p>}
              {p.photos.map((ph) => (
                <button
                  key={ph.storage_path}
                  type="button"
                  onClick={() => openPhoto(ph.storage_path, "pickup-photos").catch((e: Error) => setError(e.message))}
                  className="flex items-center gap-1.5 justify-self-start rounded-full border border-line px-3 py-1.5 text-sm"
                >
                  <Eye className="size-4" aria-hidden /> Scrap photo
                </button>
              ))}
              {p.status === "requested" && <DealerWhatsApp pickup={p} dealers={dealers.filter((d) => d.pincodes.includes(p.pincode))} />}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** One WhatsApp button per dealer covering the pickup's pincode, with the new-pickup message filled in. */
function DealerWhatsApp({ pickup: p, dealers }: { pickup: Row; dealers: Dealer[] }) {
  if (dealers.length === 0) return <p className="text-xs text-danger">No approved dealer covers {p.pincode} yet.</p>;
  const text = alertText({ place: placeLabel(p.pincode, p.place?.area_name), note: p.customer_note, code: p.code, siteUrl: SITE_URL });
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">Tell dealers:</span>
      {dealers.map((d) => (
        <a
          key={d.phone}
          href={whatsappLink(d.phone, text)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm"
        >
          <MessageCircle className="size-4 text-[#1F8F4E]" aria-hidden /> {d.name}
        </a>
      ))}
    </div>
  );
}
