"use client";

// Admin: pickups customers have booked that are not finished yet, newest first.
// Read-only for now; giving a pickup to a vendor comes in a later release.
import { Phone, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import { Panel, Skeleton } from "./AdminHome";

interface Row {
  id: string;
  code: string;
  status: string;
  pincode: string;
  customer_note: string | null;
  requested_at: string;
  customer: { full_name: string | null; phone: string | null } | null;
  address: { line1: string } | null;
}

const OPEN = ["requested", "assigned", "accepted", "on_the_way", "weighed"];

export function PickupsPanel({ version }: { version: number }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.from("pickups")
      .select("id, code, status, pincode, customer_note, requested_at, customer:profiles!pickups_customer_id_fkey(full_name, phone), address:addresses!pickups_address_id_fkey(line1)")
      .in("status", OPEN)
      .order("requested_at", { ascending: false })
      .limit(50)
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        else setRows(data as unknown as Row[]);
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
                <span className="font-mono font-semibold text-navy">{p.code}</span>
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
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
