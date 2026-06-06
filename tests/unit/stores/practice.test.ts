import { describe, it, expect, beforeEach } from 'vitest';
import { usePractice, selectActiveChar } from '@/stores/practice';

describe('practice store', () => {
  beforeEach(() => {
    usePractice.getState().reset();
  });

  it('starts in idle state', () => {
    const s = usePractice.getState();
    expect(s.status).toBe('idle');
    expect(s.targetText).toBe('');
    expect(s.position).toBe(0);
  });

  it('start sets target text and transitions to running', () => {
    usePractice.getState().start('中国', 't1');
    const s = usePractice.getState();
    expect(s.status).toBe('running');
    expect(s.targetText).toBe('中国');
    expect(s.textId).toBe('t1');
    expect(s.startTime).not.toBeNull();
  });

  it('commit correct char advances position without error', () => {
    usePractice.getState().start('中国', 't1');
    const err = usePractice.getState().commit('中', 'k');
    expect(err).toBeNull();
    const s = usePractice.getState();
    expect(s.position).toBe(1);
    expect(s.typedText).toBe('中');
    expect(s.errors).toHaveLength(0);
  });

  it('commit wrong char records error but advances', () => {
    usePractice.getState().start('中国', 't1');
    const err = usePractice.getState().commit('国', 'k', 'l');
    expect(err).not.toBeNull();
    expect(err?.expected).toBe('中');
    expect(err?.typed).toBe('国');
    expect(err?.expectedCode).toBe('k');
    const s = usePractice.getState();
    expect(s.position).toBe(1);
    expect(s.errors).toHaveLength(1);
  });

  it('commit at end marks session completed', () => {
    usePractice.getState().start('中', 't1');
    usePractice.getState().commit('中', 'k');
    expect(usePractice.getState().status).toBe('completed');
    expect(usePractice.getState().endTime).not.toBeNull();
  });

  it('commit when not running is no-op', () => {
    expect(usePractice.getState().commit('中', 'k')).toBeNull();
    const s = usePractice.getState();
    expect(s.position).toBe(0);
  });

  it('commit beyond target is no-op', () => {
    usePractice.getState().start('中', 't1');
    usePractice.getState().commit('中', 'k'); // completes
    usePractice.getState().commit('中', 'k'); // ignored
    expect(usePractice.getState().position).toBe(1);
  });

  it('commit punctuation is a normal char (no longer silently dropped)', () => {
    usePractice.getState().start('，', 't1');
    const err = usePractice.getState().commit('，', '');
    expect(err).toBeNull();
    expect(usePractice.getState().position).toBe(1);
    expect(usePractice.getState().typedText).toBe('，');
  });

  it('commit whitespace is ignored', () => {
    usePractice.getState().start('中国', 't1');
    const err = usePractice.getState().commit(' ', '');
    expect(err).toBeNull();
    expect(usePractice.getState().position).toBe(0);
  });

  it('commitChars splits multi-char IME commit and processes each char', () => {
    usePractice.getState().start('中国', 't1');
    const errs = usePractice.getState().commitChars('中国', {
      expectedCode: () => 'k',
      typedCode: () => null,
    });
    expect(errs).toEqual([]);
    const s = usePractice.getState();
    expect(s.position).toBe(2);
    expect(s.typedText).toBe('中国');
    expect(s.status).toBe('completed');
  });

  it('commitChars records errors per mismatched char', () => {
    usePractice.getState().start('中国', 't1');
    const errs = usePractice.getState().commitChars('我们', {
      expectedCode: () => 'k',
      typedCode: () => null,
    });
    expect(errs).toHaveLength(2);
    expect(errs[0]?.expected).toBe('中');
    expect(errs[0]?.typed).toBe('我');
    expect(errs[1]?.expected).toBe('国');
    expect(errs[1]?.typed).toBe('们');
    expect(usePractice.getState().position).toBe(2);
  });

  it('commitChars with empty string is no-op', () => {
    usePractice.getState().start('中国', 't1');
    const errs = usePractice.getState().commitChars('', {
      expectedCode: () => '',
      typedCode: () => null,
    });
    expect(errs).toEqual([]);
    expect(usePractice.getState().position).toBe(0);
  });

  it('commitChars stops at end of target', () => {
    usePractice.getState().start('中', 't1');
    const errs = usePractice.getState().commitChars('中国', {
      expectedCode: () => '',
      typedCode: () => null,
    });
    expect(errs).toEqual([]);
    expect(usePractice.getState().position).toBe(1);
  });

  it('undo moves back one position', () => {
    usePractice.getState().start('中国', 't1');
    usePractice.getState().commit('中', 'k');
    usePractice.getState().undo();
    const s = usePractice.getState();
    expect(s.position).toBe(0);
    expect(s.typedText).toBe('');
  });

  it('undo at position 0 is no-op', () => {
    usePractice.getState().start('中国', 't1');
    usePractice.getState().undo();
    expect(usePractice.getState().position).toBe(0);
  });

  it('pause and resume work', () => {
    usePractice.getState().start('中', 't1');
    usePractice.getState().pause();
    expect(usePractice.getState().status).toBe('paused');
    usePractice.getState().resume();
    expect(usePractice.getState().status).toBe('running');
  });

  it('end transitions to completed', () => {
    usePractice.getState().start('中国', 't1');
    usePractice.getState().end();
    expect(usePractice.getState().status).toBe('completed');
  });

  it('reset clears all state', () => {
    usePractice.getState().start('中', 't1');
    usePractice.getState().commit('中', 'k');
    usePractice.getState().reset();
    const s = usePractice.getState();
    expect(s.status).toBe('idle');
    expect(s.targetText).toBe('');
    expect(s.typedText).toBe('');
    expect(s.position).toBe(0);
    expect(s.errors).toEqual([]);
  });

  it('getResult computes wpm, accuracy, totals', () => {
    usePractice.getState().start('中国', 't1');
    usePractice.getState().commit('中', 'k'); // correct
    usePractice.getState().commit('错', 'l', 'g'); // wrong (expected '国', got '错')
    const r = usePractice.getState().getResult();
    expect(r.total).toBe(2);
    expect(r.correct).toBe(1);
    expect(r.accuracy).toBe(0.5);
    expect(r.wpm).toBeGreaterThanOrEqual(0);
    expect(r.errors).toHaveLength(1);
  });

  it('selectActiveChar returns current target', () => {
    usePractice.getState().start('中', 't1');
    const s = usePractice.getState();
    expect(selectActiveChar(s)).toBe('中');
  });
});
