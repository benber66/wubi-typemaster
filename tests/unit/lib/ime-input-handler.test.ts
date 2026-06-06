import { describe, it, expect } from 'vitest';
import {
  extractCommitText,
  isFinalCommit,
  splitCommitText,
  handleCommit,
  buildCharError,
} from '@/lib/ime/input-handler';

describe('extractCommitText', () => {
  it('returns data on compositionend', () => {
    expect(extractCommitText({ type: 'compositionend', data: '中' })).toBe('中');
  });

  it('returns empty for other event types', () => {
    expect(extractCommitText({ type: 'compositionstart' })).toBe('');
    expect(extractCommitText({ type: 'compositionupdate', data: '中' })).toBe('');
    expect(extractCommitText({ type: 'keydown' })).toBe('');
  });

  it('returns empty for compositionend without data', () => {
    expect(extractCommitText({ type: 'compositionend' })).toBe('');
  });
});

describe('isFinalCommit', () => {
  it('returns true for compositionend with non-empty data', () => {
    expect(isFinalCommit({ type: 'compositionend', data: '中' })).toBe(true);
  });

  it('returns false for compositionend with empty data (ESC cancel)', () => {
    expect(isFinalCommit({ type: 'compositionend', data: '' })).toBe(false);
  });

  it('returns false for non-compositionend events', () => {
    expect(isFinalCommit({ type: 'keydown', data: 'a' })).toBe(false);
  });
});

describe('splitCommitText', () => {
  it('returns single char for single-char input', () => {
    expect(splitCommitText('中')).toEqual(['中']);
  });

  it('splits multi-char IME commit into individual chars', () => {
    expect(splitCommitText('我们')).toEqual(['我', '们']);
    expect(splitCommitText('中国')).toEqual(['中', '国']);
  });

  it('keeps punctuation as commit units (caller decides what to do)', () => {
    expect(splitCommitText('中，')).toEqual(['中', '，']);
  });

  it('filters whitespace (space/newline/tab/CR)', () => {
    expect(splitCommitText('中 国')).toEqual(['中', '国']);
    expect(splitCommitText('中\n国\t，')).toEqual(['中', '国', '，']);
  });

  it('returns empty array for empty/whitespace-only input', () => {
    expect(splitCommitText('')).toEqual([]);
    expect(splitCommitText('   \n\t')).toEqual([]);
  });
});

describe('handleCommit', () => {
  it('returns commit event for Chinese char', () => {
    const result = handleCommit('中', '中', 0, 1000);
    expect(result).toEqual({
      typed: '中',
      expected: '中',
      position: 0,
      timestamp: 1000,
    });
  });

  it('passes through a single char unchanged (no longer drops the rest)', () => {
    // store 层负责拆分；handleCommit 只处理单字
    const result = handleCommit('们', '们', 1, 1000);
    expect(result?.typed).toBe('们');
    expect(result?.expected).toBe('们');
  });

  it('keeps punctuation as a valid commit', () => {
    const result = handleCommit('，', '，', 0, 1000);
    expect(result?.typed).toBe('，');
  });

  it('returns null for whitespace-only input', () => {
    expect(handleCommit(' ', '中', 0)).toBeNull();
    expect(handleCommit('\n', '中', 0)).toBeNull();
  });

  it('uses Date.now() when timestamp not provided', () => {
    const before = Date.now();
    const result = handleCommit('中', '中', 0);
    const after = Date.now();
    expect(result?.timestamp).toBeGreaterThanOrEqual(before);
    expect(result?.timestamp).toBeLessThanOrEqual(after);
  });
});

describe('buildCharError', () => {
  it('builds error with null typedCode by default', () => {
    const err = buildCharError(0, '中', '国', 'k');
    expect(err).toEqual({
      position: 0,
      expected: '中',
      typed: '国',
      expectedCode: 'k',
      typedCode: null,
    });
  });

  it('accepts custom typedCode', () => {
    const err = buildCharError(3, '的', '得', 'r', 'tj');
    expect(err.typedCode).toBe('tj');
  });
});
