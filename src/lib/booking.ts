// Customer booking helpers. Plain functions with no imports,
// so they run in the browser and in `npm test` alike.

/** Jorhat pincodes start with 785. */
export const isJorhatPin = (s: string) => /^785\d{3}$/.test(s.trim());
/** Indian mobile: 10 digits starting 6-9 (spaces allowed while typing). */
export const isMobile = (s: string) => /^[6-9]\d{9}$/.test(s.replace(/\s/g, ""));

/** The next five pickup days as yyyy-mm-dd (local time), today first. */
export function pickupDays(now = new Date()): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
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
 * The note saved on the pickup. The preferred day goes first so the team sees it
 * at a glance (there is no slot booking yet; the team confirms a time by phone).
 */
export function pickupNote(dayIso: string, scrap: string, now = new Date()): string {
  const what = scrap.trim().replace(/\s+/g, " ").slice(0, 300);
  return `Preferred day: ${dayLabel(dayIso, now).replace(/^(Today|Tomorrow), /, "")}.${what ? " " + what : ""}`;
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
