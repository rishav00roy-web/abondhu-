// Numbers for the vendor home. Plain functions with no imports,
// so they run in the browser and in `npm test` alike.

export type PickupStatus = "requested" | "assigned" | "accepted" | "on_the_way" | "weighed" | "completed" | "cancelled";

/** One pickup, trimmed to what the vendor home shows. */
export interface PickupLite {
  id: string;
  code: string;
  status: PickupStatus;
  pincode: string;
  requested_at: string;
  completed_at: string | null;
  total_weight_kg: number | string | null; // Postgres numeric can arrive as a string
  slot_date: string | null; // yyyy-mm-dd
  start_time: string | null; // hh:mm:ss
  address: string | null;
  note: string | null;
}

export interface PayoutLite {
  amount: number | string;
  status: "pending" | "processing" | "paid" | "failed";
  paid_at: string | null;
}

/** Abondhu's help line. Placeholder until the real WhatsApp number is in. */
export const HELP_PHONE = "919181330755";
export const HELP_PHONE_LABEL = "+91 91813 30755";

const ACTIVE: PickupStatus[] = ["assigned", "accepted", "on_the_way", "weighed"];
const num = (v: number | string | null | undefined) => (v == null ? 0 : Number(v) || 0);

/** Pickups still to do (soonest first) and finished ones (newest first). */
export function splitPickups(pickups: PickupLite[]) {
  const when = (p: PickupLite) => (p.slot_date ? `${p.slot_date}T${p.start_time ?? "00:00:00"}` : p.requested_at);
  const upcoming = pickups.filter((p) => ACTIVE.includes(p.status)).sort((a, b) => when(a).localeCompare(when(b)));
  const done = pickups
    .filter((p) => p.status === "completed")
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  return { upcoming, done };
}

/** Pickups finished and kg collected this calendar month (local time), and money paid out so far. */
export function monthStats(pickups: PickupLite[], payouts: PayoutLite[], now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  let count = 0;
  let kg = 0;
  for (const p of pickups) {
    if (p.status !== "completed" || !p.completed_at || new Date(p.completed_at).getTime() < start) continue;
    count += 1;
    kg += num(p.total_weight_kg);
  }
  const paid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + num(p.amount), 0);
  return { count, kg: Math.round(kg * 10) / 10, paid: Math.round(paid) };
}

/** "₹1,250" in the Indian number style. */
export const rupees = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

/** Only the last 4 characters of an account number, UPI id kept as typed. */
export function maskPayout(acct: { method: "upi" | "bank"; upi_id: string | null; account_number: string | null } | null) {
  if (!acct) return null;
  if (acct.method === "upi") return acct.upi_id;
  return acct.account_number ? "•••• " + acct.account_number.slice(-4) : null;
}

/** WhatsApp link to Abondhu help with a short message that names the vendor. */
export function helpLink(name: string | null, code: string | null) {
  const msg = `Hi Abondhu, I am ${name?.trim() || "a vendor"}${code ? ` (${code})` : ""}. I need help.`;
  return `https://wa.me/${HELP_PHONE}?text=${encodeURIComponent(msg)}`;
}

/** Google Maps directions to a pickup address. */
export const mapsLink = (address: string, pincode: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${address}, ${pincode}`)}`;
