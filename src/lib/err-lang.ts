// An error is kept as text in the language it was made in. This finds the same
// line in the other language, so switching English/Assamese also switches the error.
import { homeStrings } from "./vendor-home-i18n.ts";
import { strings, type Lang } from "./vendor-i18n.ts";

type Pair = Record<Lang, string>;
const pairs = new Map<string, Pair>();

function add(en: unknown, as: unknown) {
  if (typeof en === "string" && typeof as === "string") {
    const p = { en, as };
    pairs.set(en, p);
    pairs.set(as, p);
  } else if (en && as && typeof en === "object" && typeof as === "object") {
    for (const k of Object.keys(en)) add((en as Record<string, unknown>)[k], (as as Record<string, unknown>)[k]);
  }
}
add(strings("en"), strings("as"));
add(homeStrings("en"), homeStrings("as"));

/** The message in `lang` if it is one of our vendor lines; anything else (e.g. a server message) as is. */
export const inLang = (msg: string, lang: Lang): string => pairs.get(msg)?.[lang] ?? msg;
