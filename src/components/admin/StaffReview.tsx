"use client";

// Admin: workers that approved vendors have added, waiting to be checked.
// Look at the Aadhaar card photo and the face photo, then approve or reject.
import { Check, Eye, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getSupabase, postJson } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";

interface Row {
  id: string;
  full_name: string;
  phone: string;
  aadhaar_last4: string;
  aadhaar_photo_path: string;
  face_photo_path: string;
  created_at: string;
  vendor: { application_code: string | null; business_name: string | null; profile: { full_name: string | null } | null } | null;
}

const SELECT = `id, full_name, phone, aadhaar_last4, aadhaar_photo_path, face_photo_path, created_at,
  vendor:vendors!vendor_staff_vendor_id_fkey(application_code, business_name, profile:profiles!vendors_id_fkey(full_name))`;

export function StaffReview({ version }: { version: number }) {
  const sb = getSupabase()!;
  const [rows, setRows] = useState<Row[] | null>(null);
  const [aadhaar, setAadhaar] = useState<Record<string, string>>({});
  const { busy, err, run } = useAction();

  const load = useCallback(async () => {
    const { data, error } = await sb.from("vendor_staff").select(SELECT).eq("status", "pending").order("created_at");
    if (error) throw error;
    setRows(data as unknown as Row[]);
  }, [sb]);

  useEffect(() => {
    run(load);
  }, [run, load, version]);

  const decide = (r: Row, status: "approved" | "rejected") =>
    run(async () => {
      let reason: string | null = null;
      if (status === "rejected") {
        reason = window.prompt(`Why is ${r.full_name} not approved? (the vendor will see this)`)?.trim() || null;
        if (!reason) return;
      }
      const { data: s } = await sb.auth.getSession();
      const { error } = await sb
        .from("vendor_staff")
        .update({ status, rejection_reason: reason, reviewed_at: new Date().toISOString(), reviewed_by: s.session?.user.id })
        .eq("id", r.id);
      if (error) throw error;
      await load();
    });

  const openDoc = (path: string) =>
    run(async () => {
      const w = window.open("about:blank", "_blank");
      const { url } = await postJson("/api/admin/doc-url", { path });
      if (w) w.location.href = url;
    });

  const reveal = (id: string) =>
    run(async () => {
      const r = await postJson("/api/admin/aadhaar", { staffId: id });
      setAadhaar((a) => ({ ...a, [id]: r.aadhaar }));
    });

  if (rows === null && !err) return null;
  if (rows?.length === 0) return null; // nothing waiting: keep the page quiet

  return (
    <section className="grid gap-4" aria-busy={busy}>
      <h2 className="font-serif text-2xl text-navy">
        Workers to check {rows && <span className="ml-2 font-sans text-base text-muted">{rows.length}</span>}
      </h2>
      {err && <p role="alert" className="rounded-lg bg-red-50 p-3 text-danger">{err}</p>}
      {rows?.map((r) => (
        <article key={r.id} className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline gap-3">
            <h3 className="text-lg font-bold text-navy">{r.full_name}</h3>
            <span className="text-sm text-muted">
              works for {r.vendor?.business_name || r.vendor?.profile?.full_name || "vendor"}
              {r.vendor?.application_code && <span className="ml-1 font-mono">{r.vendor.application_code}</span>}
            </span>
            <span className="ml-auto text-sm text-muted">{new Date(r.created_at).toLocaleString("en-IN")}</span>
          </div>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Phone</dt>
              <dd className="font-medium text-ink">{r.phone}</dd>
            </div>
            <div>
              <dt className="text-muted">Aadhaar</dt>
              <dd className="font-medium text-ink">{aadhaar[r.id] ?? `XXXX XXXX ${r.aadhaar_last4}`}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => openDoc(r.aadhaar_photo_path)} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm">
              <Eye className="size-4" /> aadhaar photo
            </button>
            <button onClick={() => openDoc(r.face_photo_path)} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm">
              <Eye className="size-4" /> face photo
            </button>
            {!aadhaar[r.id] && (
              <button onClick={() => reveal(r.id)} className="rounded-full border border-line px-3 py-1.5 text-sm">Show full Aadhaar (logged)</button>
            )}
          </div>
          <div className="mt-5 flex gap-3">
            <button disabled={busy} onClick={() => decide(r, "approved")} className="flex items-center gap-2 rounded-lg bg-forest px-5 py-3 font-semibold text-white disabled:opacity-50">
              <Check className="size-5" /> Approve
            </button>
            <button disabled={busy} onClick={() => decide(r, "rejected")} className="flex items-center gap-2 rounded-lg border border-danger px-5 py-3 font-semibold text-danger disabled:opacity-50">
              <X className="size-5" /> Reject
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
