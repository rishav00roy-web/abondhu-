// Customer booking helpers. Plain functions with no imports,
// so they run in the browser and in `npm test` alike.

/** Jorhat pincodes start with 785. */
export const isJorhatPin = (s: string) => /^785\d{3}$/.test(s.trim());
/** Indian mobile: 10 digits starting 6-9 (spaces allowed while typing). */
export const isMobile = (s: string) => /^[6-9]\d{9}$/.test(s.replace(/\s/g, ""));

/** Pickup time slots, Monday to Saturday (the hours in site-data's HOURS). `start` is the hour, 24h clock. */
export const TIME_SLOTS = [
  { start: 9, label: "9 AM to 12 PM" },
  { start: 12, label: "12 PM to 3 PM" },
  { start: 15, label: "3 PM to 6 PM" },
] as const;

/** Slots still open on a day: on today, only the ones that have not started yet. */
export function slotsFor(dayIso: string, now = new Date()): string[] {
  const today = dayIso === isoDay(now);
  return TIME_SLOTS.filter((s) => !today || s.start > now.getHours()).map((s) => s.label);
}

/** Kinds of scrap a customer can pick when booking. "Other" lets them write it. */
export const SCRAP_TYPES = [
  "Newspaper and books",
  "Cardboard and cartons",
  "Plastic",
  "Iron and steel",
  "Aluminium, copper and brass",
  "Old appliances (fridge, AC, cooler, washing machine)",
  "Old phones, laptops and TVs",
  "Mixed scrap",
  "Other",
] as const;
export const OTHER_SCRAP = "Other";

/**
 * Scrap kinds that dealers price by the kilo, mapped to their sample rate in site-data's BUY list.
 * Only these get a price estimate: pieces (phones, appliances) and mixed loads are priced at the door.
 */
export const KG_RATE_ID: Partial<Record<(typeof SCRAP_TYPES)[number], string>> = {
  "Newspaper and books": "paper",
  "Cardboard and cartons": "cardboard",
  Plastic: "plastic",
  "Iron and steel": "metal",
};

/** The estimated weight a customer typed, in kg: a number above 0 and up to 2000, else null. */
export function parseKg(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(t)) return null;
  const kg = Number(t);
  return kg > 0 && kg <= 2000 ? kg : null;
}

/** Estimated price in whole rupees: weight times the sample rate per kg. */
export const estimatePrice = (kg: number, ratePerKg: number) => Math.round(kg * ratePerKg);

/** Most item rows a booking can have, so the note stays short for the dealer. */
export const MAX_ITEMS = 6;
/** Longest "Other" description per item. */
export const OTHER_MAX = 50;

/** One row of the booking form as typed: the kind of scrap, what it is when "Other", and the estimated kg. */
export interface ScrapItem {
  scrap: string;
  other: string;
  kg: string;
}
/** A filled-in row: `scrap` is the kind picked, `name` what the dealer reads. */
export interface ReadyItem {
  scrap: string;
  name: string;
  kg: number;
}

/** Checks one row. Every part is needed, so the dealer knows what to bring. */
export function readItem(it: ScrapItem): ReadyItem | { error: string } {
  if (!it.scrap) return { error: "choose what scrap it is" };
  const name = (it.scrap === OTHER_SCRAP ? it.other : it.scrap).trim().replace(/\s+/g, " ").slice(0, OTHER_MAX);
  if (name.length < 2) return { error: "write what the scrap is" };
  const kg = parseKg(it.kg);
  if (!kg) return { error: "write the estimated weight in kg, like 15" };
  return { scrap: it.scrap, name, kg };
}

/** Checks every row: the filled-in items, or the first problem ("Item 2: ..." when there are several rows). */
export function readItems(items: ScrapItem[]): { items: ReadyItem[] } | { error: string } {
  const ready: ReadyItem[] = [];
  for (const [i, it] of items.entries()) {
    const r = readItem(it);
    if ("error" in r) return { error: items.length > 1 ? `Item ${i + 1}: ${r.error}.` : `Please ${r.error}.` };
    ready.push(r);
  }
  return ready.length ? { items: ready } : { error: "Please add what scrap it is." };
}

/** What goes after the day and time in the note: each item with its estimated weight. */
export const itemsLine = (items: ReadyItem[]) => items.map((i) => `${i.name}, about ${i.kg} kg`).join("; ");

/** Total estimated weight in kg, to two decimals. */
export const totalKg = (items: ReadyItem[]) => Math.round(items.reduce((sum, i) => sum + i.kg, 0) * 100) / 100;

const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The next five pickup days as yyyy-mm-dd (local time). No Sundays; today only while a slot is still open. */
export function pickupDays(now = new Date()): string[] {
  const days: string[] = [];
  for (let i = 0; days.length < 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (d.getDay() === 0) continue;
    const iso = isoDay(d);
    if (i === 0 && slotsFor(iso, now).length === 0) continue;
    days.push(iso);
  }
  return days;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Today, Tue 10 Nov", "Tomorrow, Wed 11 Nov", "Thu 12 Nov". */
export function dayLabel(iso: string, now = new Date()): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const diff = Math.round((date.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  const text = `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  return diff === 0 ? `Today, ${text}` : diff === 1 ? `Tomorrow, ${text}` : text;
}

/**
 * The note saved on the pickup: preferred day and time first so the team sees them
 * at a glance (the team confirms by phone), then what scrap it is.
 */
export function pickupNote(dayIso: string, slot: string, scrap: string, now = new Date()): string {
  const what = scrap.trim().replace(/\s+/g, " ").slice(0, 440);
  const day = dayLabel(dayIso, now).replace(/^(Today|Tomorrow), /, "");
  return `Preferred: ${day}, ${slot}.${what ? " " + what : ""}`;
}

/** What someone typed on the home page before logging in, carried over to the booking form. */
export interface Draft {
  area?: string;
  pin?: string;
  phone?: string;
  day?: string;
}
const KEY = "abondhu-booking-draft";

export function saveDraft(d: Draft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}

/** Reads and clears the draft. Ignores anything malformed. */
export function takeDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    const d = raw ? JSON.parse(raw) : {};
    const str = (v: unknown) => (typeof v === "string" ? v.slice(0, 100) : undefined);
    return { area: str(d.area), pin: str(d.pin), phone: str(d.phone), day: str(d.day) };
  } catch {
    return {};
  }
}
