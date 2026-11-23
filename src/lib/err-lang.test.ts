import assert from "node:assert/strict";
import { test } from "node:test";
import { inLang } from "./err-lang.ts";
import { strings } from "./vendor-i18n.ts";
import { homeStrings } from "./vendor-home-i18n.ts";

test("an error follows the language switch", () => {
  assert.equal(inLang(strings("en").errAadhaarEmpty, "as"), strings("as").errAadhaarEmpty);
  assert.equal(inLang(strings("as").errName, "en"), strings("en").errName);
  assert.equal(inLang(homeStrings("en").staff.errTaken, "as"), homeStrings("as").staff.errTaken);
});

test("unknown messages and empty stay as they are", () => {
  assert.equal(inLang("Server said no", "as"), "Server said no");
  assert.equal(inLang("", "as"), "");
});
