import { useEffect, useRef, useState } from 'react';
import type { PracticeSessionRecord } from '@/types/electron';
import type { CharError } from '@/lib/typing/metrics';

export interface UseGameSessionArgs {
  enabled: boolean;
  mode: PracticeSessionRecord['mode'];
  startedAt: number | null;
  endedAt: number | null;
  durationMs: number;
  totalChars: number;
  correctChars: number;
  wpm: number;
  accuracy: number;
  textSource?: string | null;
  configJson?: string | null;
  errors: ReadonlyArray<CharError>;
}

export interface UseGameSessionResult {
  savedId: number | null;
  saveError: string | null;
}

export function useGameSession({
  enabled,
  mode,
  startedAt,
  endedAt,
  durationMs,
  totalChars,
  correctChars,
  wpm,
  accuracy,
  textSource,
  configJson,
  errors,
}: UseGameSessionArgs): UseGameSessionResult {
  const [savedId, setSavedId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const persistRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      persistRef.current = false;
      setSavedId(null);
      setSaveError(null);
      return;
    }
    if (persistRef.current) return;
    if (typeof window === 'undefined' || !window.api) return;
    if (startedAt === null) return;
    if (totalChars === 0 && correctChars === 0) return;
    persistRef.current = true;
    const safeErrors = errors.map((e) => ({
      position: e.position,
      expected: e.expected,
      typed: e.typed,
      expectedCode: e.expectedCode,
      typedCode: e.typedCode,
    }));
    window.api.sessions
      .insert(
        {
          mode,
          startedAt,
          endedAt: endedAt ?? Date.now(),
          durationMs,
          totalChars,
          correctChars,
          wpm,
          accuracy,
          textSource: textSource ?? null,
          configJson: configJson ?? null,
        },
        safeErrors,
      )
      .then((id) => {
        setSavedId(id);
        setSaveError(null);
      })
      .catch((err: Error) => {
        setSaveError(err.message);
      });
  }, [
    enabled,
    mode,
    startedAt,
    endedAt,
    durationMs,
    totalChars,
    correctChars,
    wpm,
    accuracy,
    textSource,
    configJson,
    errors,
  ]);

  return { savedId, saveError };
}
