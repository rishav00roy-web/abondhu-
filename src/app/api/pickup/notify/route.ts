import { sendMail } from "@/lib/server/mail";
import { errorResponse, HttpError, requireUser, supabaseAdmin } from "@/lib/server/supabase-admin";
import { SITE_URL } from "@/lib/site-data";

export const runtime = "nodejs";

const TITLE = "New pickup near you";
// Supabase returns an embedded row as an object (or, without generated types, maybe an array).
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] : v) ?? null;

/**
 * Called right after a customer books. Tells every approved dealer who covers the
 * pickup's pincode; the first to tap Accept on their home screen gets it
 * (accept_pickup() in the database makes sure only one can).
 * Runs once per pickup: each dealer told gets a notifications row, and a second
 * call finds them and stops. The email holds no address or phone; those show
 * only to the dealer who accepts.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { pickupId } = (await req.json()) as { pickupId?: string };
    const db = supabaseAdmin();

    const { data: p } = await db
      .from("pickups")
      .select("code, customer_id, status, pincode, customer_note, pincodes(area_name)")
      .eq("id", pickupId ?? "")
      .maybeSingle();
    if (!p || p.customer_id !== user.id) throw new HttpError(404, "Pickup not found.");
    if (p.status !== "requested") return Response.json({ told: 0 });

    const { count } = await db.from("notifications").select("id", { count: "exact", head: true }).eq("title", TITLE).eq("body", p.code);
    if (count) return Response.json({ told: 0 });

    const { data: rows, error } = await db
      .from("vendor_service_areas")
      .select("vendor_id, vendors!inner(status, profiles!inner(email, is_blocked))")
      .eq("pincode", p.pincode)
      .eq("vendors.status", "approved")
      .eq("vendors.profiles.is_blocked", false);
    if (error) throw error;
    const dealers = (rows ?? []).map((r) => ({
      id: r.vendor_id as string,
      email: one(one(r.vendors as unknown as { profiles: { email: string | null } })?.profiles)?.email ?? null,
    }));
    if (dealers.length === 0) return Response.json({ told: 0 });

    const ins = await db.from("notifications").insert(
      dealers.map((d) => ({ profile_id: d.id, channel: "in_app", title: TITLE, body: p.code, sent_at: new Date().toISOString() })),
    );
    if (ins.error) throw ins.error;

    const area = one(p.pincodes as { area_name: string | null }[] | null)?.area_name;
    const where = area ? `${area}, ${p.pincode}` : p.pincode;
    const text = [
      `A customer in ${where} wants their scrap picked up.`,
      p.customer_note ?? "",
      "",
      "Open Abondhu and tap Accept to take it. The first dealer to accept gets it.",
      `${SITE_URL}/partner`,
      "",
      `Booking ${p.code}`,
    ].join("\n");
    const sent = await Promise.allSettled(dealers.filter((d) => d.email).map((d) => sendMail(d.email!, `${TITLE}: ${where}`, text)));
    for (const r of sent) if (r.status === "rejected") console.error("pickup email failed", r.reason);
    return Response.json({ told: dealers.length });
  } catch (e) {
    return errorResponse(e);
  }
}
