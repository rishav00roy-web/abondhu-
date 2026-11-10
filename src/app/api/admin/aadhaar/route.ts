import { decryptAadhaar } from "@/lib/server/aadhaar-crypto";
import { errorResponse, HttpError, requireAdmin, supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/** Admin views one vendor's full Aadhaar. Every view is written to the audit log. */
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin(req);
    const { vendorId } = (await req.json()) as { vendorId?: string };
    if (!vendorId) throw new HttpError(400, "Missing vendor.");
    const db = supabaseAdmin();
    const { data } = await db.from("vendor_aadhaar_vault").select("aadhaar_ciphertext").eq("vendor_id", vendorId).maybeSingle();
    if (!data) throw new HttpError(404, "No Aadhaar saved for this vendor.");
    await db.from("audit_log").insert({ actor_id: admin.id, action: "view_aadhaar", table_name: "vendor_aadhaar_vault", record_id: vendorId });
    const n = decryptAadhaar(data.aadhaar_ciphertext);
    return Response.json({ aadhaar: n.replace(/(\d{4})(?=\d)/g, "$1 ") });
  } catch (e) {
    return errorResponse(e);
  }
}
