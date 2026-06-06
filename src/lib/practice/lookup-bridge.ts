import { createLookupFromJson, type WubiLookup, type WubiChar, type WubiWord } from '@/lib/wubi/lookup';
import charsData from '@/data/wubi86-chars.json';
import wordsData from '@/data/wubi86-words.json';

interface RawChar {
  char: string;
  code: string;
  weight: number;
  isCore: boolean;
}
interface RawWord {
  word: string;
  code: string;
  weight: number;
  isCore: boolean;
}

const chars: WubiChar[] = (charsData as RawChar[]).map((c) => ({
  ...c,
  codeLength: c.code.length,
}));

const words: WubiWord[] = (wordsData as RawWord[]).map((w) => ({
  ...w,
  length: w.word.length,
}));

let cached: WubiLookup | null = null;

export function getPracticeLookup(): WubiLookup {
  if (cached !== null) return cached;
  cached = createLookupFromJson(chars, words);
  return cached;
}

export function getCharCode(char: string | null): string | null {
  if (char === null) return null;
  return getPracticeLookup().lookupChar(char)?.code ?? null;
}

export function getWordSuggestions(char: string | null, limit = 4): WubiWord[] {
  if (char === null) return [];
  const lookup = getPracticeLookup();
  const candidates = lookup.lookupWord(char);
  if (candidates) return [candidates];
  const all = lookup.randomWords(200, 2);
  return all.filter((w) => w.word.includes(char)).slice(0, limit);
}
