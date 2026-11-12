"use client";

import { Bike, Car, Check, Loader2, Recycle, ShoppingCart, Store, Truck, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { digitsOnly, formatAadhaar, isValidAadhaar, maskAadhaar } from "@/lib/aadhaar";
import { getSupabase, postJson } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";
import { cleanMobile, isValid, type Vehicle, type VendorStatus, type VendorType } from "@/lib/vendor";
import { strings, type Lang } from "@/lib/vendor-i18n";
import { uploadPhoto } from "./photos";
import { VendorHome } from "./VendorHome";
import { Err, Field, input, PhotoPick, Primary, Row, Shell, Tile, Title } from "./ui";

interface Form {
  name: string;
  phone: string; // 10 digits, always kept as the contact number
  byEmail: boolean; // login code by email instead of SMS
  email: string;
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

// SMS codes stay off until MSG91 (DLT sender ID + template) is live. Then set true.
const SMS_READY = false;

const EMPTY: Form = {
  name: "", phone: "", byEmail: true, email: "", vendorType: null, otp: "", shopName: "", address: "", pincode: "", vehicle: null,
  aadhaar: "", aadhaarPhoto: null, selfie: null, consent: false, shopPhoto: null,
  payMethod: "upi", upiId: "", holder: "", account: "", ifsc: "",
};

// Screens: 1 about, 2 otp, 3 shop, 4 aadhaar, 5 payment, 6 review, 7 status
type Screen = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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
  const { busy, err, run } = useAction();
  const [status, setStatus] = useState<{ status: VendorStatus; code: string | null; reason: string | null } | null>(null);
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
      sb.from("profiles").select("full_name, phone, email").eq("id", uid).single(),
      sb.from("vendors").select("status, onboarding_step, application_code, rejection_reason, vendor_type").eq("id", uid).maybeSingle(),
    ]);
    setF((prev) => ({
      ...prev,
      name: p?.full_name ?? prev.name,
      phone: p?.phone ? p.phone.replace(/^\+91/, "") : prev.phone,
      email: p?.email ?? prev.email,
      // Signed in by email (e.g. from the email link) without a contact number yet.
      byEmail: prev.byEmail || (!!p?.email && !p?.phone),
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

  const fail = (msg: string): never => {
    throw new Error(msg);
  };
  const uid = async (): Promise<string> => (await sb!.auth.getSession()).data.session?.user.id ?? fail("Please log in again.");

  // ---- step actions ----
  const sendOtp = () =>
    run(async () => {
      if (f.name.trim().length < 2) fail(t.errName);
      if (!isValid.mobile(f.phone)) fail(t.errMobile);
      if (f.byEmail && !isValid.email(f.email.trim())) fail(t.errEmail);
      if (!f.vendorType) fail(t.errType);
      // Already signed in (came back through the email link): no code needed.
      if ((await sb!.auth.getSession()).data.session) return afterLogin();
      const { error } = f.byEmail
        ? await sb!.auth.signInWithOtp({ email: f.email.trim(), options: { emailRedirectTo: `${location.origin}/partner` } })
        : await sb!.auth.signInWithOtp({ phone: "+91" + f.phone });
      if (error) fail(error.message);
      setScreen(2);
    });

  const verifyOtp = () =>
    run(async () => {
      const { error } = f.byEmail
        ? await sb!.auth.verifyOtp({ email: f.email.trim(), token: f.otp, type: "email" })
        : await sb!.auth.verifyOtp({ phone: "+91" + f.phone, token: f.otp, type: "sms" });
      if (error) fail(t.errOtp);
      await afterLogin();
    });

  /** Saves step 1 for the signed-in user and moves on. */
  async function afterLogin() {
    if (f.byEmail) {
      // Email logins have no verified phone yet: save the number they typed as the contact.
      await postJson("/api/vendor/contact", { phone: f.phone }).catch(async (e: Error) => {
        await sb!.auth.signOut();
        fail(e.message === "phone_taken" ? t.errPhoneTaken : e.message);
      });
    }
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
  }

  const saveShop = () =>
    run(async () => {
      if (f.address.trim().length < 5) fail(t.errAddress);
      if (!f.vehicle) fail(t.errVehicle);
      const { data: pin } = await sb!.from("pincodes").select("pincode").eq("pincode", f.pincode).eq("is_active", true).maybeSingle();
      if (!pin) fail(t.errPincode);
      const id = await uid();
      // Coming back to this step edits the same shop address and area instead of adding more.
      const { data: v } = await sb!.from("vendors").select("address_id").eq("id", id).single();
      const shop = { profile_id: id, label: "shop", line1: f.address.trim(), pincode: f.pincode, is_default: true };
      const { data: addr, error } = v?.address_id
        ? await sb!.from("addresses").update(shop).eq("id", v.address_id).select("id").single()
        : await sb!.from("addresses").insert(shop).select("id").single();
      if (error) fail(error.message);
      await sb!.from("vendor_service_areas").delete().eq("vendor_id", id).neq("pincode", f.pincode);
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
      await postJson("/api/vendor/aadhaar", { aadhaar: digitsOnly(f.aadhaar), consent: true });
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
        if (!isValid.upi(f.upiId)) fail(t.errUpi);
        row = { method: "upi", upi_id: f.upiId };
      } else {
        if (!isValid.account(f.account) || !isValid.ifsc(f.ifsc) || f.holder.trim().length < 2) fail(t.errBank);
        row = { method: "bank", account_holder: f.holder.trim(), account_number: f.account, ifsc: f.ifsc };
      }
      // Edit the saved account in place, so a failed save never leaves the vendor with none.
      const blank = { upi_id: null, account_holder: null, account_number: null, ifsc: null, is_verified: false };
      const { data: saved } = await sb!.from("vendor_payout_accounts").select("id").eq("vendor_id", id).maybeSingle();
      const { error } = saved
        ? await sb!.from("vendor_payout_accounts").update({ ...blank, ...row }).eq("id", saved.id)
        : await sb!.from("vendor_payout_accounts").insert({ vendor_id: id, ...row });
      if (error) fail(t.errBank);
      if (f.shopPhoto) await uploadPhoto(f.shopPhoto, "shop_photo");
      await sb!.from("vendors").update({ onboarding_step: 6 }).eq("id", id);
      setScreen(6);
    });

  const submit = () =>
    run(async () => {
      const id = await uid();
      const { error } = await sb!.from("vendors").update({ status: "submitted" }).eq("id", id);
      if (error) fail(error.message.includes("not complete") ? t.errIncomplete : error.message);
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
                onChange={(e) => set("phone", cleanMobile(e.target.value))}
              />
            </div>
          </Field>
          {f.byEmail && (
            <Field label={t.email}>
              <input className={input} type="email" inputMode="email" autoComplete="email" autoCapitalize="none" value={f.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
          )}
          {SMS_READY ? (
            <button type="button" className="self-start font-semibold text-forest underline" onClick={() => set("byEmail", !f.byEmail)}>
              {f.byEmail ? t.usePhone : t.useEmail}
            </button>
          ) : (
            <button type="button" disabled className="flex items-center gap-2 self-start font-semibold text-muted">
              {t.usePhone}
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs font-bold text-navy">{t.comingSoon}</span>
            </button>
          )}
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
          <Title>{f.byEmail ? t.otpTitleEmail : t.otpTitle}</Title>
          <p className="text-muted">
            {t.otpSent} <b className="break-all text-ink">{f.byEmail ? f.email.trim() : `+91 ${f.phone}`}</b>
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
            {f.email && <Row k={t.email} v={f.email} />}
            {f.address && <Row k={t.address} v={`${f.address}, ${f.pincode}`} />}
            {f.aadhaar && <Row k={t.aadhaarNo} v={maskAadhaar(f.aadhaar)} />}
            {(f.upiId || f.account) && <Row k={t.payWhere} v={f.payMethod === "upi" ? f.upiId : `${t.bank} …${f.account.slice(-4)}`} />}
          </dl>
          <Err msg={err} />
          <Primary busy={busy} t={t} onClick={submit}>{t.send}</Primary>
        </>
      )}

      {screen === 7 && status?.status === "approved" && <VendorHome t={t} lang={lang} />}

      {screen === 7 && status && status.status !== "approved" && (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className={cn("grid size-24 place-items-center rounded-full text-white", status.status === "submitted" ? "bg-forest" : "bg-danger")}>
            {status.status === "submitted" ? <Check className="size-12" strokeWidth={3} /> : <X className="size-12" strokeWidth={3} />}
          </span>
          {status.status === "submitted" && (
            <>
              <Title>{t.sentTitle}</Title>
              <p className="text-muted">{t.appNo}</p>
              <p className="rounded-xl border-2 border-gold bg-white px-5 py-2 font-mono text-2xl font-bold text-navy">{status.code}</p>
              <p className="text-muted">{t.sentHint}</p>
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
          {status.status === "suspended" && (
            <>
              <Title>{t.suspendedTitle}</Title>
              <p className="text-muted">
                {t.suspendedHint} {status.reason}
              </p>
            </>
          )}
        </div>
      )}
    </Shell>
  );
}
