/*
  Enhanced fuzzy profanity helper adapted from test/dd.ts
*/
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
  "motherfucker",
];

function escapeForCharClass(chars: string): string {
  return chars.replace(/[\]\\\^-]/g, "\\$&");
}

function letterPattern(letter: string): string {
  const subs = (SUBSTITUTIONS as Record<string, string>)[letter] ?? letter;
  const escaped = escapeForCharClass(subs);
  return `[${escaped}]+`;
}

function buildWordPattern(word: string): string {
  return word
    .toLowerCase()
    .split("")
    .map(letterPattern)
    .join("[\\W_]*");
}

function buildProfanityRegex(words: string[] = BASE_WORDS): RegExp {
  const alternation = words.map(buildWordPattern).join("|");
  const pattern = `(?<![a-zA-Z])(?:${alternation})(?![a-zA-Z])`;
  return new RegExp(pattern, "gi");
}

export const PROFANITY_REGEX = buildProfanityRegex();

export function findProfanity(text: string): string[] {
  const matches = text.match(PROFANITY_REGEX) ?? [];
  return matches.map((m) => m.toLowerCase());
}

export function containsProfanity(text: string): boolean {
  PROFANITY_REGEX.lastIndex = 0;
  return PROFANITY_REGEX.test(text);
}
