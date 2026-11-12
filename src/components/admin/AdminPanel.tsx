"use client";

import { MotionConfig } from "framer-motion";
import { Check, ExternalLink, Eye, Loader2, LogOut, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getSupabase, postJson } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";
import { isValid, type VendorStatus } from "@/lib/vendor";
import { PickupsPanel } from "./PickupsPanel";
import { StaffReview } from "./StaffReview";
import { ActivityPanel, AreaPanel, EmptyList, ReviewNudge, StatCards, useOverview, type Tab } from "./AdminHome";

const TAB_TITLES: Record<Tab, string> = {
  submitted: "Applications to review",
  approved: "Approved vendors",
  rejected: "Rejected applications",
  draft: "Unfinished sign-ups",
  suspended: "Suspended vendors",
};
const isTab = (s: string | null): s is Tab => !!s && s in TAB_TITLES;

interface VendorRow {
  id: string;
  application_code: string | null;
  business_name: string | null;
  vendor_type: string | null;
  vehicle_type: string | null;
  status: VendorStatus;
  submitted_at: string | null;
  rejection_reason: string | null;
  profile: { full_name: string | null; phone: string | null; email: string | null } | null;
  address: { line1: string; pincode: string } | null;
  kyc: { aadhaar_last4: string | null; status: string }[];
  docs: { doc_type: string; storage_path: string }[];
  payout: { method: string; upi_id: string | null; account_number: string | null; ifsc: string | null; account_holder: string | null }[];
  staff: { full_name: string; status: string }[];
}

const SELECT = `id, application_code, business_name, vendor_type, vehicle_type, status, submitted_at, rejection_reason,
  profile:profiles!vendors_id_fkey(full_name, phone, email),
  address:addresses!vendors_address_id_fkey(line1, pincode),
  kyc:vendor_kyc(aadhaar_last4, status),
  docs:vendor_documents(doc_type, storage_path),
  payout:vendor_payout_accounts(method, upi_id, account_number, ifsc, account_holder),
  staff:vendor_staff(full_name, status)`;

