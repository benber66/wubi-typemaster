import { describe, it, expect } from 'vitest';
import {
  DEFAULT_INVADER_CONFIG,
  findMatch,
  isExactMatch,
  isPartialMatch,
  makeInvader,
  moveInvaders,
  noInvadersMatch,
  pickPoolItem,
  getAccuracy,
  getWpm,
  type Invader,
} from '@/lib/game/word-invaders';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

const sampleChar = (char: string, code: string, weight = 100): WubiChar => ({
  char,
  code,
  weight,
  codeLength: code.length,
  isCore: true,
});

const sampleWord = (word: string, code: string, weight = 100, length = 2): WubiWord => ({
  word,
  code,
  weight,
  length,
  isCore: true,
});

describe('word-invaders game logic', () => {
  describe('DEFAULT_INVADER_CONFIG', () => {
    it('has reasonable defaults', () => {
      expect(DEFAULT_INVADER_CONFIG.width).toBe(800);
      expect(DEFAULT_INVADER_CONFIG.fallSpeed).toBeGreaterThan(0);
      expect(DEFAULT_INVADER_CONFIG.spawnIntervalMs).toBeGreaterThan(0);
    });
  });

  describe('pickPoolItem', () => {
    it('returns null for empty pool', () => {
      expect(pickPoolItem([])).toBeNull();
    });
    it('returns the item at seed index', () => {
      const pool = [sampleChar('我', 'trd'), sampleChar('你', 'wqrq'), sampleChar('他', 'wb')];
      expect(pickPoolItem(pool, 0)?.code).toBe('trd');
      expect(pickPoolItem(pool, 1)?.code).toBe('wqrq');
      expect(pickPoolItem(pool, 99)?.code).toBe('trd'); // wraps
    });
  });

  describe('makeInvader', () => {
    it('builds an invader from a WubiChar', () => {
      const inv = makeInvader(sampleChar('我', 'trd', 50), 100, 0, 1);
      expect(inv).toEqual({
        id: 1,
        text: '我',
        code: 'trd',
        weight: 50,
        x: 100,
        y: 0,
        type: 'char',
        isCore: true,
      });
    });
    it('builds an invader from a WubiWord', () => {
      const inv = makeInvader(sampleWord('我们', 'trwu', 200, 2), 200, 50, 7);
      expect(inv).toEqual({
        id: 7,
        text: '我们',
        code: 'trwu',
        weight: 200,
        x: 200,
        y: 50,
        type: 'word',
        isCore: true,
      });
    });
  });

  describe('findMatch / isPartialMatch / isExactMatch', () => {
    const invaders: Invader[] = [
      makeInvader(sampleChar('我', 'trd'), 0, 0, 1),
      makeInvader(sampleChar('国', 'lg'), 100, 0, 2),
    ];

    it('finds a matching invader by prefix', () => {
      const m = findMatch(invaders, 't');
      expect(m?.text).toBe('我');
    });
    it('finds nothing for empty typed', () => {
      expect(findMatch(invaders, '')).toBeNull();
    });
    it('isPartialMatch works for prefix', () => {
      expect(isPartialMatch(invaders[0]!, 't')).toBe(true);
      expect(isPartialMatch(invaders[0]!, 'trd')).toBe(true);
      expect(isPartialMatch(invaders[0]!, 'trdf')).toBe(false);
    });
    it('isExactMatch requires full code match', () => {
      expect(isExactMatch(invaders[0]!, 'trd')).toBe(true);
      expect(isExactMatch(invaders[0]!, 'tr')).toBe(false);
    });
    it('noInvadersMatch returns true when no invader has the prefix', () => {
      expect(noInvadersMatch(invaders, 'xx')).toBe(true);
      expect(noInvadersMatch(invaders, 't')).toBe(false);
      expect(noInvadersMatch(invaders, '')).toBe(false);
    });
  });

  describe('moveInvaders', () => {
    it('moves invaders down by fallSpeed * deltaMs', () => {
      const invaders: Invader[] = [makeInvader(sampleChar('我', 'trd'), 0, 0, 1)];
      const r = moveInvaders(invaders, 1000, 30, 600);
      expect(r.survivors).toHaveLength(1);
      expect(r.survivors[0]?.y).toBe(30);
      expect(r.missed).toBe(0);
    });
    it('counts invaders that fall past height as missed', () => {
      const invaders: Invader[] = [makeInvader(sampleChar('我', 'trd'), 0, 580, 1)];
      const r = moveInvaders(invaders, 2000, 30, 600);
      expect(r.survivors).toHaveLength(0);
      expect(r.missed).toBe(1);
    });
  });

  describe('getAccuracy', () => {
    it('returns 0 for total=0', () => {
      expect(getAccuracy(0, 0)).toBe(0);
    });
    it('computes ratio', () => {
      expect(getAccuracy(9, 10)).toBe(0.9);
    });
  });

  describe('getWpm', () => {
    it('returns 0 when no chars or duration', () => {
      expect(getWpm(0, 0)).toBe(0);
      expect(getWpm(0, 60000)).toBe(0);
    });
    it('computes wpm = chars/5/minutes', () => {
      expect(getWpm(50, 60_000)).toBe(10);
    });
  });
});
