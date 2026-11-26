// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayLabel, estimatePrice, isJorhatPin, isMobile, parseKg, pickupDays, pickupNote, scrapLine, slotsFor } from "./booking.ts";

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

test("dealer alert has no address and links to the dealer home; WhatsApp link is ready to send", async () => {
  const { alertText, placeLabel, whatsappLink } = await import("./dealer-alert.ts");
  const text = alertText({ place: placeLabel("785001", "Gar-Ali"), note: "Preferred: Tue 24 Nov, 9 AM to 12 PM. Plastic", code: "AB-1", siteUrl: "https://abondhu.com" });
  assert.match(text, /^New pickup near you: Gar-Ali, 785001\.\nPreferred: Tue 24 Nov/);
  assert.match(text, /https:\/\/abondhu\.com\/partner/);
  assert.doesNotMatch(alertText({ place: "785001", note: null, code: "AB-1", siteUrl: "x" }), /\n\n\n/);
  assert.equal(whatsappLink("+91 98640 12345", "Hi there"), "https://wa.me/919864012345?text=Hi%20there");
});

test("estimated weight: only sensible kilos count, and the estimate is weight times rate", () => {
  assert.equal(parseKg("20"), 20);
  assert.equal(parseKg(" 2.5 "), 2.5);
  assert.equal(parseKg("2,5"), 2.5);
  for (const bad of ["", "0", "-3", "abc", "1e3", "2001", "12.345"]) assert.equal(parseKg(bad), null, bad);
  assert.equal(estimatePrice(20, 12), 240);
  assert.equal(estimatePrice(2.5, 28), 70);
  assert.equal(estimatePrice(0.3, 10), 3);
});

test("scrapLine adds the estimated weight after the scrap", () => {
  assert.equal(scrapLine("Plastic", 20), "Plastic. About 20 kg");
  assert.equal(scrapLine("", 4.5), "About 4.5 kg");
  assert.equal(scrapLine("Plastic", null), "Plastic");
  assert.equal(pickupNote("2026-11-12", "9 AM to 12 PM", scrapLine("Plastic", 20), now), "Preferred: Thu 12 Nov, 9 AM to 12 PM. Plastic. About 20 kg");
});
