// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayLabel, isJorhatPin, isMobile, pickupDays, pickupNote, slotsFor } from "./booking.ts";

const now = new Date(2026, 10, 10, 21, 0); // Tue 10 Nov 2026, 9 pm

test("pickupDays skips Sundays, and today once its last slot has started", () => {
  assert.deepEqual(pickupDays(now), ["2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-16"]);
  assert.deepEqual(pickupDays(new Date(2026, 10, 10, 8)).slice(0, 1), ["2026-11-10"]);
  assert.deepEqual(pickupDays(new Date(2026, 11, 30)).slice(-2), ["2027-01-02", "2027-01-04"]);
});

test("slotsFor hides today's slots that have started", () => {
  const morning = new Date(2026, 10, 10, 10, 30);
  assert.deepEqual(slotsFor("2026-11-10", morning), ["12 PM to 3 PM", "3 PM to 6 PM"]);
  assert.equal(slotsFor("2026-11-11", morning).length, 3);
  assert.deepEqual(slotsFor("2026-11-10", now), []);
});

test("dayLabel names today and tomorrow", () => {
  assert.match(dayLabel("2026-11-10", now), /^Today, Tue 10 Nov/);
  assert.match(dayLabel("2026-11-11", now), /^Tomorrow, /);
  assert.doesNotMatch(dayLabel("2026-11-12", now), /Today|Tomorrow/);
});

test("pickupNote puts the day and time first and keeps the scrap text tidy", () => {
  assert.equal(pickupNote("2026-11-12", "9 AM to 12 PM", "  old   newspapers\n2 coolers ", now), "Preferred: Thu 12 Nov, 9 AM to 12 PM. old newspapers 2 coolers");
  assert.equal(pickupNote("2026-11-11", "3 PM to 6 PM", "", now), "Preferred: Wed 11 Nov, 3 PM to 6 PM.");
  const head = "Preferred: Thu 12 Nov, 9 AM to 12 PM. ";
  assert.equal(pickupNote("2026-11-12", "9 AM to 12 PM", "x".repeat(500), now).length, head.length + 300);
});

test("pincode and mobile checks", () => {
  assert.ok(isJorhatPin("785001"));
  assert.ok(!isJorhatPin("781001"));
  assert.ok(isMobile("98640 12345"));
  assert.ok(!isMobile("12345 67890"));
});
