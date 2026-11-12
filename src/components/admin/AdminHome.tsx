"use client";

// The admin home: status cards (which also pick the list below), vendors by area,
// and recent activity from the audit log. Reads only; every change still goes
// through the vendor cards in AdminPanel.
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Eye, FilePen, Inbox, MapPin, PauseCircle, ShieldCheck, Sparkles, UserPlus, XCircle,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  byArea, describe, summarize, timeAgo,
  type ActivityLine, type AreaRow, type AuditLite, type Status, type Summary, type Tone, type VendorLite,
} from "@/lib/admin-stats";
import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export type Tab = Status;

const PAGE = 1000; // Supabase returns at most 1000 rows per request, so read in pages.

async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>) {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

interface VendorQueryRow {
  id: string;
  status: Status;
  created_at: string;
  profile: { full_name: string | null } | null;
  address: { pincode: string } | null;
}

// Only single fields are pulled out of the audit JSON, never the whole old/new row.
const AUDIT_SELECT = `id, action, table_name, record_id, actor_id, at,
  new_status:new_data->>status, old_status:old_data->>status,
  new_role:new_data->>role, old_role:old_data->>role,
  new_blocked:new_data->>is_blocked, old_blocked:old_data->>is_blocked,
  kyc_vendor:new_data->>vendor_id, profile_name:new_data->>full_name`;

export interface Overview {
  summary: Summary;
  areas: AreaRow[];
  activity: ActivityLine[];
  loadedAt: Date;
}

/** Loads the admin home numbers once `enabled`. Bump `version` to reload (for example after an approval). */
export function useOverview(enabled: boolean, version: number) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const [vendorRows, pincodes, audit, session] = await Promise.all([
        fetchAll<VendorQueryRow>((from, to) =>
          sb.from("vendors")
            .select("id, status, created_at, profile:profiles!vendors_id_fkey(full_name), address:addresses!vendors_address_id_fkey(pincode)")
            .order("id").range(from, to)),
        sb.from("pincodes").select("pincode, area_name").eq("is_active", true),
        sb.from("audit_log").select(AUDIT_SELECT)
          .in("table_name", ["vendors", "vendor_kyc", "vendor_aadhaar_vault", "profiles"])
          .order("at", { ascending: false }).limit(80),
        sb.auth.getSession(),
      ]);
      if (pincodes.error) throw new Error(pincodes.error.message);
      if (audit.error) throw new Error(audit.error.message);

      const vendors: VendorLite[] = vendorRows.map((r) => ({
        id: r.id, status: r.status, created_at: r.created_at, name: r.profile?.full_name ?? null, pincode: r.address?.pincode ?? null,
      }));
      const names = new Map(vendors.filter((x) => x.name).map((x) => [x.id, x.name as string]));
      const me = session.data.session?.user.id ?? null;
      const activity = ((audit.data ?? []) as unknown as AuditLite[])
        .map((row) => describe(row, names, me))
        .filter((x): x is ActivityLine => x !== null)
        .slice(0, 8);

      setData({ summary: summarize(vendors), areas: byArea(vendors, pincodes.data ?? []), activity, loadedAt: new Date() });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    // Load on mount and whenever `version` changes; state is set after the network calls resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (enabled) load();
  }, [enabled, load, version]);

  return { data, error, reload: load };
}

/* ------------------------------------------------------------------------- */

const STATUS_CARDS: { status: Tab; label: string; hint: string; icon: LucideIcon; accent: string }[] = [
  { status: "submitted", label: "To review", hint: "Waiting for you", icon: Inbox, accent: "text-navy" },
  { status: "approved", label: "Approved", hint: "Active vendors", icon: CheckCircle2, accent: "text-forest" },
  { status: "rejected", label: "Rejected", hint: "Sent back with a reason", icon: XCircle, accent: "text-danger" },
  { status: "draft", label: "Not finished", hint: "Started, not submitted", icon: FilePen, accent: "text-muted" },
  { status: "suspended", label: "Suspended", hint: "Paused by you", icon: PauseCircle, accent: "text-danger" },
];

