import { describe, it, expect } from 'vitest';
import {
  extractCommitText,
  isFinalCommit,
  getLastChar,
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

describe('getLastChar', () => {
  it('returns the only char for single-char string', () => {
    expect(getLastChar('中')).toBe('中');
  });

  it('returns the last char of a multi-char string', () => {
    expect(getLastChar('中国')).toBe('国');
    expect(getLastChar('hello')).toBe('o');
  });

  it('returns empty for empty string', () => {
    expect(getLastChar('')).toBe('');
  });

  it('handles trailing punctuation', () => {
    // 中文标点"。" 也是字符
    expect(getLastChar('中。')).toBe('。');
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

  it('returns commit event with last char of multi-char input', () => {
    // 中文输入法偶尔会一次性提交"我们"两个字，handleCommit 只取最后一个
    const result = handleCommit('我们', '们', 0, 1000);
    expect(result?.typed).toBe('们');
    expect(result?.expected).toBe('们');
  });

  it('returns null for whitespace-only input', () => {
    expect(handleCommit(' ', '中', 0)).toBeNull();
  });

  it('returns null for Chinese punctuation input', () => {
    expect(handleCommit('，', '中', 0)).toBeNull();
    expect(handleCommit('。', '中', 0)).toBeNull();
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
