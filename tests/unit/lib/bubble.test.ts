import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BUBBLE_CONFIG,
  findBubbleMatch,
  isBubbleExactMatch,
  makeBubble,
  moveBubbles,
  noBubblesMatch,
  pickPoolItem,
  getAccuracy,
  getWpm,
  type Bubble,
} from '@/lib/game/bubble';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

const charItem = (char: string, code: string): WubiChar => ({
  char,
  code,
  weight: 100,
  codeLength: code.length,
  isCore: true,
});

const wordItem = (word: string, code: string): WubiWord => ({
  word,
  code,
  weight: 100,
  length: word.length,
  isCore: true,
});

describe('bubble game logic', () => {
  it('has reasonable defaults', () => {
    expect(DEFAULT_BUBBLE_CONFIG.riseSpeed).toBeGreaterThan(0);
  });

  it('pickPoolItem returns null for empty', () => {
    expect(pickPoolItem([])).toBeNull();
  });

  it('pickPoolItem respects seed', () => {
    const pool = [wordItem('我们', 'trwu'), wordItem('什么', 'wftc')];
    expect(pickPoolItem(pool, 0)?.code).toBe('trwu');
    expect(pickPoolItem(pool, 1)?.code).toBe('wftc');
    expect(pickPoolItem(pool, 100)?.code).toBe('trwu'); // wraps to 0
  });

  it('makeBubble builds char/word variants', () => {
    expect(makeBubble(charItem('我', 'trd'), 10, 0, 1).type).toBe('char');
    expect(makeBubble(wordItem('我们', 'trwu'), 10, 0, 2).type).toBe('word');
  });

  it('findBubbleMatch / isBubbleExactMatch', () => {
    const bubbles: Bubble[] = [
      makeBubble(wordItem('我们', 'trwu'), 0, 0, 1),
      makeBubble(wordItem('什么', 'wftc'), 0, 0, 2),
    ];
    expect(findBubbleMatch(bubbles, 't')?.text).toBe('我们');
    expect(findBubbleMatch(bubbles, '')).toBeNull();
    expect(isBubbleExactMatch(bubbles[0]!, 'trwu')).toBe(true);
    expect(isBubbleExactMatch(bubbles[0]!, 'tr')).toBe(false);
    expect(noBubblesMatch(bubbles, 'xx')).toBe(true);
    expect(noBubblesMatch(bubbles, 't')).toBe(false);
  });

  it('moveBubbles rises by speed, escapes when off top', () => {
    const bubbles: Bubble[] = [makeBubble(wordItem('我们', 'trwu'), 0, 100, 1)];
    const r1 = moveBubbles(bubbles, 1000, 50);
    expect(r1.survivors[0]?.y).toBe(50);
    expect(r1.escaped).toBe(0);

    const r2 = moveBubbles([makeBubble(wordItem('我们', 'trwu'), 0, 30, 2)], 1000, 50);
    expect(r2.survivors).toHaveLength(0);
    expect(r2.escaped).toBe(1);
  });

  it('getAccuracy / getWpm', () => {
    expect(getAccuracy(0, 0)).toBe(0);
    expect(getAccuracy(8, 10)).toBe(0.8);
    expect(getWpm(0, 0)).toBe(0);
    expect(getWpm(50, 60_000)).toBe(10);
  });
});
