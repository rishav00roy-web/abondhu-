/*
 * Seven-segment LED digits drawn as SVG, like the readout on a shop-counter digital scale.
 * No font is involved, so the digits never fall back or shift. The SVG is decorative:
 * the caller puts the real value in text (aria-label or a visible label).
 */
const W = 40; // digit width
const H = 72; // digit height
const CELL = 50; // digit + decimal point slot
const T = 6.5; // segment thickness

type P = [number, number][];
const h = (x0: number, x1: number, y: number): P => [
  [x0, y], [x0 + T / 2, y - T / 2], [x1 - T / 2, y - T / 2], [x1, y], [x1 - T / 2, y + T / 2], [x0 + T / 2, y + T / 2],
];
const v = (x: number, y0: number, y1: number): P => [
  [x, y0], [x + T / 2, y0 + T / 2], [x + T / 2, y1 - T / 2], [x, y1], [x - T / 2, y1 - T / 2], [x - T / 2, y0 + T / 2],
];

// a b c d e f g
const SEG: P[] = [
  h(6, 34, 4),
  v(36, 6, 34),
  v(36, 38, 66),
  h(6, 34, 68),
  v(4, 38, 66),
  v(4, 6, 34),
  h(6, 34, 36),
];

const MAP: Record<string, string> = {
  "0": "abcdef", "1": "bc", "2": "abdeg", "3": "abcdg", "4": "bcfg", "5": "acdfg",
  "6": "acdefg", "7": "abc", "8": "abcdefg", "9": "abcdfg", "-": "g", " ": "", E: "adefg", r: "eg",
};

const pts = (p: P, dx: number) => p.map(([x, y]) => `${x + dx},${y}`).join(" ");

/** Renders `text` (digits, spaces, "-" and at most one "." per digit) right-aligned in `cells` digits. */
export function Segments({ text, cells, className }: { text: string; cells: number; className?: string }) {
  // pair every character with "is a decimal point lit after it"
  const glyphs: { ch: string; dp: boolean }[] = [];
  for (const ch of text) {
    if (ch === "." && glyphs.length) glyphs[glyphs.length - 1].dp = true;
    else glyphs.push({ ch, dp: false });
  }
  while (glyphs.length < cells) glyphs.unshift({ ch: " ", dp: false });

  return (
    <svg viewBox={`-4 -2 ${cells * CELL + 4} ${H + 4}`} className={className} aria-hidden focusable="false">
      <g transform="skewX(-6) translate(8 0)">
        {glyphs.slice(-cells).map(({ ch, dp }, i) => {
          const on = MAP[ch] ?? "";
          const dx = i * CELL;
          return (
            <g key={i}>
              {SEG.map((p, s) => (
                <polygon key={s} points={pts(p, dx)} className={on.includes("abcdefg"[s]) ? "led-on" : "led-off"} />
              ))}
              <circle cx={dx + W + 5} cy={H - 4} r={4} className={dp ? "led-on" : "led-off"} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
