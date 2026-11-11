"use client";

// "Your workers" on the vendor home: add the people who go on pickups (name, mobile,
// Aadhaar number + card photo, face photo) and see whether the admin approved them.
import { Plus, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { digitsOnly, formatAadhaar, isValidAadhaar } from "@/lib/aadhaar";
import { authedFetch, getSupabase } from "@/lib/supabase";
import { useAction } from "@/lib/use-action";
import { cn } from "@/lib/utils";
import { cleanMobile, isValid, MAX_STAFF, type StaffStatus } from "@/lib/vendor";
import type { HomeStrings } from "@/lib/vendor-home-i18n";
import type { Strings } from "@/lib/vendor-i18n";
import { shrink } from "./photos";
import { Err, Field, input, PhotoPick, Primary } from "./ui";

interface Staff {
  id: string;
  full_name: string;
  phone: string;
  status: StaffStatus;
  rejection_reason: string | null;
}

const BADGE: Record<StaffStatus, string> = {
  pending: "bg-[#FFF9E6] text-navy ring-1 ring-gold",
  approved: "bg-[#E8F1EE] text-forest",
  rejected: "bg-red-50 text-danger",
};

const EMPTY = { name: "", phone: "", aadhaar: "", card: null as File | null, face: null as File | null, consent: false };

export function StaffSection({ t, h }: { t: Strings; h: HomeStrings }) {
  const s = h.staff;
  const [list, setList] = useState<Staff[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(EMPTY);
  const { busy, err, run } = useAction();
  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setF((p) => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()!
      .from("vendor_staff")
      .select("id, full_name, phone, status, rejection_reason")
      .order("created_at");
    if (error) throw new Error(h.loadErr);
    setList(data as Staff[]);
  }, [h.loadErr]);

  useEffect(() => {
    run(load);
  }, [run, load]);

  const save = () =>
    run(async () => {
      if (f.name.trim().length < 2) throw new Error(s.errName);
      if (!isValid.mobile(f.phone)) throw new Error(t.errMobile);
      if (!isValidAadhaar(f.aadhaar)) throw new Error(t.errAadhaar);
      if (!f.card || !f.face) throw new Error(t.errPhotos);
      if (!f.consent) throw new Error(t.errConsent);
      const fd = new FormData();
      fd.append("name", f.name.trim());
      fd.append("phone", f.phone);
      fd.append("aadhaar", f.aadhaar);
      fd.append("consent", "true");
      fd.append("aadhaar_photo", await shrink(f.card));
      fd.append("face_photo", await shrink(f.face));
      await authedFetch("/api/vendor/staff", { method: "POST", body: fd }).catch((e: Error) => {
        throw e.message === "aadhaar_taken" ? new Error(s.errTaken) : e;
      });
      setF(EMPTY);
      setAdding(false);
      await load();
    });

  const remove = (p: Staff) =>
    run(async () => {
      if (!window.confirm(s.removeAsk(p.full_name))) return;
      await authedFetch("/api/vendor/staff", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id }),
      });
      await load();
    });

  if (adding) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <h3 className="text-xl font-bold text-navy">{s.formTitle}</h3>
        <Field label={s.name}>
          <input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="off" />
        </Field>
        <Field label={s.mobile}>
          <div className={cn(input, "flex items-center gap-2")}>
            <span className="text-muted">+91</span>
            <input
              className="w-full bg-transparent outline-none"
              inputMode="numeric"
              autoComplete="off"
              value={f.phone}
              onChange={(e) => set("phone", cleanMobile(e.target.value))}
            />
          </div>
        </Field>
        <Field label={s.aadhaarNo}>
          <input
            className={cn(input, "font-mono text-xl tracking-wider")}
            inputMode="numeric"
            autoComplete="off"
            value={formatAadhaar(f.aadhaar)}
            onChange={(e) => set("aadhaar", digitsOnly(e.target.value).slice(0, 12))}
            placeholder="1234 5678 9012"
          />
        </Field>
        <PhotoPick label={s.aadhaarPhoto} file={f.card} onPick={(x) => set("card", x)} t={t} />
        <PhotoPick label={s.face} file={f.face} onPick={(x) => set("face", x)} t={t} front />
        <label className="flex items-start gap-3 rounded-xl bg-[#E8F1EE] p-4 text-[15px] leading-relaxed text-forest">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--forest)]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} />
          {s.consent}
        </label>
        <Err msg={err} />
        <Primary busy={busy} t={t} onClick={save}>{s.save}</Primary>
        <button type="button" className="py-2 font-semibold text-muted underline" disabled={busy} onClick={() => { setAdding(false); setF(EMPTY); }}>
          {s.cancel}
        </button>
      </div>
    );
  }

  return (
    <>
      {list && list.length === 0 && <p className="px-1 text-muted">{s.emptyHint}</p>}
      {list?.map((p) => (
        <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sand text-navy">
            <UserRound className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-ink">{p.full_name}</p>
            <p className="font-mono text-sm text-muted">{p.phone.replace(/^\+91/, "+91 ")}</p>
            <span className={cn("mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-bold", BADGE[p.status])}>{s.status[p.status]}</span>
            {p.status === "rejected" && p.rejection_reason && <p className="mt-1 text-sm text-danger">{p.rejection_reason}</p>}
          </div>
          <button
            type="button"
            onClick={() => remove(p)}
            disabled={busy}
            aria-label={`${s.remove} ${p.full_name}`}
            className="grid size-12 shrink-0 place-items-center rounded-xl border-2 border-line text-muted"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      ))}
      <Err msg={err} />
      {list && list.length < MAX_STAFF && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold bg-white text-lg font-bold text-navy transition-transform active:scale-[0.98]"
        >
          <Plus className="size-6 text-gold" /> {s.add}
        </button>
      )}
    </>
  );
}
