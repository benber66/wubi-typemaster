import { describe, it, expect } from 'vitest';
import {
  calculateWpm,
  calculateAccuracy,
  compareTexts,
  isCharCorrect,
  summarizeKeystrokes,
  wpmToCpm,
  type KeystrokeEvent,
} from '@/lib/typing/metrics';

describe('calculateWpm', () => {
  it('returns 0 for empty input', () => {
    expect(calculateWpm(0, 0)).toBe(0);
    expect(calculateWpm(10, 0)).toBe(0);
    expect(calculateWpm(0, 1000)).toBe(0);
  });

  it('calculates WPM for 60 chars in 60s = 12 wpm', () => {
    expect(calculateWpm(60, 60_000)).toBe(12);
  });

  it('calculates WPM for 300 chars in 60s = 60 wpm', () => {
    expect(calculateWpm(300, 60_000)).toBe(60);
  });

  it('rounds to 2 decimal places', () => {
    const wpm = calculateWpm(123, 7890);
    // 123 / 5 = 24.6 words, 24.6 / (7.89 / 60) = 187.07
    expect(wpm).toBe(187.07);
  });

  it('handles short durations', () => {
    // 5 chars in 1 second = 60 wpm
    expect(calculateWpm(5, 1000)).toBe(60);
  });
});

describe('calculateAccuracy', () => {
  it('returns 0 for empty', () => {
    expect(calculateAccuracy(0, 0)).toBe(0);
    expect(calculateAccuracy(5, 0)).toBe(0);
  });

  it('returns 1.0 for perfect', () => {
    expect(calculateAccuracy(100, 100)).toBe(1);
  });

  it('returns 0.5 for half correct', () => {
    expect(calculateAccuracy(50, 100)).toBe(0.5);
  });

  it('rounds to 4 decimal places', () => {
    expect(calculateAccuracy(1, 3)).toBe(0.3333);
  });
});

describe('compareTexts', () => {
  it('returns perfect for identical strings', () => {
    const result = compareTexts('hello', 'hello', ['h', 'e', 'l', 'l', 'o']);
    expect(result.total).toBe(5);
    expect(result.correct).toBe(5);
    expect(result.errors).toEqual([]);
    expect(result.accuracy).toBe(1);
  });

  it('detects single character error', () => {
    const result = compareTexts('hello', 'helxo', ['h', 'e', 'l', 'l', 'o']);
    expect(result.correct).toBe(4);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      position: 3,
      expected: 'l',
      typed: 'x',
      expectedCode: 'l',
      typedCode: null,
    });
    expect(result.accuracy).toBe(0.8);
  });

  it('detects missing characters when typed is shorter', () => {
    const result = compareTexts('hello', 'hel', ['h', 'e', 'l', 'l', 'o']);
    expect(result.total).toBe(5);
    expect(result.correct).toBe(3);
    expect(result.errors).toHaveLength(2);
  });

  it('detects extra characters when typed is longer', () => {
    const result = compareTexts('hi', 'hii', ['h', 'i']);
    expect(result.correct).toBe(2);
    expect(result.errors).toEqual([]);
    expect(result.total).toBe(2);
  });

  it('records typedCode when provided', () => {
    const result = compareTexts('中', '国', ['k'], ['l']);
    expect(result.errors[0]).toEqual({
      position: 0,
      expected: '中',
      typed: '国',
      expectedCode: 'k',
      typedCode: 'l',
    });
  });

  it('handles Chinese characters', () => {
    const result = compareTexts('中国', '中国', ['k', 'l']);
    expect(result.accuracy).toBe(1);
    expect(result.errors).toEqual([]);
  });
});

describe('isCharCorrect', () => {
  it('compares single characters', () => {
    expect(isCharCorrect('a', 'a')).toBe(true);
    expect(isCharCorrect('a', 'b')).toBe(false);
  });

  it('compares Chinese characters', () => {
    expect(isCharCorrect('中', '中')).toBe(true);
    expect(isCharCorrect('中', '国')).toBe(false);
  });

  it('compares whitespace strictly', () => {
    expect(isCharCorrect(' ', ' ')).toBe(true);
    expect(isCharCorrect(' ', '')).toBe(false);
  });
});

describe('summarizeKeystrokes', () => {
  it('returns zeros for empty', () => {
    const result = summarizeKeystrokes([]);
    expect(result.totalKeystrokes).toBe(0);
    expect(result.totalCompositions).toBe(0);
    expect(result.errors).toBe(0);
  });

  it('counts keystrokes and errors', () => {
    const events: KeystrokeEvent[] = [
      { char: 'h', expected: 'h', timestamp: 0, isComposing: true },
      { char: 'e', expected: 'e', timestamp: 100, isComposing: true },
      { char: 'x', expected: 'l', timestamp: 200, isComposing: false },
    ];
    const result = summarizeKeystrokes(events);
    expect(result.totalKeystrokes).toBe(3);
    expect(result.totalCompositions).toBe(2);
    expect(result.errors).toBe(1);
  });
});

describe('wpmToCpm', () => {
  it('multiplies by 5', () => {
    expect(wpmToCpm(60)).toBe(300);
    expect(wpmToCpm(0)).toBe(0);
    expect(wpmToCpm(12.4)).toBe(62);
  });
});
