import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

export interface Bubble {
  id: number;
  text: string;
  code: string;
  weight: number;
  x: number;
  y: number;
  type: 'char' | 'word';
  isCore: boolean;
}

export interface BubbleConfig {
  width: number;
  height: number;
  spawnIntervalMs: number;
  riseSpeed: number; // px per second (upward)
  maxOnScreen: number;
}

export const DEFAULT_BUBBLE_CONFIG: BubbleConfig = {
  width: 800,
  height: 600,
  spawnIntervalMs: 2000,
  riseSpeed: 25,
  maxOnScreen: 12,
};

export type GameStatus = 'idle' | 'running' | 'paused' | 'gameover';

export function pickPoolItem(
  pool: ReadonlyArray<WubiChar | WubiWord>,
  seed?: number,
): WubiChar | WubiWord | null {
  if (pool.length === 0) return null;
  const idx = seed !== undefined ? seed % pool.length : Math.floor(Math.random() * pool.length);
  return pool[idx] ?? null;
}

export function makeBubble(
  item: WubiChar | WubiWord,
  x: number,
  y: number,
  id: number,
): Bubble {
  const isChar = 'char' in item;
  return {
    id,
    text: isChar ? item.char : item.word,
    code: item.code,
    weight: item.weight,
    x,
    y,
    type: isChar ? 'char' : 'word',
    isCore: item.isCore,
  };
}

export function findBubbleMatch(bubbles: ReadonlyArray<Bubble>, typed: string): Bubble | null {
  if (!typed) return null;
  for (const b of bubbles) {
    if (b.code.startsWith(typed)) return b;
  }
  return null;
}

export function isBubbleExactMatch(b: Bubble, typed: string): boolean {
  return b.code === typed;
}

export function noBubblesMatch(bubbles: ReadonlyArray<Bubble>, typed: string): boolean {
  if (!typed) return false;
  return !bubbles.some((b) => b.code.startsWith(typed));
}

export function moveBubbles(
  bubbles: ReadonlyArray<Bubble>,
  deltaMs: number,
  riseSpeed: number,
): { survivors: Bubble[]; escaped: number } {
  const survivors: Bubble[] = [];
  let escaped = 0;
  const dy = (riseSpeed * deltaMs) / 1000;
  for (const b of bubbles) {
    const nextY = b.y - dy;
    if (nextY <= 0) {
      escaped += 1;
    } else {
      survivors.push({ ...b, y: nextY });
    }
  }
  return { survivors, escaped };
}

export function getAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Number((correct / total).toFixed(4));
}

export function getWpm(correctPops: number, durationMs: number): number {
  if (correctPops <= 0 || durationMs <= 0) return 0;
  const minutes = durationMs / 60_000;
  return Number(((correctPops / 5) / minutes).toFixed(2));
}
