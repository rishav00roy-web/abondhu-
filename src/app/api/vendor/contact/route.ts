import { errorResponse, HttpError, requireUser, supabaseAdmin } from "@/lib/server/supabase-admin";
import { isValid } from "@/lib/vendor";

export const runtime = "nodejs";

/**
 * Saves the contact mobile for someone who logged in by email.
 * Phone logins already have a verified number, which is never overwritten.
 * A typed number is only contact info: it never blocks the number's real owner.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser(req);
    const { phone } = (await req.json()) as { phone?: string };
    if (!phone || !isValid.mobile(phone)) throw new HttpError(400, "Please enter a 10-digit mobile number.");

    const db = supabaseAdmin();
    const { data: profile } = await db.from("profiles").select("phone").eq("id", user.id).single();
    if (profile?.phone) return Response.json({ ok: true });

    const full = "+91" + phone;
    let { error } = await db.from("profiles").update({ phone: full }).eq("id", user.id);
    if (error?.code === "23505") {
      // Someone already has this number. If they proved it with a login code, it is theirs.
      // If they only typed it in, it may not be theirs at all, so it must not lock out this person.
      const { data: holder } = await db.from("profiles").select("id").eq("phone", full).maybeSingle();
      const { data: auth } = holder ? await db.auth.admin.getUserById(holder.id) : { data: null };
      if (!holder || auth?.user?.phone) throw new HttpError(409, "phone_taken");
      const freed = await db.from("profiles").update({ phone: null }).eq("id", holder.id).eq("phone", full);
      if (freed.error) throw freed.error;
      ({ error } = await db.from("profiles").update({ phone: full }).eq("id", user.id));
      if (error?.code === "23505") throw new HttpError(409, "phone_taken");
    }
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
