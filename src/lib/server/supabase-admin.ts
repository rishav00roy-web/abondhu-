import "server-only";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { EDITABLE_STATUSES, type VendorStatus } from "@/lib/vendor";

let admin: SupabaseClient | null = null;

/** Service-role client: bypasses row level security. Server only. */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured on the server");
  admin ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** The signed-in user from the request's bearer token, or a 401. */
export async function requireUser(req: Request): Promise<User> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Please log in again.");
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Please log in again.");
  return data.user;
}

export async function requireAdmin(req: Request): Promise<User> {
  const user = await requireUser(req);
  const { data } = await supabaseAdmin().from("profiles").select("role, is_blocked").eq("id", user.id).single();
  if (data?.role !== "admin" || data.is_blocked) throw new HttpError(403, "Admins only.");
  return user;
}

/** The signed-in vendor, only while their application can still be changed. */
export async function requireEditableVendor(req: Request): Promise<User> {
  const user = await requireUser(req);
  const { data } = await supabaseAdmin().from("vendors").select("status").eq("id", user.id).single();
  if (!data) throw new HttpError(400, "Please finish the first steps first.");
  if (!EDITABLE_STATUSES.includes(data.status as VendorStatus)) throw new HttpError(409, "Your application is already sent.");
  return user;
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}
