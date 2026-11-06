export type CategoryKey = "paper" | "metal" | "plastic" | "ewaste";
export type Unit = "kg" | "pc";

export const CATEGORIES: Record<CategoryKey, { name: string; color: string }> = {
  paper: { name: "Paper", color: "var(--cat-paper)" },
  metal: { name: "Metal", color: "var(--cat-metal)" },
  plastic: { name: "Plastic", color: "var(--cat-plastic)" },
  ewaste: { name: "Appliances", color: "var(--cat-ewaste)" },
};

export interface Rate {
  id: string;
  name: string;
  category: CategoryKey;
  price: number;
  unit: Unit;
}

/** Sample rates for the mock. */
export const RATES: Rate[] = [
  { id: "newspaper", name: "Newspaper", category: "paper", price: 14, unit: "kg" },
  { id: "cardboard", name: "Cardboard", category: "paper", price: 10, unit: "kg" },
  { id: "books", name: "Books and copies", category: "paper", price: 12, unit: "kg" },
  { id: "iron", name: "Iron", category: "metal", price: 28, unit: "kg" },
  { id: "steel", name: "Steel utensils", category: "metal", price: 40, unit: "kg" },
  { id: "aluminium", name: "Aluminium", category: "metal", price: 105, unit: "kg" },
  { id: "brass", name: "Brass", category: "metal", price: 300, unit: "kg" },
  { id: "copper", name: "Copper", category: "metal", price: 410, unit: "kg" },
  { id: "pet", name: "PET bottles", category: "plastic", price: 15, unit: "kg" },
  { id: "hard-plastic", name: "Hard plastic", category: "plastic", price: 12, unit: "kg" },
  { id: "ac", name: "Split AC", category: "ewaste", price: 3800, unit: "pc" },
  { id: "fridge", name: "Refrigerator", category: "ewaste", price: 1200, unit: "pc" },
  { id: "washer", name: "Washing machine", category: "ewaste", price: 900, unit: "pc" },
  { id: "laptop", name: "Laptop", category: "ewaste", price: 250, unit: "pc" },
];

export const SAMPLE_ESTIMATE: Record<string, number> = { newspaper: 8, cardboard: 5, aluminium: 1, pet: 2 };

/** Assam only. Guwahati daily; other towns on set days (mock schedule). */
export const AREAS = [
  { city: "Guwahati", days: "Every day" },
  { city: "Dibrugarh", days: "Tue, Fri" },
  { city: "Jorhat", days: "Wed, Sat" },
  { city: "Tezpur", days: "Mon, Thu" },
  { city: "Silchar", days: "Tue, Sat" },
  { city: "Nagaon", days: "Wed, Sun" },
];
export const CITIES = AREAS.map((a) => a.city);

export const RECEIPT = [
  { name: "Newspaper", category: "paper" as CategoryKey, kg: 8.4, rate: 14 },
  { name: "Cardboard", category: "paper" as CategoryKey, kg: 5.2, rate: 10 },
  { name: "Aluminium cans", category: "metal" as CategoryKey, kg: 1.1, rate: 105 },
  { name: "PET bottles", category: "plastic" as CategoryKey, kg: 2.3, rate: 15 },
];

export const FAQS = [
  {
    q: "Which parts of Assam do you cover?",
    a: "Guwahati every day, including Dispur, Beltola, Six Mile and North Guwahati. Dibrugarh, Jorhat, Tezpur, Silchar and Nagaon on set days each week. We don't pick up outside Assam.",
  },
  {
    q: "Is there a minimum quantity?",
    a: "In Guwahati we ask for about 15 kg on weekdays and nothing on weekends. In other towns we ask for 25 kg, since the van comes on fixed days.",
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
    q: "Do you work with tea estates?",
    a: "Yes. We collect gunny bags, machinery scrap, drums and old electricals from estates and factories on a schedule, with a weight report and GST invoice.",
  },
];
