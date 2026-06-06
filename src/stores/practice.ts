import { create } from 'zustand';
import { compareTexts, calculateWpm, calculateAccuracy, type CharError } from '@/lib/typing/metrics';
import { buildCharError, handleCommit } from '@/lib/ime/input-handler';

export type PracticeStatus = 'idle' | 'running' | 'paused' | 'completed';

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
    const s = get();
    if (s.status !== 'running') return null;
    if (s.position >= s.targetText.length) return null;

    const expected = s.targetText[s.position] ?? '';
    const event = handleCommit(input, expected, s.position);
    if (event === null) return null;

    const newTyped = s.typedText + event.typed;
    let newErrors = s.errors;
    if (event.typed !== event.expected) {
      newErrors = [
        ...s.errors,
        buildCharError(s.position, event.expected, event.typed, expectedCode, typedCode),
      ];
    }
    const newPosition = s.position + 1;
    const completed = newPosition >= s.targetText.length;
    set({
      typedText: newTyped,
      position: newPosition,
      errors: newErrors,
      status: completed ? 'completed' : s.status,
      endTime: completed ? Date.now() : s.endTime,
    });
    return event.typed === event.expected ? null : newErrors[newErrors.length - 1]!;
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
