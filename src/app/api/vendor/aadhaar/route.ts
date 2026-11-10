import { digitsOnly, isValidAadhaar } from "@/lib/aadhaar";
import { aadhaarHmac, encryptAadhaar } from "@/lib/server/aadhaar-crypto";
import { errorResponse, HttpError, requireUser, supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/** Saves the vendor's Aadhaar: encrypted in the vault, last 4 digits on the KYC record. */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { aadhaar, consent } = (await req.json()) as { aadhaar?: string; consent?: boolean };
    const digits = digitsOnly(aadhaar ?? "");
    if (!consent) throw new HttpError(400, "Please tick the consent box.");
    if (!isValidAadhaar(digits)) throw new HttpError(400, "This Aadhaar number doesn't look right. Please check it.");

    const db = supabaseAdmin();
    const { data: vendor } = await db.from("vendors").select("status").eq("id", user.id).single();
    if (!vendor) throw new HttpError(400, "Please finish the first steps first.");
    if (!["draft", "rejected"].includes(vendor.status)) throw new HttpError(409, "Your application is already sent.");

    const hmac = aadhaarHmac(digits);
    const { data: taken } = await db.from("vendor_aadhaar_vault").select("vendor_id").eq("aadhaar_hmac", hmac).maybeSingle();
    if (taken && taken.vendor_id !== user.id) throw new HttpError(409, "This Aadhaar is already registered with another account.");

    const last4 = digits.slice(-4);
    const vault = await db.from("vendor_aadhaar_vault").upsert({
      vendor_id: user.id,
      aadhaar_ciphertext: encryptAadhaar(digits),
      aadhaar_hmac: hmac,
      aadhaar_last4: last4,
      consent_at: new Date().toISOString(),
    });
    if (vault.error) throw vault.error;

    await db.from("vendor_kyc").delete().eq("vendor_id", user.id).eq("method", "manual_upload").neq("status", "verified");
    const kyc = await db.from("vendor_kyc").insert({ vendor_id: user.id, method: "manual_upload", status: "needs_review", aadhaar_last4: last4 });
    if (kyc.error) throw kyc.error;

    return Response.json({ ok: true, last4 });
  } catch (e) {
    return errorResponse(e);
  }
}
