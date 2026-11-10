"use client";

import type { Session } from "@supabase/supabase-js";
import { ArrowRight, Loader2, LogOut, Package } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { btn } from "@/components/site/ui";
import { getSupabase } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";

const field =
  "h-12 w-full rounded-sm border border-navy/15 bg-white px-3.5 text-base text-ink transition-colors duration-200 placeholder:text-faint hover:border-navy/40 focus:border-navy focus:outline-none";
const label = "text-[11px] font-bold uppercase tracking-[0.15em] text-navy";

type Role = "customer" | "vendor" | "admin";
interface Profile {
  role: Role;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}
interface Pickup {
  id: string;
  code: string;
  status: string;
  requested_at: string;
}

/**
 * Customer login and account page.
 * Signed out: Google, or a 6-digit code by phone or email.
 * Signed in: a short account page. Vendors and admins get a link to their own dashboards.
 */
export function CustomerAccount() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!sb) return;
    // Fires once at start (also after the Google redirect lands back here) and on every login or logout.
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  return (
    <section className="bg-cream px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-md rounded-xl border border-navy/10 bg-white p-6 shadow-xl shadow-navy/5 sm:p-8">
        {!sb ? (
          <p className="text-muted">Login is not set up yet. Please try again later.</p>
        ) : session === undefined ? (
          <Loader2 className="mx-auto size-6 animate-spin text-navy" aria-label="Loading" />
        ) : session ? (
          <Account session={session} />
        ) : (
          <Login />
        )}
      </div>
    </section>
  );
}

