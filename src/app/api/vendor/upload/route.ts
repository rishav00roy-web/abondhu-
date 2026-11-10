import { errorResponse, HttpError, requireEditableVendor, supabaseAdmin } from "@/lib/server/supabase-admin";
import { PHOTO_TYPES, type PhotoType } from "@/lib/vendor";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

/** Vendor uploads one photo. Stored in the private vendor-docs bucket under their own folder. */
export async function POST(req: Request) {
  try {
    const user = await requireEditableVendor(req);
    const form = await req.formData();
    const file = form.get("file");
    const docType = String(form.get("doc_type")) as PhotoType;

    if (!PHOTO_TYPES.includes(docType)) throw new HttpError(400, "Unknown photo type.");
    if (!(file instanceof File) || file.size === 0) throw new HttpError(400, "Please choose a photo.");
    if (file.size > MAX_BYTES) throw new HttpError(400, "Photo is too large (max 5 MB).");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new HttpError(400, "Please upload a photo (JPG or PNG).");

    const db = supabaseAdmin();

    // Replace any earlier photo of the same kind.
    const { data: old } = await db.from("vendor_documents").select("id, storage_path").eq("vendor_id", user.id).eq("doc_type", docType);
    if (old?.length) {
      await db.storage.from("vendor-docs").remove(old.map((d) => d.storage_path));
      await db.from("vendor_documents").delete().in("id", old.map((d) => d.id));
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${docType}-${Date.now()}.${ext}`;
    const up = await db.storage.from("vendor-docs").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) throw up.error;

    const ins = await db.from("vendor_documents").insert({ vendor_id: user.id, doc_type: docType, storage_path: path });
    if (ins.error) throw ins.error;
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
