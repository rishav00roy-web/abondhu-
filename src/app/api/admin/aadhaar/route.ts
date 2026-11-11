import { formatAadhaar } from "@/lib/aadhaar";
import { decryptAadhaar } from "@/lib/server/aadhaar-crypto";
import { errorResponse, HttpError, requireAdmin, supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/** Admin views one vendor's or worker's full Aadhaar. Every view is written to the audit log. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const { vendorId, staffId } = (await req.json()) as { vendorId?: string; staffId?: string };
    if (!vendorId && !staffId) throw new HttpError(400, "Missing vendor.");
    const db = supabaseAdmin();
    const [table, key, id] = staffId
      ? (["staff_aadhaar_vault", "staff_id", staffId] as const)
      : (["vendor_aadhaar_vault", "vendor_id", vendorId!] as const);
    const { data } = await db.from(table).select("aadhaar_ciphertext").eq(key, id).maybeSingle();
    if (!data) throw new HttpError(404, "No Aadhaar saved for this person.");
    await db.from("audit_log").insert({ actor_id: admin.id, action: "view_aadhaar", table_name: table, record_id: id });
    return Response.json({ aadhaar: formatAadhaar(decryptAadhaar(data.aadhaar_ciphertext)) });
  } catch (e) {
    return errorResponse(e);
  }
}
