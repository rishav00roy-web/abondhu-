"use client";

import { ArrowLeft, ArrowRight, Bike, Camera, Check, Loader2, Recycle, ShoppingCart, Store, Truck, User, Car } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { digitsOnly, formatAadhaar, isValidAadhaar, maskAadhaar } from "@/lib/aadhaar";
import { authedFetch, getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { strings, type Lang, type Strings } from "@/lib/vendor-i18n";

type VendorType = "individual_collector" | "scrap_shop" | "recycler";
type Vehicle = "cycle" | "cart" | "auto" | "truck";
type Status = "draft" | "submitted" | "approved" | "rejected" | "suspended";

interface Form {
  name: string;
  phone: string; // 10 digits
  vendorType: VendorType | null;
  otp: string;
  shopName: string;
  address: string;
  pincode: string;
  vehicle: Vehicle | null;
  aadhaar: string;
  aadhaarPhoto: File | null;
  selfie: File | null;
  consent: boolean;
  shopPhoto: File | null;
  payMethod: "upi" | "bank";
  upiId: string;
  holder: string;
  account: string;
  ifsc: string;
}

const EMPTY: Form = {
  name: "", phone: "", vendorType: null, otp: "", shopName: "", address: "", pincode: "", vehicle: null,
  aadhaar: "", aadhaarPhoto: null, selfie: null, consent: false, shopPhoto: null,
  payMethod: "upi", upiId: "", holder: "", account: "", ifsc: "",
};

// Screens: 1 about, 2 otp, 3 shop, 4 aadhaar, 5 payment, 6 review, 7 status
type Screen = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Shrinks a camera photo to at most 1600px JPEG so uploads stay small on slow networks. */
async function shrink(file: File): Promise<File> {
  try {
    const img = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

async function uploadPhoto(file: File, docType: "selfie" | "aadhaar_photo" | "shop_photo") {
  const fd = new FormData();
  fd.append("file", await shrink(file));
  fd.append("doc_type", docType);
  await authedFetch("/api/vendor/upload", { method: "POST", body: fd });
}

export function VendorSignup() {
  const sb = getSupabase();
  // Rendered only in the browser (see VendorSignupClient), so localStorage is safe here.
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem("abondhu-lang") === "as" ? "as" : "en";
    } catch {
      return "en";
    }
  });
  const t = strings(lang);
  const [screen, setScreen] = useState<Screen>(1);
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<{ status: Status; code: string | null; reason: string | null } | null>(null);
  const [booting, setBooting] = useState(true);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  const toggleLang = () => {
    const next = lang === "en" ? "as" : "en";
    setLang(next);
    try {
      localStorage.setItem("abondhu-lang", next);
    } catch {}
  };

  /** Picks up where a signed-in vendor left off. */
  const resume = useCallback(async () => {
    if (!sb) return;
    const { data: s } = await sb.auth.getSession();
    const uid = s.session?.user.id;
    if (!uid) return;
    const [{ data: p }, { data: v }] = await Promise.all([
      sb.from("profiles").select("full_name, phone").eq("id", uid).single(),
      sb.from("vendors").select("status, onboarding_step, application_code, rejection_reason, vendor_type").eq("id", uid).maybeSingle(),
    ]);
    setF((prev) => ({
      ...prev,
      name: p?.full_name ?? prev.name,
      phone: p?.phone ? p.phone.replace(/^\+91/, "") : prev.phone,
      vendorType: (v?.vendor_type as VendorType) ?? prev.vendorType,
    }));
    if (!v) {
      setScreen(1);
    } else if (v.status === "draft") {
      setScreen(Math.min(Math.max(v.onboarding_step, 3), 6) as Screen);
    } else {
      setStatus({ status: v.status, code: v.application_code, reason: v.rejection_reason });
      setScreen(7);
    }
  }, [sb]);

  useEffect(() => {
    // Loads the saved application once; state is set after the network calls resolve.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resume().finally(() => setBooting(false));
  }, [resume]);

  async function run(fn: () => Promise<void>) {
    setErr("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  const fail = (msg: string): never => {
    throw new Error(msg);
  };
  const uid = async (): Promise<string> => (await sb!.auth.getSession()).data.session?.user.id ?? fail("Please log in again.");

  // ---- step actions ----
  const sendOtp = () =>
    run(async () => {
      if (f.name.trim().length < 2) fail(t.errName);
      if (!/^[6-9]\d{9}$/.test(f.phone)) fail(t.errMobile);
      if (!f.vendorType) fail(t.errType);
      const { error } = await sb!.auth.signInWithOtp({ phone: "+91" + f.phone });
      if (error) fail(error.message);
      setScreen(2);
    });

  const verifyOtp = () =>
    run(async () => {
      const { error } = await sb!.auth.verifyOtp({ phone: "+91" + f.phone, token: f.otp, type: "sms" });
      if (error) fail(t.errOtp);
      const id = await uid();
      await sb!.from("profiles").update({ full_name: f.name.trim(), preferred_language: lang }).eq("id", id);
      const { data: v } = await sb!.from("vendors").select("id").eq("id", id).maybeSingle();
      if (!v) {
        const { error: e2 } = await sb!.from("vendors").insert({ id, vendor_type: f.vendorType, onboarding_step: 3 });
        if (e2) fail(e2.message);
        setScreen(3);
      } else {
        await resume();
      }
    });

  const saveShop = () =>
    run(async () => {
      if (f.address.trim().length < 5) fail(t.errAddress);
      if (!f.vehicle) fail(t.errVehicle);
      const { data: pin } = await sb!.from("pincodes").select("pincode").eq("pincode", f.pincode).eq("is_active", true).maybeSingle();
      if (!pin) fail(t.errPincode);
      const id = await uid();
      const { data: addr, error } = await sb!
        .from("addresses")
        .insert({ profile_id: id, label: "shop", line1: f.address.trim(), pincode: f.pincode, is_default: true })
        .select("id")
        .single();
      if (error) fail(error.message);
      await sb!.from("vendor_service_areas").upsert({ vendor_id: id, pincode: f.pincode });
      const { error: e2 } = await sb!
        .from("vendors")
        .update({ address_id: addr!.id, vehicle_type: f.vehicle, business_name: f.shopName.trim() || null, onboarding_step: 4 })
        .eq("id", id);
      if (e2) fail(e2.message);
      setScreen(4);
    });

  const saveAadhaar = () =>
    run(async () => {
      if (!isValidAadhaar(f.aadhaar)) fail(t.errAadhaar);
      if (!f.aadhaarPhoto || !f.selfie) fail(t.errPhotos);
      if (!f.consent) fail(t.errConsent);
      await authedFetch("/api/vendor/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aadhaar: digitsOnly(f.aadhaar), consent: true }),
      });
      await uploadPhoto(f.aadhaarPhoto!, "aadhaar_photo");
      await uploadPhoto(f.selfie!, "selfie");
      await sb!.from("vendors").update({ onboarding_step: 5 }).eq("id", await uid());
      setScreen(5);
    });

  const savePayment = () =>
    run(async () => {
      const id = await uid();
      let row: Record<string, string>;
      if (f.payMethod === "upi") {
        if (!/^[A-Za-z0-9.\-_]{2,}@[A-Za-z]{2,}$/.test(f.upiId)) fail(t.errUpi);
        row = { method: "upi", upi_id: f.upiId };
      } else {
        if (!/^[0-9]{9,18}$/.test(f.account) || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(f.ifsc) || f.holder.trim().length < 2) fail(t.errBank);
        row = { method: "bank", account_holder: f.holder.trim(), account_number: f.account, ifsc: f.ifsc };
      }
      await sb!.from("vendor_payout_accounts").delete().eq("vendor_id", id);
      const { error } = await sb!.from("vendor_payout_accounts").insert({ vendor_id: id, ...row });
      if (error) fail(t.errBank);
      if (f.shopPhoto) await uploadPhoto(f.shopPhoto, "shop_photo");
      await sb!.from("vendors").update({ onboarding_step: 6 }).eq("id", id);
      setScreen(6);
    });

  const submit = () =>
    run(async () => {
      const id = await uid();
      const { error } = await sb!.from("vendors").update({ status: "submitted" }).eq("id", id);
      if (error) fail(error.message);
      await resume();
    });

  const fixAgain = () =>
    run(async () => {
      const id = await uid();
      await sb!.from("vendors").update({ status: "draft", onboarding_step: 3 }).eq("id", id);
      setStatus(null);
      setScreen(3);
    });

  const logout = async () => {
    await sb?.auth.signOut();
    setF(EMPTY);
    setStatus(null);
    setScreen(1);
  };

  // ---- render ----
  if (!sb) return <Shell t={t} onLang={toggleLang}><p className="text-lg text-muted">{t.setupMissing}</p></Shell>;
  if (booting) return <Shell t={t} onLang={toggleLang}><Loader2 className="mx-auto size-8 animate-spin text-forest" /></Shell>;

  const stepNo = Math.min(screen, 6);
  const back = screen > 3 && screen < 7 ? () => setScreen((screen - 1) as Screen) : screen === 2 ? () => setScreen(1) : undefined;

  return (
    <Shell t={t} onLang={toggleLang} step={screen < 7 ? stepNo : undefined} onBack={back} onLogout={screen >= 3 ? logout : undefined}>
      {screen === 1 && (
        <>
          <Title>{t.aboutTitle}</Title>
          <Field label={t.name}>
            <input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t.mobile}>
            <div className={cn(input, "flex items-center gap-2")}>
              <span className="text-muted">+91</span>
              <input
                className="w-full bg-transparent outline-none"
                inputMode="numeric"
                autoComplete="tel-national"
                value={f.phone}
                onChange={(e) => set("phone", digitsOnly(e.target.value).slice(0, 10))}
              />
            </div>
          </Field>
          <Field label={t.whoAreYou}>
            <div className="grid grid-cols-3 gap-3">
              <Tile on={f.vendorType === "individual_collector"} onClick={() => set("vendorType", "individual_collector")} icon={<User />} label={t.collector} />
              <Tile on={f.vendorType === "scrap_shop"} onClick={() => set("vendorType", "scrap_shop")} icon={<Store />} label={t.shop} />
              <Tile on={f.vendorType === "recycler"} onClick={() => set("vendorType", "recycler")} icon={<Recycle />} label={t.recycler} />
            </div>
          </Field>
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={sendOtp}>{t.next}</Primary>
        </>
      )}

      {screen === 2 && (
        <>
          <Title>{t.otpTitle}</Title>
          <p className="text-muted">
            {t.otpSent} <b className="text-ink">+91 {f.phone}</b>
          </p>
          <input
            className={cn(input, "h-16 text-center font-mono text-3xl tracking-[0.5em]")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={f.otp}
            onChange={(e) => set("otp", digitsOnly(e.target.value).slice(0, 6))}
            aria-label="OTP"
          />
          <button type="button" className="text-center font-semibold text-forest underline" onClick={sendOtp} disabled={busy}>
            {t.resend}
          </button>
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={verifyOtp} disabled={f.otp.length !== 6}>{t.confirm}</Primary>
        </>
      )}

      {screen === 3 && (
        <>
          <Title>{t.shopTitle}</Title>
          <Field label={t.shopName}>
            <input className={input} value={f.shopName} onChange={(e) => set("shopName", e.target.value)} />
          </Field>
          <Field label={t.address}>
            <textarea className={cn(input, "h-auto min-h-20 py-3")} rows={2} value={f.address} onChange={(e) => set("address", e.target.value)} autoComplete="street-address" />
          </Field>
          <Field label={t.pincode}>
            <input className={input} inputMode="numeric" value={f.pincode} onChange={(e) => set("pincode", digitsOnly(e.target.value).slice(0, 6))} autoComplete="postal-code" />
          </Field>
          <Field label={t.vehicle}>
            <div className="grid grid-cols-2 gap-3">
              <Tile row on={f.vehicle === "cycle"} onClick={() => set("vehicle", "cycle")} icon={<Bike />} label={t.cycle} />
              <Tile row on={f.vehicle === "cart"} onClick={() => set("vehicle", "cart")} icon={<ShoppingCart />} label={t.cart} />
              <Tile row on={f.vehicle === "auto"} onClick={() => set("vehicle", "auto")} icon={<Car />} label={t.auto} />
              <Tile row on={f.vehicle === "truck"} onClick={() => set("vehicle", "truck")} icon={<Truck />} label={t.truck} />
            </div>
          </Field>
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={saveShop}>{t.next}</Primary>
        </>
      )}

      {screen === 4 && (
        <>
          <Title>{t.idTitle}</Title>
          <Field label={t.aadhaarNo}>
            <input
              className={cn(input, "font-mono text-xl tracking-wider")}
              inputMode="numeric"
              autoComplete="off"
              value={formatAadhaar(f.aadhaar)}
              onChange={(e) => set("aadhaar", digitsOnly(e.target.value).slice(0, 12))}
              placeholder="1234 5678 9012"
            />
          </Field>
          <PhotoPick label={t.aadhaarPhoto} file={f.aadhaarPhoto} onPick={(x) => set("aadhaarPhoto", x)} t={t} />
          <PhotoPick label={t.selfie} file={f.selfie} onPick={(x) => set("selfie", x)} t={t} front />
          <label className="flex items-start gap-3 rounded-xl bg-[#E8F1EE] p-4 text-[15px] leading-relaxed text-forest">
            <input type="checkbox" className="mt-1 size-5 accent-[var(--forest)]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
            {t.consent}
          </label>
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={saveAadhaar}>{t.next}</Primary>
        </>
      )}

      {screen === 5 && (
        <>
          <Title>{t.payTitle}</Title>
          <PhotoPick label={t.shopPhoto} file={f.shopPhoto} onPick={(x) => set("shopPhoto", x)} t={t} />
          <Field label={t.payWhere}>
            <div className="grid grid-cols-2 gap-3">
              <Tile row on={f.payMethod === "upi"} onClick={() => set("payMethod", "upi")} label={t.upi} />
              <Tile row on={f.payMethod === "bank"} onClick={() => set("payMethod", "bank")} label={t.bank} />
            </div>
          </Field>
          {f.payMethod === "upi" ? (
            <Field label={t.upiId}>
              <input className={input} value={f.upiId} onChange={(e) => set("upiId", e.target.value.trim())} autoCapitalize="none" placeholder="name@okaxis" />
            </Field>
          ) : (
            <>
              <Field label={t.holder}>
                <input className={input} value={f.holder} onChange={(e) => set("holder", e.target.value)} />
              </Field>
              <Field label={t.account}>
                <input className={input} inputMode="numeric" value={f.account} onChange={(e) => set("account", digitsOnly(e.target.value).slice(0, 18))} />
              </Field>
              <Field label={t.ifsc}>
                <input className={input} value={f.ifsc} onChange={(e) => set("ifsc", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))} />
              </Field>
            </>
          )}
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={savePayment}>{t.next}</Primary>
        </>
      )}

      {screen === 6 && (
        <>
          <Title>{t.reviewTitle}</Title>
          <p className="text-muted">{t.reviewHint}</p>
          <dl className="divide-y divide-line rounded-xl border border-line bg-white">
            <Row k={t.name} v={f.name} />
            <Row k={t.mobile} v={"+91 " + f.phone} />
            {f.address && <Row k={t.address} v={`${f.address}, ${f.pincode}`} />}
            {f.aadhaar && <Row k={t.aadhaarNo} v={maskAadhaar(f.aadhaar)} />}
            {(f.upiId || f.account) && <Row k={t.payWhere} v={f.payMethod === "upi" ? f.upiId : `${t.bank} …${f.account.slice(-4)}`} />}
          </dl>
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={submit}>{t.send}</Primary>
        </>
      )}

      {screen === 7 && status && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className={cn("grid size-24 place-items-center rounded-full text-white", status.status === "rejected" ? "bg-danger" : "bg-forest")}>
            <Check className="size-12" strokeWidth={3} />
          </span>
          {status.status === "submitted" && (
            <>
              <Title>{t.sentTitle}</Title>
              <p className="text-muted">{t.appNo}</p>
              <p className="rounded-xl border-2 border-gold bg-white px-5 py-2 font-mono text-2xl font-bold text-navy">{status.code}</p>
              <p className="text-muted">{t.sentHint}</p>
            </>
          )}
          {status.status === "approved" && (
            <>
              <Title>{t.approvedTitle}</Title>
              <p className="text-muted">{t.approvedHint}</p>
            </>
          )}
          {status.status === "rejected" && (
            <>
              <Title>{t.rejectedTitle}</Title>
              <p className="text-muted">
                {t.rejectedHint} {status.reason}
              </p>
              <Err msg={err} />
              <Primary busy={busy} t={t} onClick={fixAgain}>{t.fix}</Primary>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}

// ---- small building blocks ----
const input =
  "h-14 w-full rounded-xl border-2 border-line bg-white px-4 text-lg text-ink outline-none transition-colors focus:border-forest";

function Shell({ t, onLang, step, onBack, onLogout, children }: {
  t: Strings; onLang: () => void; step?: number; onBack?: () => void; onLogout?: () => void; children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-sunk">
      <header className="bg-navy px-5 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white">
        <div className="mx-auto flex max-w-md items-center gap-3">
          {onBack ? (
            <button type="button" onClick={onBack} aria-label={t.back} className="-ml-2 grid size-10 place-items-center">
              <ArrowLeft className="size-6" />
            </button>
          ) : null}
          <Link href="/" className="flex items-center gap-2 font-serif text-xl">
            <Image src="/abondhu-mark.png" alt="" width={32} height={24} className="h-6 w-auto rounded bg-white p-0.5" />
            Abondhu
          </Link>
          <button type="button" onClick={onLang} className="ml-auto rounded-full border border-gold px-3 py-1 text-sm text-gold">
            {t.switchTo}
          </button>
        </div>
        {step && (
          <div className="mx-auto mt-4 max-w-md">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= step ? "bg-gold" : "bg-white/20")} />
              ))}
            </div>
            <p className="mt-2 text-sm text-gold">{t.step(step)}</p>
          </div>
        )}
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-5 py-6">{children}</main>
      {onLogout && (
        <div className="mx-auto max-w-md px-5 pb-8 text-center">
          <button type="button" onClick={onLogout} className="text-sm text-muted underline">
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
}

const Title = ({ children }: { children: ReactNode }) => <h1 className="text-2xl font-bold leading-snug text-navy">{children}</h1>;

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[17px] font-semibold text-ink">{label}</span>
      {children}
    </div>
  );
}

