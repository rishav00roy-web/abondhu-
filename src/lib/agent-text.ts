// Plain-text versions of the site for search engines and AI agents: robots.txt, llms.txt and the
// Markdown homepage. Built from the same constants as the pages, so the facts stay in one place.
import { BUY, COMPANY, CONTACT_EMAIL, FAQS, HOURS, PHONE, SITE_URL, WHATSAPP_URL } from "./site-data.ts";

/** Public pages, for the sitemap and llms.txt. Logged-in pages (/account, /admin) are left out on purpose. */
export const PAGES: { path: string; title: string; about: string }[] = [
  { path: "/", title: "Home", about: "What Abondhu is, how a pickup works, what dealers buy, booking, FAQ" },
  { path: "/about", title: "About and contact", about: "Who runs Abondhu and how to reach us" },
  { path: "/vendor", title: "For scrap dealers", about: "How scrap dealers join Abondhu" },
  { path: "/partner", title: "Dealer sign-up", about: "Sign-up form for scrap dealers" },
  { path: "/privacy", title: "Privacy policy", about: "What we collect and how we keep it safe" },
  { path: "/terms", title: "Terms of use", about: "The rules for using Abondhu" },
];

const url = (path: string) => (path === "/" ? SITE_URL : SITE_URL + path);

/**
 * Crawl policy. Content-Signal (contentsignals.org) says how the content may be used:
 * search engines and AI answers may use it, model training may not.
 */
export function robotsTxt(): string {
  return [
    "User-agent: *",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /account",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");
}

const summary = `Abondhu is a free service that connects people across India with verified scrap dealers near them. The dealer comes to your door, weighs your scrap on a digital scale in front of you, buys it and pays you on the spot in cash or UPI. Abondhu does not buy scrap itself. Pickups are open in Jorhat, Assam now, with more cities opening as dealers join. Run by ${COMPANY}, Jorhat, Assam, India.`;

const contact = [
  `- WhatsApp: ${PHONE} (${WHATSAPP_URL})`,
  `- Email: ${CONTACT_EMAIL}`,
  `- Hours: ${HOURS}`,
];

/** llms.txt (llmstxt.org): a short summary of the site with links to its key pages. */
export function llmsTxt(): string {
  return [
    "# Abondhu",
    "",
    `> ${summary}`,
    "",
    "## Pages",
    "",
    ...PAGES.map((p) => `- [${p.title}](${url(p.path)}): ${p.about}`),
    `- [Homepage as Markdown](${SITE_URL}/index.md): the homepage text, including the full FAQ`,
    "",
    "## Contact",
    "",
    ...contact,
    "",
  ].join("\n");
}

/** The homepage as Markdown, served to agents that send `Accept: text/markdown`. */
export function homeMarkdown(): string {
  return [
    "# Abondhu: doorstep scrap pickup across India",
    "",
    summary,
    "",
    "## How it works",
    "",
    `1. Book a free pickup on ${SITE_URL} or on WhatsApp, with your area, pincode, a day and your mobile number.`,
    "2. A verified scrap dealer near you accepts it and comes at the time you chose.",
    "3. The dealer weighs each kind of scrap in front of you, tells you the rate, and pays you on the spot if you agree.",
    "",
    "## What dealers buy",
    "",
    "Sample starting rates in Jorhat. Rates move with the market and vary by city.",
    "",
    ...BUY.map((b) => `- ${b.name} (${b.examples}): from ₹${b.price} per ${b.unit === "kg" ? "kg" : "piece"}`),
    "",
    "## Book a pickup",
    "",
    `Book at ${SITE_URL}/#book (you log in with Google, email or phone to confirm), or send a WhatsApp message to ${PHONE}. Pickup hours: ${HOURS}.`,
    "",
    "## Compost kit",
    "",
    `The Abondhu compost kit (bucket with a tap, strainer and user guide) turns kitchen waste into fertiliser at home. Ask on WhatsApp (${PHONE}) for price and delivery.`,
    "",
    "## Questions",
    "",
    ...FAQS.flatMap((f) => [`### ${f.q}`, "", f.a, ""]),
    "## Contact",
    "",
    ...contact,
    `- More: ${SITE_URL}/about`,
    "",
  ].join("\n");
}
