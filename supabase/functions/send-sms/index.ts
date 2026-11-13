// Supabase "Send SMS" auth hook: Supabase makes and checks the login code;
// this function only delivers it through MSG91 using the DLT-approved template.
// Secrets (set in Supabase, never in files): SEND_SMS_HOOK_SECRET, MSG91_AUTH_KEY, MSG91_TEMPLATE_ID.
import { Webhook } from "npm:standardwebhooks@1.0.0";

const MSG91_URL = "https://control.msg91.com/api/v5/flow";
// Name of the variable in the MSG91 template that holds the code (##otp##).
const OTP_VAR = "otp";

type Env = (name: string) => string | undefined;

/** Supabase stores phones like "919876543210". MSG91 wants the same, digits only. */
export function toMsg91Mobile(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  return /^91[6-9]\d{9}$/.test(digits) ? digits : null;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// The message is shown to the person on the login screen, so keep it plain.
const fail = (status: number, message: string) => json(status, { error: { http_code: status, message } });

export function makeHandler(env: Env, fetchFn: typeof fetch = fetch) {
  return async (req: Request): Promise<Response> => {
    const secret = env("SEND_SMS_HOOK_SECRET");
    const authKey = env("MSG91_AUTH_KEY");
    const templateId = env("MSG91_TEMPLATE_ID");
    if (!secret || !authKey || !templateId) {
      console.error("send-sms: a secret is missing");
      return fail(500, "SMS login is not set up yet. Please use email.");
    }

    let event: { user?: { phone?: string }; sms?: { otp?: string } };
    try {
      const wh = new Webhook(secret.replace("v1,whsec_", ""));
      event = wh.verify(await req.text(), Object.fromEntries(req.headers)) as typeof event;
    } catch {
      return fail(401, "Unauthorized");
    }

    const mobile = toMsg91Mobile(event.user?.phone ?? "");
    const otp = event.sms?.otp ?? "";
    if (!mobile) return fail(400, "Please use an Indian mobile number.");
    if (!/^\d{4,10}$/.test(otp)) return fail(500, "Could not send the code. Please try again.");

    try {
      const res = await fetchFn(MSG91_URL, {
        method: "POST",
        headers: { authkey: authKey, accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ template_id: templateId, recipients: [{ mobiles: mobile, [OTP_VAR]: otp }] }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body?.type !== "success") {
        // Never log the phone number or the code.
        console.error("send-sms: MSG91 refused", res.status, String(body?.message ?? "").slice(0, 200));
        return fail(502, "Could not send the code. Please try again in a minute.");
      }
      return json(200, {});
    } catch (e) {
      console.error("send-sms: MSG91 unreachable", String(e).slice(0, 200));
      return fail(502, "Could not send the code. Please try again in a minute.");
    }
  };
}

if (import.meta.main) Deno.serve(makeHandler((name) => Deno.env.get(name)));
