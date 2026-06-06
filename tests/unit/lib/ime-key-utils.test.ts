import { describe, it, expect } from 'vitest';
import { codeToLetter, isImeProcessedLetter } from '@/lib/ime/key-utils';

describe('codeToLetter', () => {
  it('extracts letter from "KeyA"-"KeyZ" codes', () => {
    expect(codeToLetter('KeyA')).toBe('a');
    expect(codeToLetter('KeyT')).toBe('t');
    expect(codeToLetter('KeyZ')).toBe('z');
  });

  it('returns null for non-letter codes', () => {
    expect(codeToLetter('Digit1')).toBeNull();
    expect(codeToLetter('Space')).toBeNull();
    expect(codeToLetter('Enter')).toBeNull();
    expect(codeToLetter('Backspace')).toBeNull();
    expect(codeToLetter('ArrowLeft')).toBeNull();
  });

  it('returns null for malformed codes', () => {
    expect(codeToLetter('')).toBeNull();
    expect(codeToLetter('Key')).toBeNull();
    expect(codeToLetter('Key1')).toBeNull();
    expect(codeToLetter('Keys')).toBeNull();
    expect(codeToLetter('FOO')).toBeNull();
  });
});

describe('isImeProcessedLetter', () => {
  it('is true for KeyA-KeyZ', () => {
    expect(isImeProcessedLetter('KeyT')).toBe(true);
    expect(isImeProcessedLetter('KeyA')).toBe(true);
  });

  it('is false for non-letter codes', () => {
    expect(isImeProcessedLetter('Digit1')).toBe(false);
    expect(isImeProcessedLetter('Space')).toBe(false);
  });
});
