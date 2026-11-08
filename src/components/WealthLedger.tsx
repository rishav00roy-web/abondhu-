import { Reveal, Stagger, StaggerItem } from "./motion";
import { Container } from "./ui";

/*
 * "Wealth from waste" made literal: one kilo of newspaper followed down a ledger,
 * line by line, to everyone it pays. Continues the receipt from the hero.
 */
const LINES = [
  { who: "You", gets: "₹14 in cash or UPI at your door", note: "Weighed on a calibrated scale while you watch." },
  { who: "Your local vendor", gets: "A fair cut on every kilo", note: "Routes booked for them, paid daily, no haggling at the gate." },
  { who: "A recycler in Assam", gets: "Clean, sorted raw material", note: "Paper goes back to a mill instead of a landfill." },
  { who: "The Brahmaputra", gets: "One less sack on its banks", note: "Nothing we collect is burnt, buried or dumped." },
];

export function WealthLedger() {
  return (
    <section id="wealth" className="scroll-mt-20 bg-white py-20 md:py-28">
      <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
        <Reveal className="grid content-start gap-5">
          <h2 className="font-serif text-4xl leading-[1.1] text-navy md:text-5xl">One kilo, four ways it pays</h2>
          <p className="max-w-[40ch] text-[17px] font-light leading-relaxed text-muted">
            Follow a single kilo of old newspaper from your store room. Waste turns into wealth at every stop.
          </p>
          <p className="font-mono text-sm text-faint tabular">1.00 kg of newspaper, Beltola, Guwahati</p>
        </Reveal>

        <Stagger as="ol" className="border-t border-navy/15" gap={0.09}>
          {LINES.map((l, i) => (
            <StaggerItem as="li" key={l.who} className="grid gap-1.5 border-b border-dashed border-navy/15 py-6 sm:grid-cols-[2.5rem_1fr] sm:gap-x-4">
              <span className="font-mono text-sm text-[#8a6d14] tabular sm:pt-1.5">0{i + 1}</span>
              <div className="grid gap-1.5">
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-serif text-2xl text-navy">{l.who}</span>
                  <span aria-hidden className="hidden h-px min-w-6 flex-1 translate-y-[-0.3em] border-b border-dotted border-navy/30 sm:block" />
                  <span className="text-[15px] font-semibold text-forest">{l.gets}</span>
                </p>
                <p className="text-[15px] font-light leading-relaxed text-muted">{l.note}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
