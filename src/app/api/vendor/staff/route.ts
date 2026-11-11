import { digitsOnly, isValidAadhaar } from "@/lib/aadhaar";
import { aadhaarHmac, encryptAadhaar } from "@/lib/server/aadhaar-crypto";
import { aadhaarTaken, errorResponse, HttpError, requireApprovedVendor, supabaseAdmin } from "@/lib/server/supabase-admin";
import { isValid, MAX_STAFF } from "@/lib/vendor";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

function photo(form: FormData, key: string): File {
  const f = form.get(key);
  if (!(f instanceof File) || f.size === 0) throw new HttpError(400, "Please add both photos.");
  if (f.size > MAX_BYTES) throw new HttpError(400, "Photo is too large (max 5 MB).");
  if (!TYPES[f.type]) throw new HttpError(400, "Please upload a photo (JPG or PNG).");
  return f;
}

/**
 * An approved vendor adds a worker: name, mobile, Aadhaar (number + card photo) and face photo.
 * The worker waits for an admin to check them. All in one request so nothing is half-saved.
 */
export async function POST(req: Request) {
  const db = supabaseAdmin();
  const uploaded: string[] = [];
  let staffId: string | null = null;
  try {
    const user = await requireApprovedVendor(req);
    const form = await req.formData();
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "");
    const aadhaar = digitsOnly(String(form.get("aadhaar") ?? ""));
    if (name.length < 2 || name.length > 80) throw new HttpError(400, "Please write the worker's name.");
    if (!isValid.mobile(phone)) throw new HttpError(400, "Please enter a 10-digit mobile number.");
    if (!isValidAadhaar(aadhaar)) throw new HttpError(400, "This Aadhaar number is not correct. Check all 12 digits on the card.");
    if (form.get("consent") !== "true") throw new HttpError(400, "Please tick the consent box.");
    const card = photo(form, "aadhaar_photo");
    const face = photo(form, "face_photo");

    const { count } = await db.from("vendor_staff").select("id", { count: "exact", head: true }).eq("vendor_id", user.id);
    if ((count ?? 0) >= MAX_STAFF) throw new HttpError(400, `You can add up to ${MAX_STAFF} workers. Remove one first.`);

    const hmac = aadhaarHmac(aadhaar);
    if (await aadhaarTaken(hmac)) throw new HttpError(409, "aadhaar_taken");

    staffId = crypto.randomUUID();
    const folder = `${user.id}/staff/${staffId}`;
    const paths = { card: `${folder}/aadhaar.${TYPES[card.type]}`, face: `${folder}/face.${TYPES[face.type]}` };
    for (const [path, file] of [[paths.card, card], [paths.face, face]] as const) {
      const up = await db.storage.from("vendor-docs").upload(path, file, { contentType: file.type, upsert: false });
      if (up.error) throw up.error;
      uploaded.push(path);
    }

    const last4 = aadhaar.slice(-4);
    const row = await db.from("vendor_staff").insert({
      id: staffId, vendor_id: user.id, full_name: name, phone: "+91" + phone, aadhaar_last4: last4,
      aadhaar_photo_path: paths.card, face_photo_path: paths.face,
    });
    if (row.error) throw row.error;
    const vault = await db.from("staff_aadhaar_vault").insert({
      staff_id: staffId, aadhaar_ciphertext: encryptAadhaar(aadhaar), aadhaar_hmac: hmac, aadhaar_last4: last4,
      consent_at: new Date().toISOString(),
    });
    if (vault.error?.code === "23505") throw new HttpError(409, "aadhaar_taken"); // added twice at the same moment
    if (vault.error) throw vault.error;

    return Response.json({ ok: true });
  } catch (e) {
    // Undo a half-finished add: the row (its vault row goes with it) and any uploaded photos.
    if (staffId) await db.from("vendor_staff").delete().eq("id", staffId);
    if (uploaded.length) await db.storage.from("vendor-docs").remove(uploaded);
    return errorResponse(e);
  }
}

/** The vendor removes a worker (for example someone who left). Deletes the photos and the Aadhaar too. */
export async function DELETE(req: Request) {
  try {
    const user = await requireApprovedVendor(req);
    const { id } = (await req.json()) as { id?: string };
    if (!id) throw new HttpError(400, "Missing worker.");
    const db = supabaseAdmin();
    const { data: s } = await db
      .from("vendor_staff").select("aadhaar_photo_path, face_photo_path").eq("id", id).eq("vendor_id", user.id).maybeSingle();
    if (!s) throw new HttpError(404, "Worker not found.");
    const del = await db.from("vendor_staff").delete().eq("id", id).eq("vendor_id", user.id);
    if (del.error) throw del.error;
    await db.storage.from("vendor-docs").remove([s.aadhaar_photo_path, s.face_photo_path]);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
