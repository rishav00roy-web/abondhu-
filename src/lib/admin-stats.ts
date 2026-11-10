// Numbers and activity lines for the admin home. Plain functions with no imports,
// so they run in the browser and in `npm test` alike.

export type Status = "draft" | "submitted" | "approved" | "rejected" | "suspended";

/** One vendor, trimmed to what the admin home counts. */
export interface VendorLite {
  id: string;
  status: Status;
  created_at: string;
  name: string | null;
  pincode: string | null;
}

export interface Summary {
  byStatus: Record<Status, number>;
  total: number;
  newToday: number;
  newThisWeek: number;
}

const DAY = 24 * 60 * 60 * 1000;

/** Count vendors by status, and sign-ups started today (local time) and in the last 7 days. */
export function summarize(vendors: VendorLite[], now = new Date()): Summary {
  const byStatus: Record<Status, number> = { draft: 0, submitted: 0, approved: 0, rejected: 0, suspended: 0 };
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekAgo = now.getTime() - 7 * DAY;
  let newToday = 0;
  let newThisWeek = 0;
  for (const v of vendors) {
    byStatus[v.status] += 1;
    const t = new Date(v.created_at).getTime();
    if (t >= startOfToday) newToday += 1;
    if (t >= weekAgo) newThisWeek += 1;
  }
  return { byStatus, total: vendors.length, newToday, newThisWeek };
}

export interface AreaRow {
  pincode: string;
  area: string | null;
  approved: number;
  waiting: number;
}

/**
 * Approved and waiting vendors for every pincode, busiest first.
 * Every known pincode is listed (even with no vendors) so gaps in coverage show.
 */
export function byArea(vendors: VendorLite[], pincodes: { pincode: string; area_name: string | null }[]): AreaRow[] {
  const rows = new Map<string, AreaRow>();
  for (const p of pincodes) rows.set(p.pincode, { pincode: p.pincode, area: p.area_name, approved: 0, waiting: 0 });
  for (const v of vendors) {
    if (!v.pincode || (v.status !== "approved" && v.status !== "submitted")) continue;
    const row = rows.get(v.pincode) ?? { pincode: v.pincode, area: null, approved: 0, waiting: 0 };
    if (v.status === "approved") row.approved += 1;
    else row.waiting += 1;
    rows.set(v.pincode, row);
  }
  return [...rows.values()].sort(
    (a, b) => b.approved - a.approved || b.waiting - a.waiting || a.pincode.localeCompare(b.pincode),
  );
}

/** One audit_log row, with only the fields the activity list needs (never the full old/new data). */
export interface AuditLite {
  id: number;
  action: string;
  table_name: string;
  record_id: string | null;
  actor_id: string | null;
  at: string;
  new_status: string | null;
  old_status: string | null;
  new_role: string | null;
  old_role: string | null;
  new_blocked: string | null;
  old_blocked: string | null;
  kyc_vendor: string | null;
  profile_name: string | null;
}

export type Tone = "good" | "bad" | "info" | "watch";
export interface ActivityLine {
  id: number;
  text: string;
  tone: Tone;
  at: string;
  byYou: boolean;
}

const VENDOR_STATUS_TEXT: Record<string, [string, Tone]> = {
  submitted: ["sent an application", "info"],
  approved: ["was approved", "good"],
  rejected: ["was rejected", "bad"],
  suspended: ["was suspended", "bad"],
  draft: ["reopened their application", "info"],
};

/**
 * Turn an audit row into a short line, or null for rows not worth showing
 * (for example a vendor saving a sign-up step without changing status).
 */
export function describe(row: AuditLite, names: Map<string, string>, me: string | null): ActivityLine | null {
  const who = (id: string | null) => (id && names.get(id)) || "A vendor";
  let text: string | null = null;
  let tone: Tone = "info";

  if (row.table_name === "vendors") {
    if (row.action === "insert") text = `${who(row.record_id)} started signing up`;
    else if (row.action === "delete") [text, tone] = ["A vendor was removed", "bad"];
    else if (row.action === "update" && row.new_status && row.new_status !== row.old_status) {
      const s = VENDOR_STATUS_TEXT[row.new_status];
      if (s) [text, tone] = [`${who(row.record_id)} ${s[0]}`, s[1]];
    }
  } else if (row.table_name === "vendor_kyc") {
    if (row.action === "insert") text = `${who(row.kyc_vendor)} added Aadhaar details`;
    else if (row.action === "update" && row.new_status !== row.old_status && row.new_status === "verified")
      [text, tone] = [`${who(row.kyc_vendor)}'s KYC was verified`, "good"];
  } else if (row.table_name === "vendor_aadhaar_vault" && row.action === "view_aadhaar") {
    [text, tone] = [`Full Aadhaar viewed for ${(row.record_id && names.get(row.record_id)) || "a vendor"}`, "watch"];
  } else if (row.table_name === "profiles" && row.action === "update") {
    const name = row.profile_name || (row.record_id && names.get(row.record_id)) || "An account";
    if (row.new_role !== row.old_role && row.new_role) text = `${name} is now ${row.new_role === "admin" ? "an admin" : `a ${row.new_role}`}`;
    else if (row.new_blocked !== row.old_blocked) [text, tone] = [`${name} was ${row.new_blocked === "true" ? "blocked" : "unblocked"}`, row.new_blocked === "true" ? "bad" : "good"];
  }

  if (!text) return null;
  return { id: row.id, text, tone, at: row.at, byYou: !!me && row.actor_id === me };
}

/** "just now", "5 min ago", "3 h ago", "yesterday", or a date. */
export function timeAgo(iso: string, now = new Date()): string {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 2 * 86400) return "yesterday";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
