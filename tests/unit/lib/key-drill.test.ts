import { describe, it, expect } from 'vitest';
import {
  INITIAL_DRILL_STATE,
  identifyWeakKeys,
  filterByKey,
  pickDrillQueue,
  applyTyped,
  recordKey,
  getAccuracy,
  getWpm,
  summarizeKeyStats,
  countKeyOccurrences,
  type DrillItem,
  type KeyStat,
} from '@/lib/game/key-drill';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

const charItem = (char: string, code: string, weight = 100): WubiChar => ({
  char,
  code,
  weight,
  codeLength: code.length,
  isCore: true,
});

const wordItem = (word: string, code: string, weight = 100, length = 2): WubiWord => ({
  word,
  code,
  weight,
  length,
  isCore: true,
});

const drillItem = (text: string, code: string, weight = 100, type: 'char' | 'word' = 'char'): DrillItem => ({
  text,
  code,
  weight,
  isCore: true,
  type,
});

describe('key-drill logic', () => {
  describe('identifyWeakKeys', () => {
    it('returns empty for insufficient presses', () => {
      const stats: KeyStat[] = [
        { key: 'a', totalPresses: 2, errors: 2, errorRate: 1 },
        { key: 'b', totalPresses: 10, errors: 1, errorRate: 0.1 },
      ];
      expect(identifyWeakKeys(stats, { minPresses: 5 })).toEqual(['b']);
    });
    it('sorts by error rate desc', () => {
      const stats: KeyStat[] = [
        { key: 'a', totalPresses: 10, errors: 1, errorRate: 0.1 },
        { key: 'b', totalPresses: 10, errors: 5, errorRate: 0.5 },
        { key: 'c', totalPresses: 10, errors: 3, errorRate: 0.3 },
      ];
      const weak = identifyWeakKeys(stats);
      expect(weak).toEqual(['b', 'c', 'a']);
    });
    it('respects topN', () => {
      const stats: KeyStat[] = Array.from({ length: 10 }, (_, i) => ({
        key: String.fromCharCode(97 + i),
        totalPresses: 10,
        errors: 10 - i,
        errorRate: (10 - i) / 10,
      }));
      expect(identifyWeakKeys(stats, { topN: 3 })).toHaveLength(3);
    });
  });

  describe('filterByKey', () => {
    it('filters pool by weak keys', () => {
      const pool: Array<WubiChar | WubiWord> = [
        charItem('我', 'trd'),
        charItem('国', 'lg'),
        wordItem('我们', 'trwu'),
      ];
      const items = filterByKey(pool, ['t', 'r']);
      expect(items.map((i) => i.text)).toEqual(['我', '我们']);
    });
    it('returns empty for empty keys', () => {
      const items = filterByKey([charItem('我', 'trd')], []);
      expect(items).toEqual([]);
    });
  });

  describe('pickDrillQueue', () => {
    it('returns top N by weight', () => {
      const items = [
        drillItem('a', 'aa', 10),
        drillItem('b', 'bb', 100),
        drillItem('c', 'cc', 50),
      ];
      const queue = pickDrillQueue(items, 2);
      expect(queue.map((i) => i.text)).toEqual(['b', 'c']);
    });
    it('handles count larger than pool', () => {
      const items = [drillItem('a', 'aa', 1)];
      expect(pickDrillQueue(items, 10)).toHaveLength(1);
    });
  });

  describe('applyTyped', () => {
    it('matches full code and advances', () => {
      const state = {
        ...INITIAL_DRILL_STATE,
        status: 'running' as const,
        queue: [drillItem('我', 'trd')],
        position: 0,
      };
      const r1 = applyTyped(state, 't');
      expect(r1.next.typed).toBe('t');
      expect(r1.next.position).toBe(0);
      expect(r1.isComplete).toBe(false);

      const r2 = applyTyped(r1.next, 'r');
      expect(r2.next.typed).toBe('tr');

      const r3 = applyTyped(r2.next, 'd');
      expect(r3.isComplete).toBe(true);
      expect(r3.next.position).toBe(1);
      expect(r3.next.status).toBe('completed');
    });

    it('clears typed on wrong key', () => {
      const state = {
        ...INITIAL_DRILL_STATE,
        status: 'running' as const,
        queue: [drillItem('我', 'trd')],
      };
      const r = applyTyped(state, 'x');
      expect(r.next.typed).toBe('');
      expect(r.next.totalKeystrokes).toBe(1);
      expect(r.next.correctKeystrokes).toBe(0);
    });

    it('returns unchanged when not running', () => {
      const state = { ...INITIAL_DRILL_STATE };
      const r = applyTyped(state, 'a');
      expect(r.next).toBe(state);
    });
  });

  describe('recordKey', () => {
    it('accumulates presses and errors per key', () => {
      const s1 = recordKey(INITIAL_DRILL_STATE, 'a', true);
      const s2 = recordKey(s1, 'a', false);
      const s3 = recordKey(s2, 'a', true);
      const stats = summarizeKeyStats(s3);
      expect(stats[0]).toEqual({
        key: 'a',
        totalPresses: 3,
        errors: 1,
        errorRate: Number((1 / 3).toFixed(4)),
      });
    });
  });

  describe('countKeyOccurrences', () => {
    it('counts chars from weak-key set', () => {
      expect(countKeyOccurrences('trd', ['t', 'r'])).toBe(2);
      expect(countKeyOccurrences('trd', ['x'])).toBe(0);
    });
  });

  describe('getAccuracy / getWpm', () => {
    it('returns 0 for empty input', () => {
      expect(getAccuracy(0, 0)).toBe(0);
      expect(getWpm(0, 0)).toBe(0);
    });
    it('computes values', () => {
      expect(getAccuracy(9, 10)).toBe(0.9);
      expect(getWpm(50, 60_000)).toBe(10);
    });
  });
});
