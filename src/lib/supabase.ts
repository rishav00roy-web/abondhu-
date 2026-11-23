"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Browser client. Returns null until the Supabase keys are set in the environment. */
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // A stalled connection (weak 2G signal) gives up after 30 s with an error, instead of a spinner that never ends.
  client ??= createClient(url, key, {
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(30_000) }) },
  });
  return client;
}

/** Shown when the phone has no internet, instead of the browser's "Failed to fetch". */
export const NETWORK_ERR = "No internet. Please check your connection and try again.";

/** True for errors that mean the internet dropped or was too slow, not that something was refused. */
export const isNetworkError = (msg: string) => /fetch|network|timed? ?out|abort/i.test(msg);

/** fetch() to our own API with the signed-in user's token attached. */
export async function authedFetch(path: string, init: RequestInit = {}) {
  const sb = getSupabase();
  const { data } = (await sb?.auth.getSession()) ?? { data: { session: null } };
  const headers = new Headers(init.headers);
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  // Uploads on a slow connection can take a while; 90 s, then a clear message instead of an endless spinner.
  const res = await fetch(path, { ...init, headers, signal: init.signal ?? AbortSignal.timeout(90_000) }).catch(() => {
    throw new Error(NETWORK_ERR);
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Something went wrong. Please try again.");
  return body;
}

/** POST a JSON body to our own API as the signed-in user. */
export const postJson = (path: string, body: unknown) =>
  authedFetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
