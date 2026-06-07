import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

export interface Invader {
  id: number;
  text: string;
  code: string;
  weight: number;
  x: number;
  y: number;
  type: 'char' | 'word';
  isCore: boolean;
}

export interface InvaderConfig {
  width: number;
  height: number;
  spawnIntervalMs: number;
  fallSpeed: number; // px per second
  maxOnScreen: number;
}

export const DEFAULT_INVADER_CONFIG: InvaderConfig = {
  width: 800,
  height: 600,
  spawnIntervalMs: 2500,
  fallSpeed: 30,
  maxOnScreen: 12,
};

export type GameStatus = 'idle' | 'running' | 'paused' | 'gameover';

export interface GameState {
  status: GameStatus;
  invaders: ReadonlyArray<Invader>;
  typed: string;
  score: number;
  destroyed: number;
  missed: number;
  totalAttempts: number;
  correctAttempts: number;
  startTime: number | null;
  endTime: number | null;
  spawnTimer: number; // ms since last spawn
  tickMs: number; // virtual clock
  won: boolean;
}

export interface GameActions {
  reset: (config?: Partial<InvaderConfig>) => void;
  start: (config?: Partial<InvaderConfig>) => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  tick: (deltaMs: number) => void;
  type: (char: string) => { hit: Invader | null; matched: string };
  spawn: (pool: ReadonlyArray<WubiChar | WubiWord>, nextId: number) => number;
}

export function pickPoolItem(
  pool: ReadonlyArray<WubiChar | WubiWord>,
  seed?: number,
): WubiChar | WubiWord | null {
  if (pool.length === 0) return null;
  const idx = seed !== undefined ? seed % pool.length : Math.floor(Math.random() * pool.length);
  return pool[idx] ?? null;
}

export function makeInvader(item: WubiChar | WubiWord, x: number, y: number, id: number): Invader {
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

export function findMatch(invaders: ReadonlyArray<Invader>, typed: string): Invader | null {
  if (!typed) return null;
  for (const inv of invaders) {
    if (inv.code.startsWith(typed)) {
      return inv;
    }
  }
  return null;
}

export function isExactMatch(inv: Invader, typed: string): boolean {
  return inv.code === typed;
}

export function isPartialMatch(inv: Invader, typed: string): boolean {
  return inv.code.startsWith(typed) && typed.length > 0;
}

export function noInvadersMatch(invaders: ReadonlyArray<Invader>, typed: string): boolean {
  if (!typed) return false;
  return !invaders.some((inv) => inv.code.startsWith(typed));
}

export function moveInvaders(
  invaders: ReadonlyArray<Invader>,
  deltaMs: number,
  fallSpeed: number,
  height: number,
): { survivors: Invader[]; missed: number } {
  const survivors: Invader[] = [];
  let missed = 0;
  const dy = (fallSpeed * deltaMs) / 1000;
  for (const inv of invaders) {
    const nextY = inv.y + dy;
    if (nextY >= height) {
      missed += 1;
    } else {
      survivors.push({ ...inv, y: nextY });
    }
  }
  return { survivors, missed };
}

export function getAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Number((correct / total).toFixed(4));
}

export function getWpm(correctChars: number, durationMs: number): number {
  if (correctChars <= 0 || durationMs <= 0) return 0;
  const minutes = durationMs / 60_000;
  return Number((correctChars / 5 / minutes).toFixed(2));
}
