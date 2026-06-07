import { create } from 'zustand';
import {
  compareTexts,
  calculateWpm,
  calculateAccuracy,
  type CharError,
} from '@/lib/typing/metrics';
import { buildCharError, handleCommit, splitCommitText } from '@/lib/ime/input-handler';

export type PracticeStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface CodeLookup {
  expectedCode: (char: string) => string;
  typedCode: (char: string) => string | null;
}

export interface PracticeSessionState {
  status: PracticeStatus;
  textId: string | null;
  targetText: string;
  typedText: string;
  position: number;
  startTime: number | null;
  endTime: number | null;
  errors: CharError[];
}

export interface PracticeSessionActions {
  start: (text: string, textId?: string) => void;
  pause: () => void;
  resume: () => void;
  commit: (input: string, expectedCode: string, typedCode?: string | null) => CharError | null;
  commitChars: (text: string, lookup: CodeLookup) => CharError[];
  undo: () => void;
  end: () => void;
  reset: () => void;
  getResult: () => {
    total: number;
    correct: number;
    accuracy: number;
    wpm: number;
    durationMs: number;
    errors: CharError[];
  };
}

export type PracticeStore = PracticeSessionState & PracticeSessionActions;

const initialState: PracticeSessionState = {
  status: 'idle',
  textId: null,
  targetText: '',
  typedText: '',
  position: 0,
  startTime: null,
  endTime: null,
  errors: [],
};

interface CharApplyResult {
  update: Partial<PracticeSessionState> | null;
  error: CharError | null;
}

function computeCharApply(
  state: PracticeSessionState,
  char: string,
  expectedCode: string,
  typedCode: string | null,
): CharApplyResult {
  if (state.status !== 'running') return { update: null, error: null };
  if (state.position >= state.targetText.length) return { update: null, error: null };

  const expected = state.targetText[state.position] ?? '';
  const event = handleCommit(char, expected, state.position);
  if (event === null) return { update: null, error: null };

  const newTyped = state.typedText + event.typed;
  const newErrors =
    event.typed === event.expected
      ? state.errors
      : [
          ...state.errors,
          buildCharError(state.position, event.expected, event.typed, expectedCode, typedCode),
        ];
  const newPosition = state.position + 1;
  const completed = newPosition >= state.targetText.length;
  const update: Partial<PracticeSessionState> = {
    typedText: newTyped,
    position: newPosition,
    errors: newErrors,
  };
  if (completed) {
    update.status = 'completed';
    update.endTime = Date.now();
  }
  const error = event.typed === event.expected ? null : (newErrors[newErrors.length - 1] ?? null);
  return { update, error };
}

export const usePractice = create<PracticeStore>((set, get) => ({
  ...initialState,
  start: (text, textId) =>
    set({
      status: 'running',
      textId: textId ?? null,
      targetText: text,
      typedText: '',
      position: 0,
      startTime: Date.now(),
      endTime: null,
      errors: [],
    }),
  pause: () => {
    const s = get();
    if (s.status === 'running') set({ status: 'paused' });
  },
  resume: () => {
    const s = get();
    if (s.status === 'paused') set({ status: 'running' });
  },
  commit: (input, expectedCode, typedCode = null) => {
    const { update, error } = computeCharApply(get(), input, expectedCode, typedCode);
    if (update !== null) set(update);
    return error;
  },
  commitChars: (text, lookup) => {
    const chars = splitCommitText(text);
    if (chars.length === 0) return [];
    const errors: CharError[] = [];
    for (const ch of chars) {
      const s = get();
      if (s.status !== 'running') break;
      const expected = s.position < s.targetText.length ? (s.targetText[s.position] ?? '') : '';
      const { update, error } = computeCharApply(
        s,
        ch,
        lookup.expectedCode(expected),
        lookup.typedCode(ch),
      );
      if (error !== null) errors.push(error);
      if (update === null) break;
      set(update);
    }
    return errors;
  },
  undo: () => {
    const s = get();
    if (s.position === 0) return;
    set({
      position: s.position - 1,
      typedText: s.typedText.slice(0, -1),
    });
  },
  end: () => {
    const s = get();
    if (s.status === 'running' || s.status === 'paused') {
      set({ status: 'completed', endTime: Date.now() });
    }
  },
  reset: () => set(initialState),
  getResult: () => {
    const s = get();
    const expectedCodes = s.targetText.split('').map(() => '');
    const result = compareTexts(s.targetText, s.typedText, expectedCodes);
    const durationMs = s.endTime && s.startTime ? s.endTime - s.startTime : 0;
    const wpm = calculateWpm(result.correct, durationMs);
    const accuracy = calculateAccuracy(result.correct, result.total);
    return {
      total: result.total,
      correct: result.correct,
      accuracy,
      wpm,
      durationMs,
      errors: s.errors,
    };
  },
}));

export function selectActiveChar(state: PracticeStore): string {
  return state.targetText[state.position] ?? '';
}
