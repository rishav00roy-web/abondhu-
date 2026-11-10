// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { helpLink, maskPayout, monthStats, rupees, splitPickups, type PickupLite } from "./vendor-home.ts";

const p = (id: string, status: PickupLite["status"], extra: Partial<PickupLite> = {}): PickupLite => ({
  id, code: `AB-${id}`, status, pincode: "785001", requested_at: "2026-11-01T10:00:00Z", completed_at: null,
  total_weight_kg: null, slot_date: null, start_time: null, address: null, note: null, ...extra,
});

test("splitPickups keeps active ones soonest first and finished ones newest first", () => {
  const { upcoming, done } = splitPickups([
    p("late", "accepted", { slot_date: "2026-11-12", start_time: "10:00:00" }),
    p("soon", "assigned", { slot_date: "2026-11-11", start_time: "09:00:00" }),
    p("old", "completed", { completed_at: "2026-11-02T10:00:00Z" }),
    p("new", "completed", { completed_at: "2026-11-09T10:00:00Z" }),
    p("x", "cancelled"),
    p("open", "requested"),
  ]);
  assert.deepEqual(upcoming.map((x) => x.id), ["soon", "late"]);
  assert.deepEqual(done.map((x) => x.id), ["new", "old"]);
});

test("monthStats counts this month only and reads numeric strings", () => {
  const now = new Date(2026, 10, 10, 12);
  const s = monthStats(
    [
      p("a", "completed", { completed_at: new Date(2026, 10, 3).toISOString(), total_weight_kg: "12.5" }),
      p("b", "completed", { completed_at: new Date(2026, 10, 9).toISOString(), total_weight_kg: 7 }),
      p("c", "completed", { completed_at: new Date(2026, 9, 30).toISOString(), total_weight_kg: 99 }),
      p("d", "accepted"),
    ],
    [{ amount: "500.40", status: "paid", paid_at: null }, { amount: 300, status: "pending", paid_at: null }],
    now,
  );
  assert.deepEqual(s, { count: 2, kg: 19.5, paid: 500 });
});

test("monthStats handles a brand new vendor", () => {
  assert.deepEqual(monthStats([], []), { count: 0, kg: 0, paid: 0 });
});

test("money and payout masking", () => {
  assert.equal(rupees(125000), "₹1,25,000");
  assert.equal(maskPayout({ method: "bank", upi_id: null, account_number: "123456789012" }), "•••• 9012");
  assert.equal(maskPayout({ method: "upi", upi_id: "ram@okaxis", account_number: null }), "ram@okaxis");
  assert.equal(maskPayout(null), null);
});

test("helpLink names the vendor", () => {
  const url = helpLink("Ram Das", "AB-V-1001");
  assert.ok(url.startsWith("https://wa.me/919000000000?text="));
  assert.ok(decodeURIComponent(url).includes("Ram Das (AB-V-1001)"));
});
