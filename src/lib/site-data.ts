export type Unit = "kg" | "pc";

/** What we buy, with sample starting rates for Jorhat. */
export const BUY: { id: string; name: string; price: number; unit: Unit; examples: string }[] = [
  { id: "paper", name: "Newspaper and books", price: 12, unit: "kg", examples: "Papers, copies, magazines" },
  { id: "cardboard", name: "Cardboard", price: 10, unit: "kg", examples: "Cartons and boxes" },
  { id: "metal", name: "Iron, steel and cans", price: 28, unit: "kg", examples: "Utensils, rods, tins" },
  { id: "plastic", name: "Plastic bottles", price: 12, unit: "kg", examples: "PET and hard plastic" },
  { id: "ewaste", name: "Phones and laptops", price: 250, unit: "pc", examples: "Working or not" },
  { id: "appliance", name: "Fridges, ACs, washers", price: 900, unit: "pc", examples: "Any condition" },
];

/** Jorhat only for now. Localities the vans cover every day (mock list). */
export const LOCALITIES = [
  "Gar-Ali",
  "AT Road",
  "Tarajan",
  "Cinnamara",
  "Rowriah",
  "Na-Ali",
  "Bongal Pukhuri",
  "Kenduguri",
  "Lichubari",
  "Malow Ali",
];
/** Jorhat pincodes start with 785. */
export const PIN_RE = /^785\d{3}$/;

/** Opening hours, shown in the FAQ, the booking form and the footer. Change them here only. */
export const PICKUP_HOURS = "[pickup hours to confirm]";
export const WORKING_HOURS = "[working hours to confirm]";

/**
 * Customer questions, shown in the FAQ section and sent to Google as FAQPage data.
 * Text in [square brackets] is a fact still to be confirmed by the team: replace it before going live.
 */
export const FAQS: { q: string; a: string }[] = [
  {
    q: "What scrap do you buy?",
    a: "Newspaper, books and copies, cardboard, iron, steel and cans, plastic bottles and hard plastic, old phones and laptops (working or not), and big appliances such as fridges, ACs and washing machines. If you are not sure about something, send us a photo on WhatsApp.",
  },
  {
    q: "How do I book a pickup, and is it free?",
    a: "Book on this site or send us a WhatsApp message on +91 91813 30755 with your address and what you have. Pickup is free, and there is no charge for coming to your door.",
  },
  {
    q: "How is the price decided?",
    a: "Each kind of scrap has a rate per kilo, or per piece for appliances and electronics. Rates move with the market, so our partner tells you the rate before weighing, and you only sell if you agree.",
  },
  {
    q: "How do I know the weight is right?",
    a: "Every partner carries a digital scale with a display you can read yourself. Each kind of scrap is weighed separately in front of you, and every reading goes on your receipt.",
  },
  {
    q: "How and when do I get paid?",
    a: "On the spot, before our partner leaves, in cash or by UPI, whichever you prefer.",
  },
  {
    q: "Is there a minimum quantity?",
    a: "No, there is no minimum for now. Book a pickup for whatever you have, big or small.",
  },
  {
    q: "Which areas do you cover, and when?",
    a: `Jorhat town only for now, including Gar-Ali, AT Road, Tarajan, Cinnamara, Rowriah, Na-Ali and nearby areas. Pickups run every day, ${PICKUP_HOURS}, usually the same or next day. You can reach us on WhatsApp ${WORKING_HOURS}.`,
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
    a: "Paper goes to paper mills, metal to foundries, plastic to recycling units and electronics to authorised e-waste recyclers. Nothing is burnt, buried or dumped.",
  },
  {
    q: "Do you collect from shops, offices and tea estates?",
    a: "Yes. We collect cartons, gunny bags, machinery scrap, drums and old electricals on a regular schedule, with a weight report for every visit. WhatsApp us to set it up.",
  },
  {
    q: "Who runs Abondhu?",
    a: "Abondhu is run by Lios Lab Private Limited, a company registered in Jorhat. You can reach us on WhatsApp at +91 91813 30755 or by email at abondhu.lios@gmail.com.",
  },
];