/** Admin: log in, see the home overview and applications, approve or reject. */
export function AdminPanel() {
  const sb = getSupabase();
  const [state, setState] = useState<"loading" | "login" | "denied" | "ready">("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { busy, err, run: act } = useAction();
  const [loadErr, setLoadErr] = useState("");
  // The selected list lives in the URL (?tab=approved) so a refresh or a shared link keeps it.
  const [tab, setTabState] = useState<Tab>(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    return isTab(t) ? t : "submitted";
  });
  const [rows, setRows] = useState<VendorRow[] | null>(null);
  const [version, setVersion] = useState(0);
  const overview = useOverview(state === "ready", version);

  const setTab = (t: Tab) => {
    setTabState(t);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", t);
    window.history.replaceState(null, "", url);
  };
  const showList = (t: Tab) => {
    setTab(t);
    document.getElementById("vendor-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const check = useCallback(async () => {
    if (!sb) return;
    const { data } = await sb.auth.getSession();
    if (!data.session) return setState("login");
    const { data: p } = await sb.from("profiles").select("role, is_blocked").eq("id", data.session.user.id).single();
    setState(p?.role === "admin" && !p.is_blocked ? "ready" : "denied");
  }, [sb]);

  useEffect(() => {
    // Session check on load; state is set after the network calls resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
  }, [check]);

  const load = useCallback(async () => {
    if (!sb) return;
    setRows(null);
    const { data, error } = await sb.from("vendors").select(SELECT).eq("status", tab).order("submitted_at", { ascending: false, nullsFirst: false });
    setLoadErr(error?.message ?? "");
    setRows((data as unknown as VendorRow[]) ?? []);
  }, [sb, tab]);

  // After an approval or rejection, reload the list and the overview numbers.
  const reloadAll = useCallback(async () => {
    await load();
    setVersion((n) => n + 1);
  }, [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (state === "ready") load();
  }, [state, load]);

  if (!sb) return <Page><p>Supabase keys are not set yet.</p></Page>;
  if (state === "loading") return <Page><Loader2 className="size-6 animate-spin" /></Page>;

  if (state === "login") {
    return (
      <Page>
        <h1 className="text-2xl font-bold text-navy">Admin login</h1>
        <form className="contents" onSubmit={(e) => { e.preventDefault(); act(async () => {
          const { error } = await sb.auth.signInWithPassword({ email, password });
          if (error) throw error;
          await check();
        }); }}>
          <input className={input} type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value.trim())} />
          <input className={input} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className={btn} disabled={busy || !isValid.email(email) || !password}>Log in</button>
        </form>
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

  const summary = overview.data?.summary ?? null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-sunk">
        <header className="bg-midnight text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
            <span className="font-serif text-xl">Abondhu <span className="text-gold">admin</span></span>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <a href="/" target="_blank" rel="noreferrer" className={headLink}>Site <ExternalLink className="size-3.5" aria-hidden /></a>
              <a href="/partner" target="_blank" rel="noreferrer" className={headLink}>Vendor sign-up <ExternalLink className="size-3.5" aria-hidden /></a>
              <button className={headLink} onClick={async () => { await sb.auth.signOut(); setState("login"); }}>
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
            </nav>
          </div>
        </header>
        <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <h1 className="font-serif text-3xl text-navy">{greeting}</h1>
              <p className="mt-1 text-sm text-muted">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} · Jorhat
              </p>
            </div>
            <button
              type="button"
              onClick={reloadAll}
              className="ml-auto flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-semibold text-navy transition-colors hover:border-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <RefreshCw className="size-4" aria-hidden /> Refresh
              {overview.data && <span className="font-normal text-muted">· {overview.data.loadedAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span>}
            </button>
          </div>

          {(err || loadErr || overview.error) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-danger">{err || loadErr || overview.error}</p>}

          <ReviewNudge count={summary?.byStatus.submitted ?? 0} onReview={() => showList("submitted")} />
          <StatCards summary={summary} tab={tab} onTab={setTab} />

          <div className="grid items-start gap-6 lg:grid-cols-3">
            <div className="grid gap-6 lg:col-span-2">
              <StaffReview version={version} />
              <section id="vendor-list" className="grid scroll-mt-6 gap-4" aria-busy={rows === null}>
                <h2 className="font-serif text-2xl text-navy">
                  {TAB_TITLES[tab]}
                  {rows && rows.length > 0 && <span className="ml-2 font-sans text-base text-muted">{rows.length}</span>}
                </h2>
                {rows === null ? (
                  <div className="grid gap-4">
                    {[0, 1].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-white motion-reduce:animate-none" />)}
                  </div>
                ) : rows.length === 0 ? (
                  <EmptyList tab={tab} />
                ) : (
                  rows.map((v) => <VendorCard key={v.id} v={v} busy={busy} act={act} reload={reloadAll} />)
                )}
              </section>
            </div>
            <aside className="grid gap-6">
              <PickupsPanel version={version} />
              <AreaPanel areas={overview.data?.areas ?? null} />
              <ActivityPanel activity={overview.data?.activity ?? null} />
            </aside>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

function VendorCard({ v, busy, act, reload }: { v: VendorRow; busy: boolean; act: (fn: () => Promise<void>) => Promise<void>; reload: () => Promise<void> }) {
  const sb = getSupabase()!;
  const [aadhaar, setAadhaar] = useState<string | null>(null);
  const pay = v.payout[0];

  const setStatus = (status: "approved" | "rejected" | "suspended") =>
    act(async () => {
      let reason: string | null = null;
      if (status !== "approved") {
        const ask = status === "suspended"
          ? "Why pause this vendor? (they will see this; pickups not yet started go back to the open list)"
          : "Reason (the vendor will see this):";
        reason = window.prompt(ask)?.trim() || null;
        if (!reason) return;
      }
      const { data: s } = await sb.auth.getSession();
      const { error } = await sb.from("vendors").update({
        status, rejection_reason: reason, reviewed_at: new Date().toISOString(), reviewed_by: s.session?.user.id,
      }).eq("id", v.id);
      if (error) throw error;
      if (status === "approved" && v.status === "submitted") await sb.from("vendor_kyc").update({ status: "verified", verified_at: new Date().toISOString(), reviewed_by: s.session?.user.id }).eq("vendor_id", v.id);
      await reload();
    });

  const openDoc = (path: string) =>
    act(async () => {
      const w = window.open("about:blank", "_blank");
      const { url } = await postJson("/api/admin/doc-url", { path });
      if (w) w.location.href = url;
    });

  const reveal = () =>
    act(async () => {
      const r = await postJson("/api/admin/aadhaar", { vendorId: v.id });
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
        {v.profile?.email && <Item k="Email" v={v.profile.email} />}
        <Item k="Type / vehicle" v={[v.vendor_type?.replaceAll("_", " "), v.vehicle_type].filter(Boolean).join(" · ")} />
        <Item k="Shop" v={v.business_name} />
        <Item k="Address" v={v.address ? `${v.address.line1}, ${v.address.pincode}` : null} />
        <Item k="Aadhaar" v={aadhaar ?? (v.kyc[0]?.aadhaar_last4 ? `XXXX XXXX ${v.kyc[0].aadhaar_last4}` : null)} />
        <Item k="Payout" v={pay ? (pay.method === "upi" ? `UPI ${pay.upi_id}` : `${pay.account_holder} · ${pay.account_number} · ${pay.ifsc}`) : null} />
        {v.staff.length > 0 && <Item k="Workers" v={v.staff.map((p) => `${p.full_name} (${p.status})`).join(", ")} />}
        {v.rejection_reason && <Item k={v.status === "suspended" ? "Suspended because" : v.status === "rejected" ? "Rejected because" : "Last reason given"} v={v.rejection_reason} />}
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
      {v.status === "approved" && (
        <button disabled={busy} onClick={() => setStatus("suspended")} className="mt-5 rounded-lg border border-danger px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50">
          Suspend vendor
        </button>
      )}
      {v.status === "suspended" && (
        <button disabled={busy} onClick={() => setStatus("approved")} className="mt-5 flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          <Check className="size-4" /> Reinstate vendor
        </button>
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

const headLink = "flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-gold";
const input = "h-12 w-full rounded-lg border-2 border-line bg-white px-3 text-lg outline-none focus:border-forest";
const btn = "h-12 rounded-lg bg-navy px-5 font-semibold text-white disabled:opacity-50";
const Page = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-4 p-6">{children}</div>
);
