// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { helpLink, monthStats, splitPickups, type PickupLite } from "./vendor-home.ts";

const p = (id: string, status: PickupLite["status"], extra: Partial<PickupLite> = {}): PickupLite => ({
  id, code: `AB-${id}`, status, pincode: "785001", requested_at: "2026-11-01T10:00:00Z", completed_at: null,
  total_weight_kg: null, slot_date: null, start_time: null, address: null, note: null, photos: [], mine: true, ...extra,
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

test("splitPickups lists open pickups in the area to accept, oldest first", () => {
  const { nearby, upcoming } = splitPickups([
    p("b", "requested", { mine: false, requested_at: "2026-11-02T10:00:00Z" }),
    p("a", "requested", { mine: false, requested_at: "2026-11-01T10:00:00Z" }),
    p("taken", "accepted", { mine: false }),
    p("own", "accepted"),
  ]);
  assert.deepEqual(nearby.map((x) => x.id), ["a", "b"]);
  assert.deepEqual(upcoming.map((x) => x.id), ["own"]);
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
    now,
  );
  assert.deepEqual(s, { count: 2, kg: 19.5 });
});

test("monthStats handles a brand new vendor", () => {
  assert.deepEqual(monthStats([]), { count: 0, kg: 0 });
});

test("helpLink names the vendor", () => {
  const url = helpLink("Ram Das", "AB-V-1001");
  assert.ok(url.startsWith("https://wa.me/919181330755?text="));
  assert.ok(decodeURIComponent(url).includes("Ram Das (AB-V-1001)"));
});
