import { delay } from "@/lib/utils";

/*
 * Signature moment: the headline crosses out "waste" and the word "wealth" settles in
 * below it, like a correction in a ledger. The full sentence is real text from the
 * first frame, so it reads the same with motion off.
 * Plain CSS animations (globals.css), so this plays from the first paint without waiting for JavaScript.
 */
export function WasteToWealth() {
  const letters = Array.from("wealth");
  return (
    <h1 className="font-serif text-[clamp(52px,7vw,92px)] leading-[1.02] tracking-[-0.01em] text-navy">
      From{" "}
      <span className="relative inline-block text-navy/60">
        waste
        <span
          aria-hidden
          className="hero-strike absolute left-[-3%] right-[-3%] top-[56%] h-[0.07em] origin-left rounded-full bg-gold"
          style={delay(0.9)}
        />
      </span>
      <br />
      to{" "}
      <span className="inline-block whitespace-nowrap italic text-forest">
        {letters.map((ch, i) => (
          <span key={i} className="hero-letter inline-block" style={delay(1.35 + i * 0.045)}>
            {ch}
          </span>
        ))}
      </span>
      <br />
      again.
    </h1>
  );
}
