// Run with `npm test` (Node's built-in test runner reads TypeScript directly).
import assert from "node:assert/strict";
import { test } from "node:test";
import { homeMarkdown, llmsTxt, PAGES, robotsTxt } from "./agent-text.ts";
import { CONTACT_EMAIL, FAQS } from "./site-data.ts";

test("robots.txt states the content policy, points at the sitemap and keeps private pages out", () => {
  const r = robotsTxt();
  assert.match(r, /^Content-Signal: search=yes, ai-input=yes, ai-train=no$/m);
  assert.match(r, /^Sitemap: https:\/\/abondhu\.com\/sitemap\.xml$/m);
  for (const p of ["/admin", "/account", "/api/"]) assert.ok(r.includes(`Disallow: ${p}`));
});

test("llms.txt links every public page and the contact email", () => {
  const l = llmsTxt();
  assert.ok(l.startsWith("# Abondhu\n"));
  for (const p of PAGES) assert.ok(l.includes(`(https://abondhu.com${p.path === "/" ? "" : p.path})`), p.path);
  assert.ok(l.includes(CONTACT_EMAIL));
});

test("Markdown homepage carries every FAQ answer", () => {
  const m = homeMarkdown();
  for (const f of FAQS) assert.ok(m.includes(f.a), f.q);
  assert.ok(!PAGES.some((p) => p.path === "/admin" || p.path === "/account"));
});