function Tile({ on, onClick, icon, label, row }: { on: boolean; onClick: () => void; icon?: ReactNode; label: string; row?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex min-h-14 items-center gap-2 rounded-xl border-2 bg-white px-3 py-3 font-semibold transition-colors [&_svg]:size-6 [&_svg]:text-navy",
        row ? "justify-start" : "flex-col justify-center text-center",
        on ? "border-gold bg-[#FFF9E6]" : "border-line",
      )}
    >
      {icon && <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand">{icon}</span>}
      {label}
    </button>
  );
}

function PhotoPick({ label, file, onPick, t, front }: { label: string; file: File | null; onPick: (f: File | null) => void; t: Strings; front?: boolean }) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return (
    <Field label={label}>
      <label className={cn("relative flex h-36 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed bg-white font-semibold text-navy", file ? "border-forest" : "border-gold")}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="absolute inset-0 size-full object-cover opacity-40" />
        ) : null}
        <Camera className="relative size-9 text-gold" />
        <span className="relative">{file ? t.retake : t.takePhoto}</span>
        <input
          type="file"
          accept="image/*"
          capture={front ? "user" : "environment"}
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </label>
    </Field>
  );
}

function Primary({ children, onClick, busy, disabled, t }: { children: ReactNode; onClick: () => void; busy: boolean; disabled?: boolean; t: Strings }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || disabled}
      className="mt-2 flex h-16 items-center justify-center gap-3 rounded-2xl bg-forest text-xl font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-50"
    >
      {busy ? (
        <>
          <Loader2 className="size-6 animate-spin" /> {t.wait}
        </>
      ) : (
        <>
          {children} <ArrowRight className="size-6" />
        </>
      )}
    </button>
  );
}

const Err = ({ msg }: { msg: string }) => (msg ? <p role="alert" className="rounded-xl bg-red-50 p-3 font-medium text-danger">{msg}</p> : null);

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex flex-col gap-0.5 px-4 py-3">
    <dt className="text-sm text-muted">{k}</dt>
    <dd className="font-semibold text-ink">{v}</dd>
  </div>
);
