// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayLabel, isJorhatPin, isMobile, pickupDays, pickupNote } from "./booking.ts";

const now = new Date(2026, 10, 10, 21, 0); // Tue 10 Nov 2026, 9 pm

test("pickupDays gives five local days from today", () => {
  assert.deepEqual(pickupDays(now), ["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14"]);
  assert.deepEqual(pickupDays(new Date(2026, 11, 30)).slice(-2), ["2027-01-02", "2027-01-03"]);
});

test("dayLabel names today and tomorrow", () => {
  assert.match(dayLabel("2026-11-10", now), /^Today, Tue 10 Nov/);
  assert.match(dayLabel("2026-11-11", now), /^Tomorrow, /);
  assert.doesNotMatch(dayLabel("2026-11-12", now), /Today|Tomorrow/);
});

test("pickupNote puts the day first and keeps the scrap text tidy", () => {
  assert.equal(pickupNote("2026-11-12", "  old   newspapers\n2 coolers ", now), "Preferred day: Thu 12 Nov. old newspapers 2 coolers");
  assert.equal(pickupNote("2026-11-11", "", now), "Preferred day: Wed 11 Nov.");
  assert.equal(pickupNote("2026-11-12", "x".repeat(500), now).length, "Preferred day: Thu 12 Nov. ".length + 300);
});

test("pincode and mobile checks", () => {
  assert.ok(isJorhatPin("785001"));
  assert.ok(!isJorhatPin("781001"));
  assert.ok(isMobile("98640 12345"));
  assert.ok(!isMobile("12345 67890"));
});
