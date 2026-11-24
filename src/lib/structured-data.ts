import { BUY, COMPANY, CONTACT_EMAIL, HOURS, PHONE_E164, SITE_URL, WHATSAPP_URL } from "./site-data";

/**
 * Who Abondhu is, as schema.org data for search engines and AI agents.
 * Built from the same constants as the page, so the facts never drift apart.
 * sameAs lists only profiles that really exist: add Instagram or Facebook here once they do.
 */
const org = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#org`,
  name: "Abondhu",
  legalName: COMPANY,
  url: SITE_URL,
  logo: `${SITE_URL}/abondhu-mark.png`,
  description:
    "Abondhu is a free service that connects people across India with verified scrap dealers near them. The dealer weighs the scrap in front of you, buys it and pays you on the spot. Abondhu does not buy scrap itself.",
  email: CONTACT_EMAIL,
  telephone: PHONE_E164,
  foundingDate: "2026",
  address: { "@type": "PostalAddress", addressLocality: "Jorhat", addressRegion: "Assam", addressCountry: "IN" },
  areaServed: { "@type": "Country", name: "India" },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: PHONE_E164,
    email: CONTACT_EMAIL,
    areaServed: "IN",
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00",
    },
  },
  sameAs: [WHATSAPP_URL],
};

const website = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Abondhu",
  inLanguage: "en-IN",
  publisher: { "@id": `${SITE_URL}/#org` },
};

const service = {
  "@type": "Service",
  "@id": `${SITE_URL}/#pickup`,
  name: "Doorstep scrap pickup",
  serviceType: "Scrap collection and recycling",
  description: `Book a free doorstep pickup and a verified scrap dealer near you comes to weigh and buy your scrap. Hours: ${HOURS}. Open in Jorhat, Assam now, with more cities opening as dealers join.`,
  provider: { "@id": `${SITE_URL}/#org` },
  areaServed: { "@type": "Country", name: "India" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Pickup is free." },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Scrap that dealers buy",
    itemListElement: BUY.map((b) => ({ "@type": "Offer", itemOffered: { "@type": "Thing", name: b.name, description: b.examples } })),
  },
  potentialAction: { "@type": "ReserveAction", target: `${SITE_URL}/#book`, name: "Book a pickup" },
};

/** One JSON-LD block for the homepage. `<` is escaped so the text can never close the script tag. */
export const SITE_JSON_LD = JSON.stringify({ "@context": "https://schema.org", "@graph": [org, website, service] }).replace(/</g, "\\u003c");
