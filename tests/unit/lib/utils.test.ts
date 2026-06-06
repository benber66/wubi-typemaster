import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });

  it('overrides conflicting tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
  });
});
