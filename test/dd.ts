/**
 * Fuzzy profanity filter.
 *
 * Handles common obfuscation: leetspeak substitutions (a->4/@, i->1/!, etc.),
 * inserted separators (f*ck, f.u.c.k, f uck), and repeated letters (fuuuck).
 *
 * IMPORTANT LIMITATIONS (read before relying on this alone):
 * - This WILL false-positive on legitimate words that contain a bad word as a
 *   substring (the "Scunthorpe problem") e.g. "Scunthorpe", "assassin", "class",
 *   "cockpit", "bassist". The word-boundary lookaround below reduces this but
 *   does not eliminate it, since obfuscation-tolerance and strict boundaries
 *   are somewhat in tension. Test against your real post content and tune the
 *   BASE_WORDS list / boundary logic accordingly.
 * - No regex catches 100% of evasions indefinitely — this is an arms race.
 *   New evasions (homoglyphs, zero-width characters, creative phonetic spelling)
 *   will still get through. Treat this as a first-pass filter, not a guarantee.
 */

// Letter characters that commonly substitute for it (case-insensitive, so only lowercase needed)
const SUBSTITUTIONS: Record<string, string> = {
  a: "a4@",
  b: "b8",
  c: "c",
  d: "d",
  e: "e3",
  f: "f",
  g: "g9",
  h: "h",
  i: "i1!|l",
  j: "j",
  k: "k",
  l: "l1",
  m: "m",
  n: "n",
  o: "o0",
  p: "p",
  q: "q",
  r: "r",
  s: "s5$z",
  t: "t7+",
  u: "uv",
  v: "v",
  w: "w",
  x: "x",
  y: "y",
  z: "z",
};

// Extend this list with whatever your moderation policy needs to cover.
const BASE_WORDS = [
  "fuck",
  "shit",
  "bitch",
  "ass",
  "asshole",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "whore",
  "slut",
  "bastard",
  "twat",
  "wanker",
  "douche",
  "prick",
  "motherfucker"
];

function escapeForCharClass(chars: string): string {
  // Escape regex-special characters that might appear inside a character class
  return chars.replace(/[\]\\^-]/g, "\\$&");
}

function letterPattern(letter: string): string {
  const subs = SUBSTITUTIONS[letter] ?? letter;
  const escaped = escapeForCharClass(subs);
  // "+" allows the letter (or its substitutes) to repeat, e.g. "fuuuck"
  return `[${escaped}]+`;
}

function buildWordPattern(word: string): string {
  // "[\W_]*" between letters allows 0+ separators: spaces, punctuation, asterisks, underscores
  return word
    .toLowerCase()
    .split("")
    .map(letterPattern)
    .join("[\\W_]*");
}

function buildProfanityRegex(words: string[] = BASE_WORDS): RegExp {
  const alternation = words.map(buildWordPattern).join("|");
  // Lookaround boundaries: not preceded/followed by a plain letter, to reduce
  // (not eliminate) false positives on legitimate longer words.
  const pattern = `(?<![a-zA-Z])(?:${alternation})(?![a-zA-Z])`;
  return new RegExp(pattern, "gi");
}

export const PROFANITY_REGEX = buildProfanityRegex();

export function findProfanity(text: string): string[] {
  const matches = text.match(PROFANITY_REGEX) ?? [];
  return matches.map((m) => m.toLowerCase());
}

export function containsProfanity(text: string): boolean {
  // reset lastIndex since PROFANITY_REGEX has the global flag and is reused across calls
  PROFANITY_REGEX.lastIndex = 0;
  return PROFANITY_REGEX.test(text);
}

/* ----------------------------- quick manual test -----------------------------*/
console.log(findProfanity("this is fuck, f*ck, f uck, f.u.c.k, fuuuck, phuck, asshole, motherfucker"));
console.log(findProfanity("assassin, class, Scunthorpe, cockpit, fucker"));  // watch these — likely false positives