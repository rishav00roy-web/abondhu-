// Run: deno test supabase/functions/send-sms/   (no network, no real SMS)
import { assertEquals } from "jsr:@std/assert@1";
import { Webhook } from "npm:standardwebhooks@1.0.0";
import { makeHandler, toMsg91Mobile } from "./index.ts";

const RAW = btoa("test-secret-test-secret-123456");
const env = (vals: Record<string, string>) => (k: string) => vals[k];
const ok = { SEND_SMS_HOOK_SECRET: `v1,whsec_${RAW}`, MSG91_AUTH_KEY: "key", MSG91_TEMPLATE_ID: "tpl" };

function signed(payload: unknown, secret = RAW): Request {
  const body = JSON.stringify(payload);
  const id = "msg_1";
  const ts = new Date();
  const sig = new Webhook(secret).sign(id, ts, body);
  return new Request("http://x", {
    method: "POST",
    body,
    headers: { "webhook-id": id, "webhook-timestamp": String(Math.floor(ts.getTime() / 1000)), "webhook-signature": sig },
  });
}

const event = { user: { phone: "919876543210" }, sms: { otp: "482913" } };

function fakeMsg91(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as unknown as typeof fetch;
  return { fn, calls };
}

Deno.test("phone numbers", () => {
  assertEquals(toMsg91Mobile("919876543210"), "919876543210");
  assertEquals(toMsg91Mobile("+91 98765 43210"), "919876543210");
  assertEquals(toMsg91Mobile("9876543210"), null);
  assertEquals(toMsg91Mobile("14155550100"), null);
  assertEquals(toMsg91Mobile("915876543210"), null);
});

Deno.test("sends the code through MSG91 with the template", async () => {
  const m = fakeMsg91(200, { type: "success", message: "abc" });
  const res = await makeHandler(env(ok), m.fn)(signed(event));
  assertEquals(res.status, 200);
  assertEquals(await res.json(), {});
  assertEquals(m.calls.length, 1);
  assertEquals(m.calls[0].url, "https://control.msg91.com/api/v5/flow");
  assertEquals((m.calls[0].init.headers as Record<string, string>).authkey, "key");
  assertEquals(JSON.parse(m.calls[0].init.body as string), {
    template_id: "tpl",
    recipients: [{ mobiles: "919876543210", otp: "482913" }],
  });
});

Deno.test("rejects a request not signed by Supabase", async () => {
  const m = fakeMsg91(200, { type: "success" });
  const res = await makeHandler(env(ok), m.fn)(signed(event, btoa("someone-else-secret-000000")));
  assertEquals(res.status, 401);
  assertEquals(m.calls.length, 0);
});

Deno.test("MSG91 error shows a clear message", async () => {
  const m = fakeMsg91(200, { type: "error", message: "Template not approved" });
  const res = await makeHandler(env(ok), m.fn)(signed(event));
  assertEquals(res.status, 502);
  assertEquals((await res.json()).error.http_code, 502);
});

Deno.test("MSG91 unreachable", async () => {
  const down = (() => Promise.reject(new Error("network down"))) as unknown as typeof fetch;
  const res = await makeHandler(env(ok), down)(signed(event));
  assertEquals(res.status, 502);
});

Deno.test("non-Indian number is refused without calling MSG91", async () => {
  const m = fakeMsg91(200, { type: "success" });
  const res = await makeHandler(env(ok), m.fn)(signed({ ...event, user: { phone: "14155550100" } }));
  assertEquals(res.status, 400);
  assertEquals(m.calls.length, 0);
});

Deno.test("missing secrets", async () => {
  const m = fakeMsg91(200, { type: "success" });
  const res = await makeHandler(env({}), m.fn)(signed(event));
  assertEquals(res.status, 500);
  assertEquals(m.calls.length, 0);
});
