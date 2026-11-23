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

/** Bookings are open in Jorhat only for now. Localities covered every day (mock list). */
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

export const FAQS = [
  {
    q: "Does Abondhu buy my scrap?",
    a: "No. Abondhu is a free service that connects you with a verified scrap dealer near you. The dealer weighs your scrap in front of you, buys it and pays you directly.",
  },
  {
    q: "Where does my scrap actually go?",
    a: "Dealers send paper to a paper mill, metal to a foundry, plastic to a pelletising unit and appliances to an authorised e-waste recycler. Nothing is burnt, buried or dumped.",
  },
  {
    q: "Which areas do you cover?",
    a: "Abondhu is for all of India, and opens city by city as dealers join. Pickups are open in Jorhat now, every day: Gar-Ali, AT Road, Tarajan, Cinnamara, Rowriah, Na-Ali and the areas around them. Elsewhere? WhatsApp us and we will tell you when your area opens.",
  },
  {
    q: "Is there a minimum quantity?",
    a: "We ask for about 15 kg on weekdays and nothing on weekends. A heavy item such as a fridge or AC counts on its own.",
  },
  {
    q: "How do I know the weight is right?",
    a: "Every dealer carries a calibrated digital scale. Each kind of scrap is weighed separately in front of you, and every reading goes on your receipt.",
  },
  {
    q: "What don't you take?",
    a: "Glass, wet waste, medical waste, and anything hazardous such as paint, leaking batteries or gas cylinders.",
  },
  {
    q: "Do you work with shops and tea estates?",
    a: "Yes. We can match you with a dealer who collects cartons, gunny bags, machinery scrap, drums and old electricals from shops, offices and tea estates on a fixed schedule, with a weight report.",
  },
];
