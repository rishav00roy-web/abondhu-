import { errorResponse, HttpError, requireUser, supabaseAdmin } from "@/lib/server/supabase-admin";
import { isValid } from "@/lib/vendor";

export const runtime = "nodejs";

/**
 * Saves the contact mobile for someone who logged in by email.
 * Phone logins already have a verified number, which is never overwritten.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { phone } = (await req.json()) as { phone?: string };
    if (!phone || !isValid.mobile(phone)) throw new HttpError(400, "Please enter a 10-digit mobile number.");

    const db = supabaseAdmin();
    const { data: profile } = await db.from("profiles").select("phone").eq("id", user.id).single();
    if (profile?.phone) return Response.json({ ok: true });

    const { error } = await db.from("profiles").update({ phone: "+91" + phone }).eq("id", user.id);
    if (error?.code === "23505") throw new HttpError(409, "phone_taken");
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
