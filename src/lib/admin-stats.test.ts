// Run with `npm test` (Node's built-in test runner; Node 22.18+ reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { byArea, describe, summarize, timeAgo, type AuditLite, type VendorLite } from "./admin-stats.ts";

const now = new Date(2026, 10, 10, 20, 0); // 10 Nov 2026, 8 pm local
const v = (id: string, status: VendorLite["status"], created: Date, pincode: string | null = "785001"): VendorLite => ({
  id, status, created_at: created.toISOString(), name: `Vendor ${id}`, pincode,
});

test("summarize counts statuses and recent sign-ups", () => {
  const s = summarize([
    v("a", "submitted", new Date(2026, 10, 10, 9)),
    v("b", "approved", new Date(2026, 10, 6)),
    v("c", "draft", new Date(2026, 9, 1)),
  ], now);
  assert.equal(s.total, 3);
  assert.equal(s.byStatus.submitted, 1);
  assert.equal(s.byStatus.approved, 1);
  assert.equal(s.byStatus.draft, 1);
  assert.equal(s.byStatus.rejected, 0);
  assert.equal(s.newToday, 1);
  assert.equal(s.newThisWeek, 2);
});

test("summarize handles no vendors", () => {
  const s = summarize([], now);
  assert.equal(s.total, 0);
  assert.equal(s.newThisWeek, 0);
});

test("byArea lists every pincode, busiest first, counting only approved and waiting", () => {
  const rows = byArea(
    [
      v("a", "approved", now, "785004"),
      v("b", "submitted", now, "785004"),
      v("c", "approved", now, "785001"),
      v("d", "approved", now, "785001"),
      v("e", "draft", now, "785006"),
      v("f", "approved", now, null),
    ],
    [
      { pincode: "785001", area_name: "Jorhat town" },
      { pincode: "785004", area_name: null },
      { pincode: "785006", area_name: null },
    ],
  );
  assert.deepEqual(rows.map((r) => [r.pincode, r.approved, r.waiting]), [
    ["785001", 2, 0],
    ["785004", 1, 1],
    ["785006", 0, 0],
  ]);
});

const row = (over: Partial<AuditLite>): AuditLite => ({
  id: 1, action: "update", table_name: "vendors", record_id: "a", actor_id: null, at: now.toISOString(),
  new_status: null, old_status: null, new_role: null, old_role: null, new_blocked: null, old_blocked: null,
  kyc_vendor: null, profile_name: null, ...over,
});
const names = new Map([["a", "Ramen Das"]]);

test("describe turns status changes into lines and skips step saves", () => {
  assert.equal(describe(row({ new_status: "submitted", old_status: "draft" }), names, null)?.text, "Ramen Das sent an application");
  const approved = describe(row({ new_status: "approved", old_status: "submitted", actor_id: "me" }), names, "me");
  assert.equal(approved?.tone, "good");
  assert.equal(approved?.byYou, true);
  assert.equal(describe(row({ new_status: "draft", old_status: "draft" }), names, null), null);
  assert.equal(describe(row({ action: "insert", record_id: "zz" }), names, null)?.text, "A vendor started signing up");
});

test("describe shows Aadhaar views and admin role changes", () => {
  const view = describe(row({ action: "view_aadhaar", table_name: "vendor_aadhaar_vault" }), names, null);
  assert.equal(view?.text, "Full Aadhaar viewed for Ramen Das");
  assert.equal(view?.tone, "watch");
  const role = describe(row({ table_name: "profiles", record_id: "x", new_role: "admin", old_role: "customer", profile_name: "Rishav" }), names, null);
  assert.equal(role?.text, "Rishav is now an admin");
  assert.equal(describe(row({ table_name: "customer_payments" }), names, null), null);
});

test("timeAgo", () => {
  assert.equal(timeAgo(new Date(now.getTime() - 30_000).toISOString(), now), "just now");
  assert.equal(timeAgo(new Date(now.getTime() - 5 * 60_000).toISOString(), now), "5 min ago");
  assert.equal(timeAgo(new Date(now.getTime() - 3 * 3600_000).toISOString(), now), "3 h ago");
});
