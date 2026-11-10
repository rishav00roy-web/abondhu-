import { errorResponse, HttpError, requireAdmin, supabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

/** Short-lived link (5 minutes) for an admin to view a vendor's photo. */
export async function POST(req: Request) {
  try {
    await requireAdmin(req);
    const { path } = (await req.json()) as { path?: string };
    if (!path) throw new HttpError(400, "Missing photo.");
    const { data, error } = await supabaseAdmin().storage.from("vendor-docs").createSignedUrl(path, 300);
    if (error || !data) throw new HttpError(404, "Photo not found.");
    return Response.json({ url: data.signedUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
