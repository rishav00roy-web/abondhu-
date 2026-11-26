// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { dayLabel, estimatePrice, isJorhatPin, isMobile, parseKg, pickupDays, pickupNote, photoName, photoWhich, readItems, sortPhotos, slotsFor, totalKg, itemsLine } from "./booking.ts";

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
  assert.equal(pickupNote("2026-11-12", "9 AM to 12 PM", "x".repeat(500), now).length, head.length + 440);
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

test("each item row needs a kind, a name for Other, and a weight", () => {
  const ok = readItems([
    { scrap: "Newspaper and books", other: "", kg: "1" },
    { scrap: "Other", other: "  old   cooler ", kg: "2,5" },
  ]);
  assert.ok("items" in ok);
  assert.deepEqual(ok.items, [
    { scrap: "Newspaper and books", name: "Newspaper and books", kg: 1 },
    { scrap: "Other", name: "old cooler", kg: 2.5 },
  ]);
  assert.equal(itemsLine(ok.items), "Newspaper and books, about 1 kg; old cooler, about 2.5 kg");
  assert.equal(totalKg(ok.items), 3.5);
  assert.equal(totalKg([{ scrap: "x", name: "x", kg: 0.1 }, { scrap: "x", name: "x", kg: 0.2 }]), 0.3);
  assert.deepEqual(readItems([{ scrap: "", other: "", kg: "1" }]), { error: "Please choose what scrap it is." });
  assert.deepEqual(readItems([{ scrap: "Plastic", other: "", kg: "1" }, { scrap: "Plastic", other: "", kg: "" }]), { error: "Item 2: write the estimated weight in kg, like 15." });
  assert.deepEqual(readItems([{ scrap: "Other", other: " a ", kg: "1" }]), { error: "Please write what the scrap is." });
  assert.ok("error" in readItems([]));
});

test("the note fits six long items under the 500-character limit", () => {
  const long = { scrap: "Old appliances (fridge, AC, cooler, washing machine)", other: "", kg: "1999.99" };
  const r = readItems(Array(6).fill(long));
  assert.ok("items" in r);
  assert.ok(pickupNote("2026-11-12", "12 PM to 3 PM", itemsLine(r.items), now).length <= 500);
});

test("scrap photos are named per item and listed item by item, the photo of everything last", () => {
  assert.equal(photoName(2, 1700000000000, "jpg"), "scrap-2-1700000000000.jpg");
  assert.equal(photoWhich("p1/scrap-2-1700000000000.jpg"), 2);
  assert.equal(photoWhich("p1/scrap-all-1700000000000.webp"), "all");
  assert.equal(photoWhich("p1/scrap-1700000000000.jpg"), null); // older single photo
  assert.deepEqual(sortPhotos(["p/scrap-all-1.jpg", "p/scrap-3-1.jpg", "p/scrap-1-1.jpg"]), ["p/scrap-1-1.jpg", "p/scrap-3-1.jpg", "p/scrap-all-1.jpg"]);
});
