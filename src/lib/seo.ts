/** One place for the site address and the business facts that search engines read. */
export const SITE_URL = "https://abondhu.com";

/**
 * Business details for Google (schema.org JSON-LD), shown on the home page.
 * Keep these the same as the footer and the Google Business Profile, word for word.
 * No street address yet: Abondhu comes to the customer, so it is listed as serving Jorhat.
 */
export const LOCAL_BUSINESS_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "RecyclingCenter",
  "@id": `${SITE_URL}/#business`,
  name: "Abondhu",
  description: "Doorstep scrap pickup in Jorhat. Weighed on a digital scale in front of you, paid on the spot, and sent to licensed recyclers.",
  url: SITE_URL,
  logo: `${SITE_URL}/abondhu-mark.png`,
  image: `${SITE_URL}/opengraph-image.jpg`,
  telephone: "+91-9181330755",
  email: "abondhu.lios@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Jorhat", addressRegion: "Assam", addressCountry: "IN" },
  areaServed: { "@type": "City", name: "Jorhat" },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "08:00",
    closes: "20:00",
  },
  parentOrganization: { "@type": "Organization", name: "Lios Lab Private Limited", address: { "@type": "PostalAddress", addressLocality: "Jorhat", addressRegion: "Assam", addressCountry: "IN" } },
}).replace(/</g, "\\u003c");
