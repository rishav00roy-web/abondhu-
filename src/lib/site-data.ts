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

export const FAQS = [
  {
    q: "Where does my scrap actually go?",
    a: "Paper goes to a paper mill, metal to a foundry, plastic to a pelletising unit and appliances to an authorised e-waste recycler. Every partner is licensed, and nothing is burnt, buried or dumped.",
  },
  {
    q: "Which areas do you cover?",
    a: "Jorhat town only for now, every day: Gar-Ali, AT Road, Tarajan, Cinnamara, Rowriah, Na-Ali and the areas around them. If your pincode starts with 785 and you are in town, we come to you.",
  },
  {
    q: "Is there a minimum quantity?",
    a: "We ask for about 15 kg on weekdays and nothing on weekends. A heavy item such as a fridge or AC counts on its own.",
  },
  {
    q: "How do I know the weight is right?",
    a: "Every partner carries a calibrated digital scale. Each kind of scrap is weighed separately in front of you, and every reading goes on your receipt.",
  },
  {
    q: "What don't you take?",
    a: "Glass, wet waste, medical waste, and anything hazardous such as paint, leaking batteries or gas cylinders.",
  },
  {
    q: "Do you work with shops and tea estates?",
    a: "Yes. We collect cartons, gunny bags, machinery scrap, drums and old electricals from shops, offices and estates around Jorhat on a fixed schedule, with a weight report and GST invoice.",
  },
];
