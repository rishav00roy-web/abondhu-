"use client";

import { Check, Eye, Loader2, LogOut, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { digitsOnly } from "@/lib/aadhaar";
import { authedFetch, getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Status = "submitted" | "approved" | "rejected" | "draft";

interface VendorRow {
  id: string;
  application_code: string | null;
  business_name: string | null;
  vendor_type: string | null;
  vehicle_type: string | null;
  status: Status;
  submitted_at: string | null;
  rejection_reason: string | null;
  profile: { full_name: string | null; phone: string | null } | null;
  address: { line1: string; pincode: string } | null;
  kyc: { aadhaar_last4: string | null; status: string }[];
  docs: { doc_type: string; storage_path: string }[];
  payout: { method: string; upi_id: string | null; account_number: string | null; ifsc: string | null; account_holder: string | null }[];
}

const SELECT = `id, application_code, business_name, vendor_type, vehicle_type, status, submitted_at, rejection_reason,
  profile:profiles!vendors_id_fkey(full_name, phone),
  address:addresses!vendors_address_id_fkey(line1, pincode),
  kyc:vendor_kyc(aadhaar_last4, status),
  docs:vendor_documents(doc_type, storage_path),
  payout:vendor_payout_accounts(method, upi_id, account_number, ifsc, account_holder)`;

/** Admin: log in with phone OTP, see applications, approve or reject. */
export function AdminPanel() {
  const sb = getSupabase();
  const [state, setState] = useState<"loading" | "login" | "otp" | "denied" | "ready">("loading");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Status>("submitted");
  const [rows, setRows] = useState<VendorRow[]>([]);

  const check = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    if (!data.session) return setState("login");
    const { data: p } = await sb.from("profiles").select("role").eq("id", data.session.user.id).single();
    setState(p?.role === "admin" ? "ready" : "denied");
  }, [sb]);

  useEffect(() => {
    // Session check on load; state is set after the network calls resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
  }, [check]);

  const load = useCallback(async () => {
    if (!sb) return;
    const { data, error } = await sb.from("vendors").select(SELECT).eq("status", tab).order("submitted_at", { ascending: false, nullsFirst: false });
    if (error) setErr(error.message);
    setRows((data as unknown as VendorRow[]) ?? []);
  }, [sb, tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state === "ready") load();
  }, [state, load]);

  const act = async (fn: () => Promise<void>) => {
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (!sb) return <Page><p>Supabase keys are not set yet.</p></Page>;
  if (state === "loading") return <Page><Loader2 className="size-6 animate-spin" /></Page>;

  if (state === "login" || state === "otp") {
    return (
      <Page>
        <h1 className="text-2xl font-bold text-navy">Admin login</h1>
        {state === "login" ? (
          <>
            <input className={input} inputMode="numeric" placeholder="10-digit mobile" value={phone} onChange={(e) => setPhone(digitsOnly(e.target.value).slice(0, 10))} />
            <button className={btn} disabled={busy || phone.length !== 10} onClick={() => act(async () => {
              const { error } = await sb.auth.signInWithOtp({ phone: "+91" + phone, options: { shouldCreateUser: false } });
              if (error) throw error;
              setState("otp");
            })}>Send code</button>
          </>
        ) : (
          <>
            <input className={input} inputMode="numeric" placeholder="6-digit code" value={otp} onChange={(e) => setOtp(digitsOnly(e.target.value).slice(0, 6))} />
            <button className={btn} disabled={busy || otp.length !== 6} onClick={() => act(async () => {
              const { error } = await sb.auth.verifyOtp({ phone: "+91" + phone, token: otp, type: "sms" });
              if (error) throw error;
              await check();
            })}>Log in</button>
          </>
        )}
        {err && <p className="text-danger">{err}</p>}
      </Page>
    );
  }

  if (state === "denied") {
    return (
      <Page>
        <p>This account is not an admin.</p>
        <button className={btn} onClick={async () => { await sb.auth.signOut(); setState("login"); }}>Log out</button>
      </Page>
    );
  }

  return (
    <div className="min-h-dvh bg-sunk">
      <header className="flex items-center gap-4 bg-navy px-6 py-4 text-white">
        <span className="font-serif text-xl">Abondhu admin</span>
        <button className="ml-auto flex items-center gap-2 text-sm" onClick={async () => { await sb.auth.signOut(); setState("login"); }}>
          <LogOut className="size-4" /> Log out
        </button>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex gap-2">
          {(["submitted", "approved", "rejected", "draft"] as Status[]).map((s) => (
            <button key={s} onClick={() => setTab(s)} className={cn("rounded-full px-4 py-2 text-sm font-semibold capitalize", tab === s ? "bg-navy text-white" : "bg-white text-navy")}>
              {s === "submitted" ? "To review" : s === "draft" ? "Not finished" : s}
            </button>
          ))}
        </div>
        {err && <p className="mb-4 rounded bg-red-50 p-3 text-danger">{err}</p>}
        {rows.length === 0 && <p className="text-muted">Nothing here.</p>}
        <div className="grid gap-4">
          {rows.map((v) => <VendorCard key={v.id} v={v} busy={busy} act={act} reload={load} />)}
        </div>
      </main>
    </div>
  );
}