function Login() {
  const sb = getSupabase()!;
  const { busy, err, run } = useAction();
  const [by, setBy] = useState<"phone" | "email">("phone");
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");

  const target = by === "phone" ? "+91" + value.replace(/\D/g, "") : value.trim();

  const google = () =>
    run(async () => {
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/account` },
      });
      if (error) throw new Error(error.message);
    });

  const sendCode = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (by === "phone" && !/^\+91[6-9]\d{9}$/.test(target)) throw new Error("Enter a 10-digit mobile number starting with 6, 7, 8 or 9.");
      if (by === "email" && !/^\S+@\S+\.\S+$/.test(target)) throw new Error("Enter a valid email address.");
      const { error } = by === "phone" ? await sb.auth.signInWithOtp({ phone: target }) : await sb.auth.signInWithOtp({ email: target });
      if (error) throw new Error(error.message);
      setSent(true);
    });
  };

  const verify = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      const { error } =
        by === "phone"
          ? await sb.auth.verifyOtp({ phone: target, token: code, type: "sms" })
          : await sb.auth.verifyOtp({ email: target, token: code, type: "email" });
      if (error) throw new Error("That code did not work. Check it and try again.");
    });
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="font-serif text-3xl text-navy">Log in to sell your scrap</h1>
        <p className="text-muted">New here? Logging in creates your account.</p>
      </div>

      <button
        type="button"
        onClick={google}
        disabled={busy}
        className="flex h-12 items-center justify-center gap-3 rounded-sm border border-navy/20 bg-white text-[15px] font-semibold text-ink transition-colors hover:border-navy hover:bg-navy/5 disabled:opacity-50"
      >
        <GoogleMark /> Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.15em] text-faint">
        <span className="h-px flex-1 bg-navy/10" />
        or get a code
        <span className="h-px flex-1 bg-navy/10" />
      </div>

      {!sent ? (
        <form onSubmit={sendCode} className="grid gap-4">
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Get the code by">
            {(["phone", "email"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={by === k}
                onClick={() => { setBy(k); setValue(""); }}
                className={cn("h-11 rounded-sm border text-sm font-semibold", by === k ? "border-navy bg-navy text-white" : "border-navy/15 text-navy")}
              >
                {k === "phone" ? "Phone" : "Email"}
              </button>
            ))}
          </div>
          <label className="grid gap-2">
            <span className={label}>{by === "phone" ? "Mobile number" : "Email"}</span>
            {by === "phone" ? (
              <div className="flex">
                <span className="grid h-12 place-items-center rounded-l-sm border border-r-0 border-navy/15 bg-sunk px-3 text-ink">+91</span>
                <input className={cn(field, "rounded-l-none")} inputMode="numeric" autoComplete="tel-national" maxLength={10}
                  value={value} onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))} placeholder="98xxxxxxxx" />
              </div>
            ) : (
              <input className={field} type="email" autoComplete="email" value={value} onChange={(e) => setValue(e.target.value)} placeholder="you@example.com" />
            )}
          </label>
          <button type="submit" disabled={busy || !value} className={cn(btn.base, btn.primary, "w-full")}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <>Send code <ArrowRight className="size-4" aria-hidden /></>}
          </button>
        </form>
      ) : (
        <form onSubmit={verify} className="grid gap-4">
          <label className="grid gap-2">
            <span className={label}>6-digit code sent to {by === "phone" ? target : value}</span>
            <input className={cn(field, "text-center text-xl tracking-[0.4em]")} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
              value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} autoFocus />
          </label>
          <button type="submit" disabled={busy || code.length !== 6} className={cn(btn.base, btn.primary, "w-full")}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Log in"}
          </button>
          <button type="button" onClick={() => { setSent(false); setCode(""); }} className="text-sm text-muted underline">
            Change {by === "phone" ? "number" : "email"}
          </button>
        </form>
      )}

      {err && <p role="alert" className="rounded-sm bg-red-50 p-3 text-sm text-danger">{err}</p>}
    </div>
  );
}

function Account({ session }: { session: Session }) {
  const sb = getSupabase()!;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loadErr, setLoadErr] = useState("");
  const uid = session.user.id;

  useEffect(() => {
    (async () => {
      const [p, k] = await Promise.all([
        sb.from("profiles").select("role, full_name, email, phone").eq("id", uid).single<Profile>(),
        sb.from("pickups").select("id, code, status, requested_at").eq("customer_id", uid).order("requested_at", { ascending: false }).limit(20),
      ]);
      if (p.error) return setLoadErr("Could not load your account. Please refresh the page.");
      let prof = p.data;
      // Google gives us the person's name: save it the first time so we can greet them.
      const googleName = session.user.user_metadata?.full_name as string | undefined;
      if (!prof.full_name && googleName) {
        await sb.from("profiles").update({ full_name: googleName }).eq("id", uid);
        prof = { ...prof, full_name: googleName };
      }
      setProfile(prof);
      setPickups((k.data as Pickup[] | null) ?? []);
    })();
  }, [sb, uid, session.user.user_metadata]);

  if (loadErr) return <p role="alert" className="text-danger">{loadErr}</p>;
  if (!profile) return <Loader2 className="mx-auto size-6 animate-spin text-navy" aria-label="Loading" />;

  const first = profile.full_name?.split(" ")[0];
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="font-serif text-3xl text-navy">{first ? `Hello, ${first}` : "Hello"}</h1>
        <p className="text-sm text-muted">{profile.email ?? profile.phone}</p>
      </div>

      {profile.role !== "customer" && (
        <Link href={profile.role === "admin" ? "/admin" : "/partner"} className={cn(btn.base, btn.gold, "w-full")}>
          Visit your dashboard <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      <div className="grid gap-3">
        <h2 className={label}>Your pickups</h2>
        {pickups.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-lg border border-dashed border-navy/20 bg-sunk px-4 py-8 text-center">
            <Package className="size-8 text-forest" aria-hidden />
            <p className="font-semibold text-navy">No pickups yet</p>
            <p className="max-w-[30ch] text-sm text-muted">Online booking opens soon in Jorhat. We will let you know when you can book here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10">
            {pickups.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-mono text-navy">{p.code}</span>
                <span className="text-muted">{new Date(p.requested_at).toLocaleDateString("en-IN")}</span>
                <span className="font-semibold capitalize text-forest">{p.status.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button type="button" onClick={() => sb.auth.signOut()} className="inline-flex items-center justify-center gap-2 text-sm text-muted underline">
        <LogOut className="size-4" aria-hidden /> Log out
      </button>
    </div>
  );
}

/** Google's "G", as its sign-in button guidelines ask. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
