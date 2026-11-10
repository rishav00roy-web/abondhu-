"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Browser client. Returns null until the Supabase keys are set in the environment. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key);
  return client;
}

/** fetch() to our own API with the signed-in user's token attached. */
export async function authedFetch(path: string, init: RequestInit = {}) {
  const sb = getSupabase();
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
  const headers = new Headers(init.headers);
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  const res = await fetch(path, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body;
}

/** POST a JSON body to our own API as the signed-in user. */
export const postJson = (path: string, body: unknown) =>
  authedFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
