import { MAX_ITEMS, photoName } from "@/lib/booking";
import { photoFrom, PHOTO_EXT } from "@/lib/server/photo";
import { errorResponse, HttpError, requireUser, supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/**
 * A customer adds a photo of their scrap to a pickup they just booked: one per item
 * (`item` = 1, 2, ...), or `item` = "all" for the optional photo of everything.
 * Stored in the private pickup-photos bucket under the pickup's folder, so the
 * customer, the vendor who takes it and admins can see it.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const form = await req.formData();
    const pickupId = String(form.get("pickup_id") ?? "");
    const raw = String(form.get("item") ?? "");
    const item = raw === "all" ? "all" : Number(raw);
    if (item !== "all" && !(Number.isInteger(item) && item >= 1 && item <= MAX_ITEMS)) throw new HttpError(400, "Which item is this photo for?");
    const file = photoFrom(form, "file");
    const db = supabaseAdmin();

    const { data: pickup } = await db.from("pickups").select("customer_id, status").eq("id", pickupId).maybeSingle();
    if (!pickup || pickup.customer_id !== user.id) throw new HttpError(404, "Pickup not found.");
    if (pickup.status !== "requested") throw new HttpError(409, "This pickup can't be changed now.");
    // One photo per item, and one of everything.
    const { count } = await db.from("pickup_photos").select("id", { count: "exact", head: true }).eq("pickup_id", pickupId).like("storage_path", `${pickupId}/scrap-${item}-%`);
    if (count) throw new HttpError(409, "This item already has a photo.");

    const path = `${pickupId}/${photoName(item, Date.now(), PHOTO_EXT[file.type])}`;
    const up = await db.storage.from("pickup-photos").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) throw up.error;
    const ins = await db.from("pickup_photos").insert({ pickup_id: pickupId, storage_path: path, kind: "scrap", uploaded_by: user.id });
    if (ins.error) {
      await db.storage.from("pickup-photos").remove([path]);
      throw ins.error;
    }
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