const rise = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };

/** Five status cards that double as the list filter, plus sign-ups this week. */
export function StatCards({ summary, tab, onTab }: { summary: Summary | null; tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      {STATUS_CARDS.map(({ status, label, hint, icon: Icon, accent }) => {
        const active = tab === status;
        return (
          <motion.button
            key={status}
            variants={rise}
            type="button"
            onClick={() => onTab(status)}
            aria-pressed={active}
            aria-controls="vendor-list"
            className={cn(
              "group flex min-h-28 flex-col rounded-xl border bg-white p-4 text-left shadow-sm transition-[border-color,box-shadow] duration-200",
              "hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest",
              active ? "border-navy ring-1 ring-navy" : "border-line",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Icon className={cn("size-4", accent)} aria-hidden /> {label}
            </span>
            <span className="mt-2 text-3xl font-bold leading-none tabular-nums text-navy">{summary ? summary.byStatus[status] : <Bar w="w-10" h="h-9" />}</span>
            <span className="mt-auto pt-2 text-xs text-muted">{active ? "Showing below" : hint}</span>
          </motion.button>
        );
      })}
      <motion.div variants={rise} className="col-span-2 flex min-h-28 flex-col rounded-xl bg-forest p-4 text-white shadow-sm md:col-span-1">
        <span className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <UserPlus className="size-4 text-gold" aria-hidden /> New this week
        </span>
        <span className="mt-2 text-3xl font-bold leading-none tabular-nums">{summary ? summary.newThisWeek : <Bar w="w-10" h="h-9" dark />}</span>
        <span className="mt-auto pt-2 text-xs text-white/80">{summary ? `${summary.newToday} today · ${summary.total} in all` : " "}</span>
      </motion.div>
    </motion.div>
  );
}

/** A gold-edged nudge when applications are waiting. */
export function ReviewNudge({ count, onReview }: { count: number; onReview: () => void }) {
  if (count === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-3 rounded-xl border-l-4 border-gold bg-white p-4 shadow-sm">
      <Sparkles className="size-5 text-forest" aria-hidden />
      <p className="font-semibold text-navy">
        {count === 1 ? "1 vendor is waiting for approval." : `${count} vendors are waiting for approval.`}
      </p>
      <button type="button" onClick={onReview} className="ml-auto min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-midnight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
        Review now
      </button>
    </motion.div>
  );
}

/** Approved vendors per pincode as bars, with the waiting count beside them. */
export function AreaPanel({ areas }: { areas: AreaRow[] | null }) {
  const max = Math.max(1, ...(areas ?? []).map((a) => a.approved + a.waiting));
  const empty = areas !== null && areas.every((a) => a.approved + a.waiting === 0);
  return (
    <Panel title="Vendors by area" icon={MapPin}>
      {areas === null ? (
        <Skeleton rows={5} />
      ) : areas.length === 0 ? (
        <p className="text-sm text-muted">No active pincodes yet. Add Jorhat pincodes in Supabase to see coverage here.</p>
      ) : (
        <>
          {empty && <p className="mb-3 text-sm text-muted">No approved vendors yet. Each pincode fills in as vendors are approved.</p>}
          <ul className="grid gap-2.5">
            {areas.map((a) => (
              <li key={a.pincode} className="grid grid-cols-[minmax(0,7.5rem)_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate" title={a.area ?? a.pincode}>
                  <span className="font-mono text-ink">{a.pincode}</span>
                  {a.area && <span className="block truncate text-xs text-muted">{a.area}</span>}
                </span>
                <span className="flex h-2.5 overflow-hidden rounded-full bg-sunk" aria-hidden>
                  <motion.span className="h-full bg-forest" initial={{ width: 0 }} animate={{ width: `${(a.approved / max) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                  <motion.span className="h-full bg-gold" initial={{ width: 0 }} animate={{ width: `${(a.waiting / max) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                </span>
                <span className="whitespace-nowrap text-right tabular-nums">
                  <span className="font-semibold text-ink">{a.approved}</span>
                  {a.waiting > 0 && <span className="text-muted"> +{a.waiting} waiting</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-forest" /> Approved</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-gold" /> Waiting</span>
          </p>
        </>
      )}
    </Panel>
  );
}

const TONE: Record<Tone, { icon: LucideIcon; cls: string }> = {
  good: { icon: CheckCircle2, cls: "bg-forest/10 text-forest" },
  bad: { icon: XCircle, cls: "bg-danger/10 text-danger" },
  info: { icon: Clock, cls: "bg-navy/10 text-navy" },
  watch: { icon: Eye, cls: "bg-gold/20 text-navy" },
};

/** The latest meaningful audit log entries, including every full-Aadhaar view. */
export function ActivityPanel({ activity }: { activity: ActivityLine[] | null }) {
  return (
    <Panel title="Recent activity" icon={ShieldCheck}>
      {activity === null ? (
        <Skeleton rows={4} />
      ) : activity.length === 0 ? (
        <p className="text-sm text-muted">Nothing yet. Sign-ups, approvals and full-Aadhaar views will be listed here as they happen.</p>
      ) : (
        <ol className="grid gap-3">
          {activity.map((a) => {
            const { icon: Icon, cls } = TONE[a.tone];
            return (
              <li key={a.id} className="flex gap-3 text-sm">
                <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", cls)}><Icon className="size-4" aria-hidden /></span>
                <span className="min-w-0">
                  <span className="block text-ink">{a.text}{a.byYou && <span className="text-muted"> (by you)</span>}</span>
                  <time dateTime={a.at} title={new Date(a.at).toLocaleString("en-IN")} className="text-xs text-muted">{timeAgo(a.at)}</time>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

const EMPTY: Record<Tab, { title: string; body: string }> = {
  submitted: { title: "No applications to review", body: "When a vendor finishes signing up and presses Submit, their application appears here for you to approve or reject." },
  approved: { title: "No approved vendors yet", body: "Approve an application from To review and the vendor moves here." },
  rejected: { title: "Nothing rejected", body: "Applications you reject show here with the reason you gave. The vendor can fix and resend." },
  suspended: { title: "No suspended vendors", body: "Use Suspend vendor on an approved vendor to pause them. They show here until you reinstate them." },
  draft: { title: "No unfinished sign-ups", body: "Vendors who start signing up but don't submit show here, so you can call and help them finish." },
};

/** What the list shows when a tab has no vendors, with a useful next step. */
export function EmptyList({ tab }: { tab: Tab }) {
  const [copied, setCopied] = useState(false);
  const { title, body } = EMPTY[tab];
  const link = typeof window === "undefined" ? "/partner" : `${window.location.origin}/partner`;
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-sand"><Inbox className="size-6 text-navy" aria-hidden /></span>
      <h3 className="mt-4 font-serif text-xl text-navy">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{body}</p>
      {tab === "submitted" && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={async () => { await navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-midnight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            {copied ? "Link copied" : "Copy vendor sign-up link"}
          </button>
          <a href="/partner" target="_blank" rel="noreferrer" className="flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-semibold text-navy transition-colors hover:border-navy">
            Open sign-up page
          </a>
        </div>
      )}
      <span role="status" className="sr-only">{copied ? "Link copied" : ""}</span>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function Panel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-lg text-navy"><Icon className="size-4 text-forest" aria-hidden /> {title}</h2>
      {children}
    </section>
  );
}

function Bar({ w, h, dark }: { w: string; h: string; dark?: boolean }) {
  return <span className={cn("block animate-pulse rounded motion-reduce:animate-none", w, h, dark ? "bg-white/20" : "bg-sunk")} />;
}

export function Skeleton({ rows }: { rows: number }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid gap-3">
      {Array.from({ length: rows }, (_, i) => <Bar key={i} w="w-full" h="h-5" />)}
    </div>
  );
}