function VendorCard({ v, busy, act, reload }: { v: VendorRow; busy: boolean; act: (fn: () => Promise<void>) => Promise<void>; reload: () => Promise<void> }) {
  const sb = getSupabase()!;
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const pay = v.payout[0];

  const setStatus = (status: "approved" | "rejected") =>
    act(async () => {
      let reason: string | null = null;
      if (status === "rejected") {
        reason = window.prompt("Reason (the vendor will see this):")?.trim() || null;
        if (!reason) return;
      }
      const { data: s } = await sb.auth.getSession();
      const { error } = await sb.from("vendors").update({
        status, rejection_reason: reason, reviewed_at: new Date().toISOString(), reviewed_by: s.session?.user.id,
      }).eq("id", v.id);
      if (error) throw error;
      if (status === "approved") await sb.from("vendor_kyc").update({ status: "verified", verified_at: new Date().toISOString(), reviewed_by: s.session?.user.id }).eq("vendor_id", v.id);
      await reload();
    });

  const openDoc = (path: string) =>
    act(async () => {
      const w = window.open("about:blank", "_blank");
      const { url } = await authedFetch("/api/admin/doc-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path }) });
      if (w) w.location.href = url;
    });

  const reveal = () =>
    act(async () => {
      const r = await authedFetch("/api/admin/aadhaar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vendorId: v.id }) });
      setAadhaar(r.aadhaar);
    });

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-bold text-navy">{v.profile?.full_name ?? "No name"}</h2>
        <span className="font-mono text-sm text-muted">{v.application_code}</span>
        <span className="ml-auto text-sm text-muted">{v.submitted_at && new Date(v.submitted_at).toLocaleString("en-IN")}</span>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Item k="Phone" v={v.profile?.phone} />
        <Item k="Type / vehicle" v={[v.vendor_type, v.vehicle_type].filter(Boolean).join(" · ")} />
        <Item k="Shop" v={v.business_name} />
        <Item k="Address" v={v.address ? `${v.address.line1}, ${v.address.pincode}` : null} />
        <Item k="Aadhaar" v={aadhaar ?? (v.kyc[0]?.aadhaar_last4 ? `XXXX XXXX ${v.kyc[0].aadhaar_last4}` : null)} />
        <Item k="Payout" v={pay ? (pay.method === "upi" ? `UPI ${pay.upi_id}` : `${pay.account_holder} · ${pay.account_number} · ${pay.ifsc}`) : null} />
        {v.rejection_reason && <Item k="Rejected because" v={v.rejection_reason} />}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {v.docs.map((d) => (
          <button key={d.storage_path} onClick={() => openDoc(d.storage_path)} className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm">
            <Eye className="size-4" /> {d.doc_type.replace("_", " ")}
          </button>
        ))}
        {v.kyc.length > 0 && !aadhaar && (
          <button onClick={reveal} className="rounded-full border border-line px-3 py-1.5 text-sm">Show full Aadhaar (logged)</button>
        )}
      </div>
      {v.status === "submitted" && (
        <div className="mt-5 flex gap-3">
          <button disabled={busy} onClick={() => setStatus("approved")} className="flex items-center gap-2 rounded-lg bg-forest px-5 py-3 font-semibold text-white disabled:opacity-50">
            <Check className="size-5" /> Approve
          </button>
          <button disabled={busy} onClick={() => setStatus("rejected")} className="flex items-center gap-2 rounded-lg border border-danger px-5 py-3 font-semibold text-danger disabled:opacity-50">
            <X className="size-5" /> Reject
          </button>
        </div>
      )}
    </article>
  );
}

const Item = ({ k, v }: { k: string; v?: string | null }) => (
  <div>
    <dt className="text-muted">{k}</dt>
    <dd className="font-medium text-ink">{v || "—"}</dd>
  </div>
);

const input = "h-12 w-full rounded-lg border-2 border-line bg-white px-3 text-lg outline-none focus:border-forest";
const btn = "h-12 rounded-lg bg-navy px-5 font-semibold text-white disabled:opacity-50";
const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">{children}</div>
);
