export type Unit = "kg" | "pc";

/** What dealers buy, with sample starting rates (Jorhat for now). */
export const BUY: { id: string; name: string; price: number; unit: Unit; examples: string }[] = [
  { id: "paper", name: "Newspaper and books", price: 12, unit: "kg", examples: "Papers, copies, magazines" },
  { id: "cardboard", name: "Cardboard", price: 10, unit: "kg", examples: "Cartons and boxes" },
  { id: "metal", name: "Iron, steel and cans", price: 28, unit: "kg", examples: "Utensils, rods, tins" },
  { id: "plastic", name: "Plastic bottles", price: 12, unit: "kg", examples: "PET and hard plastic" },
  { id: "ewaste", name: "Phones and laptops", price: 250, unit: "pc", examples: "Working or not" },
  { id: "appliance", name: "Fridges, ACs, washers", price: 900, unit: "pc", examples: "Any condition" },
];

/**
 * Bookings are open in Jorhat only for now. Each locality with the pincodes its addresses use
 * (India Post offices plus local addresses). Picking an area turns the pincode box into a list of these.
 * Every pincode here must also be active in the `pincodes` table, or booking refuses it.
 */
export const AREA_PINS: Record<string, readonly string[]> = {
  "Gar-Ali": ["785001"],
  "AT Road": ["785001"],
  Tarajan: ["785001", "785006"],
  Cinnamara: ["785008"],
  Rowriah: ["785005"],
  "Na-Ali": ["785001", "785008"],
  "Bongal Pukhuri": ["785001"],
  Kenduguri: ["785001", "785010"],
  Lichubari: ["785008"],
  "Malow Ali": ["785001"],
};
export const LOCALITIES = Object.keys(AREA_PINS);
/** Last choice in the area list: the pincode is typed instead of picked. */
export const OTHER_AREA = "Elsewhere in Jorhat";

/** Pincode after the area changes: kept if the new area uses it, else the area's first. Typed areas keep it. */
export const pinForArea = (area: string, pin: string) => {
  const pins = AREA_PINS[area];
  return !pins || pins.includes(pin) ? pin : pins[0];
};

/** The area a saved address line names. Booking adds it at the end (", Malow Ali"), so the last one named wins. */
export function areaInLine(line: string): string | undefined {
  const text = line.toLowerCase();
  let best: { area: string; at: number } | undefined;
  for (const area of LOCALITIES) {
    const at = text.lastIndexOf(area.toLowerCase());
    if (at >= 0 && (!best || at > best.at)) best = { area, at };
  }
  return best?.area;
}

/** A saved area and pincode (older bookings may not match): the pincode is kept, moving to "Elsewhere" if needed. */
export function matchAreaPin(area: string, pin: string): { area: string; pin: string } {
  const pins = AREA_PINS[area];
  if (!pins) return { area, pin };
  if (!pin) return { area, pin: pins[0] };
  return pins.includes(pin) ? { area, pin } : { area: OTHER_AREA, pin };
}
/** Jorhat pincodes start with 785. */
export const PIN_RE = /^785\d{3}$/;

/** The live site address, used in emails and links. */
export const SITE_URL = "https://abondhu.com";

/** Who runs Abondhu and how to reach them. Used on the site, in structured data and in the agent files. */
export const COMPANY = "Lios Lab Private Limited";
export const CONTACT_EMAIL = "support@abondhu.com";
export const PHONE = "+91 91813 30755";
export const PHONE_E164 = "+919181330755";
export const WHATSAPP_URL = "https://wa.me/919181330755";

/** Pickup and working hours, shown in the FAQ, the booking section and the footer. Change them here only. */
export const HOURS = "Monday to Saturday, 9 AM to 6 PM";

/** Customer questions, shown in the FAQ section and sent to Google as FAQPage data. */
export const FAQS: { q: string; a: string }[] = [
  {
    q: "Does Abondhu buy my scrap?",
    a: "No. Abondhu is a free service that connects you with a verified scrap dealer near you. The dealer weighs your scrap in front of you, buys it and pays you directly.",
  },
  {
    q: "What scrap do dealers buy?",
    a: "Newspaper, books and copies, cardboard, iron, steel and cans, plastic bottles and hard plastic, old phones and laptops (working or not), and big appliances such as fridges, ACs and washing machines. If you are not sure about something, send us a photo on WhatsApp.",
  },
  {
    q: "How do I book a pickup, and is it free?",
    a: "Book on this site or send us a WhatsApp message on +91 91813 30755 with your address and what you have. Pickup is free, and there is no charge for coming to your door.",
  },
  {
    q: "How is the price decided?",
    a: "Each kind of scrap has a rate per kilo, or per piece for appliances and electronics. Rates move with the market and vary by city, so the dealer tells you the rate before weighing, and you only sell if you agree.",
  },
  {
    q: "How do I know the weight is right?",
    a: "Every dealer carries a digital scale with a display you can read yourself. Each kind of scrap is weighed separately in front of you, and every reading goes on your receipt.",
  },
  {
    q: "How and when do I get paid?",
    a: "On the spot, by the dealer, before they leave, in cash or by UPI, whichever you prefer.",
  },
  {
    q: "Is there a minimum quantity?",
    a: "No, there is no minimum for now. Book a pickup for whatever you have, big or small.",
  },
  {
    q: "Which areas do you cover, and when?",
    a: `Abondhu is for all of India, and opens city by city as dealers join. Pickups are open in Jorhat now, including Gar-Ali, AT Road, Tarajan, Cinnamara, Rowriah, Na-Ali and nearby areas, ${HOURS}, usually the same or next day. Elsewhere? WhatsApp us and we will tell you when your area opens.`,
  },
  {
    q: "Can I change or cancel my pickup?",
    a: "Yes. Send us a WhatsApp message on +91 91813 30755 and we will move it to another time or cancel it.",
  },
  {
    q: "What don't you take?",
    a: "Glass, wet or food waste, medical waste, and anything hazardous such as paint, leaking batteries or gas cylinders.",
  },
  {
    q: "Where does my scrap go?",
    a: "Dealers send paper to paper mills, metal to foundries, plastic to recycling units and electronics to authorised e-waste recyclers. Nothing is burnt, buried or dumped.",
  },
  {
    q: "Do you work with shops, offices and tea estates?",
    a: "Yes. We can match you with a dealer who collects cartons, gunny bags, machinery scrap, drums and old electricals on a regular schedule, with a weight report for every visit. WhatsApp us to set it up.",
  },
  {
    q: "Who runs Abondhu?",
    a: "Abondhu is run by Lios Lab Private Limited, a company registered in Jorhat. You can reach us on WhatsApp at +91 91813 30755 or by email at support@abondhu.com.",
  },
];

/**
 * Google sign-in client ID (public, not a secret: Google shows it in every sign-in link).
 * Same "Web client 1" that Supabase's Google provider uses, in Google Cloud project "seo-tools".
 */
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "417401986327-s0i1ihi3k14lirdft6uuanipihrne27j.apps.googleusercontent.com";
