import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

export type DrillLength = 2 | 3 | 4 | 5;

export interface KeyStat {
  key: string;
  totalPresses: number;
  errors: number;
  errorRate: number;
}

export interface DrillItem {
  text: string;
  code: string;
  isCore: boolean;
  type: 'char' | 'word';
  weight: number;
}

export interface DrillState {
  status: 'idle' | 'running' | 'paused' | 'completed';
  queue: ReadonlyArray<DrillItem>;
  position: number;
  typed: string;
  totalAttempts: number;
  correctAttempts: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  startTime: number | null;
  endTime: number | null;
  errorsByKey: Map<string, number>;
  pressesByKey: Map<string, number>;
}

export const INITIAL_DRILL_STATE: DrillState = {
  status: 'idle',
  queue: [],
  position: 0,
  typed: '',
  totalAttempts: 0,
  correctAttempts: 0,
  totalKeystrokes: 0,
  correctKeystrokes: 0,
  startTime: null,
  endTime: null,
  errorsByKey: new Map(),
  pressesByKey: new Map(),
};

export function identifyWeakKeys(
  stats: ReadonlyArray<KeyStat>,
  options: { minPresses?: number; topN?: number } = {},
): string[] {
  const { minPresses = 5, topN = 5 } = options;
  return stats
    .filter((s) => s.totalPresses >= minPresses)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, topN)
    .map((s) => s.key);
}

export function filterByKey(
  pool: ReadonlyArray<WubiChar | WubiWord>,
  keys: ReadonlyArray<string>,
): DrillItem[] {
  if (keys.length === 0) return [];
  const out: DrillItem[] = [];
  for (const item of pool) {
    const code = item.code.toLowerCase();
    if (code.split('').some((k) => keys.includes(k))) {
      out.push(
        'char' in item
          ? {
              text: item.char,
              code: item.code,
              isCore: item.isCore,
              type: 'char',
              weight: item.weight,
            }
          : {
              text: item.word,
              code: item.code,
              isCore: item.isCore,
              type: 'word',
              weight: item.weight,
            },
      );
    }
  }
  return out;
}

export function pickDrillQueue(items: ReadonlyArray<DrillItem>, count: number): DrillItem[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => b.weight - a.weight);
  return sorted.slice(0, count);
}

export function recordKey(state: DrillState, key: string, isCorrect: boolean): DrillState {
  const k = key.toLowerCase();
  const errorsByKey = new Map(state.errorsByKey);
  const pressesByKey = new Map(state.pressesByKey);
  pressesByKey.set(k, (pressesByKey.get(k) ?? 0) + 1);
  if (!isCorrect) errorsByKey.set(k, (errorsByKey.get(k) ?? 0) + 1);
  return {
    ...state,
    totalKeystrokes: state.totalKeystrokes + 1,
    correctKeystrokes: state.correctKeystrokes + (isCorrect ? 1 : 0),
    pressesByKey,
    errorsByKey,
  };
}

export function applyTyped(
  state: DrillState,
  key: string,
): { next: DrillState; isComplete: boolean; matched: DrillItem | null } {
  if (state.status !== 'running') return { next: state, isComplete: false, matched: null };
  const item = state.queue[state.position];
  if (!item) return { next: state, isComplete: false, matched: null };
  const nextTyped = state.typed + key.toLowerCase();
  const isFullMatch = nextTyped === item.code;
  if (!isFullMatch && !item.code.startsWith(nextTyped)) {
    // 错误：清空 typed，但记录一次错误
    const recState = recordKey(state, key, false);
    return {
      next: { ...recState, typed: '', totalAttempts: recState.totalAttempts + 1 },
      isComplete: false,
      matched: null,
    };
  }
  if (isFullMatch) {
    const recState = recordKey(state, key, true);
    const newPosition = state.position + 1;
    const completed = newPosition >= state.queue.length;
    return {
      next: {
        ...recState,
        typed: '',
        position: newPosition,
        totalAttempts: recState.totalAttempts + 1,
        correctAttempts: recState.correctAttempts + 1,
        status: completed ? 'completed' : 'running',
        endTime: completed ? Date.now() : null,
      },
      isComplete: completed,
      matched: item,
    };
  }
  // partial match
  const recState = recordKey(state, key, true);
  return { next: { ...recState, typed: nextTyped }, isComplete: false, matched: null };
}

export function getAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Number((correct / total).toFixed(4));
}

export function getWpm(correctKeystrokes: number, durationMs: number): number {
  if (correctKeystrokes <= 0 || durationMs <= 0) return 0;
  const minutes = durationMs / 60_000;
  return Number((correctKeystrokes / 5 / minutes).toFixed(2));
}

export function summarizeKeyStats(state: DrillState): KeyStat[] {
  const out: KeyStat[] = [];
  for (const [key, presses] of state.pressesByKey) {
    const errors = state.errorsByKey.get(key) ?? 0;
    out.push({
      key,
      totalPresses: presses,
      errors,
      errorRate: presses > 0 ? Number((errors / presses).toFixed(4)) : 0,
    });
  }
  return out.sort((a, b) => b.errorRate - a.errorRate);
}

export function countKeyOccurrences(code: string, keys: ReadonlyArray<string>): number {
  if (keys.length === 0) return 0;
  const lower = code.toLowerCase();
  let n = 0;
  for (const c of lower) if (keys.includes(c)) n += 1;
  return n;
}
