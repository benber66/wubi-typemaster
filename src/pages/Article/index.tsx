import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { CodeHint } from '@/components/CodeHint';
import { usePractice } from '@/stores/practice';
import { useSettings } from '@/stores/settings';
import { SAMPLE_TEXTS, getRandomSampleText } from '@/lib/practice/sample-texts';
import { isFinalCommit, extractCommitText } from '@/lib/ime/input-handler';
import { getCharCode, getWordSuggestions } from '@/lib/practice/lookup-bridge';
import { findKeyByChar } from '@/components/VirtualKeyboard/layout';

function findWubiEntriesForChar(
  char: string | null,
): { code: string | null; words: ReturnType<typeof getWordSuggestions> } {
  return {
    code: getCharCode(char),
    words: getWordSuggestions(char),
  };
}

function ReadingText({ target, position }: { target: string; typed: string; position: number }) {
  return (
    <div className="font-mono text-2xl leading-loose tracking-wide">
      {target.split('').map((ch, i) => {
        let className = 'transition-colors';
        if (i < position) {
          className += ' text-foreground';
        } else if (i === position) {
          className += ' border-b-2 border-primary text-foreground';
        } else {
          className += ' text-muted-foreground/50';
        }
        return (
          <span key={i} className={className}>
            {ch}
          </span>
        );
      })}
    </div>
  );
}

function StatsBar({ wpm, accuracy, position, total, duration }: { wpm: number; accuracy: number; position: number; total: number; duration: number }) {
  return (
    <div className="grid grid-cols-4 gap-3 text-sm">
      <div>
        <div className="text-muted-foreground">进度</div>
        <div className="text-lg font-semibold">
          {position} / {total}
        </div>
      </div>
      <div>
        <div className="text-muted-foreground">WPM</div>
        <div className="text-lg font-semibold">{wpm}</div>
      </div>
      <div>
        <div className="text-muted-foreground">准确率</div>
        <div className="text-lg font-semibold">{(accuracy * 100).toFixed(1)}%</div>
      </div>
      <div>
        <div className="text-muted-foreground">用时</div>
        <div className="text-lg font-semibold">{(duration / 1000).toFixed(1)}s</div>
      </div>
    </div>
  );
}

export function ArticlePage() {
  const showVirtualKeyboard = useSettings((s) => s.settings.showVirtualKeyboard);
  const status = usePractice((s) => s.status);
  const targetText = usePractice((s) => s.targetText);
  const position = usePractice((s) => s.position);
  const errors = usePractice((s) => s.errors);
  const textId = usePractice((s) => s.textId);
  const start = usePractice((s) => s.start);
  const commitChars = usePractice((s) => s.commitChars);
  const reset = usePractice((s) => s.reset);
  const getResult = usePractice((s) => s.getResult);

  const [selectedTextId, setSelectedTextId] = useState<string>(SAMPLE_TEXTS[0]?.id ?? '');
  const [elapsed, setElapsed] = useState(0);
  const [hintChar, setHintChar] = useState<string | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const isComposingRef = useRef<boolean>(false);
  const [typedPrefix, setTypedPrefix] = useState<string>('');

  // Persist session to DB on completion
  const persistSession = useCallback(async () => {
    if (status !== 'completed') return;
    if (savedSessionId !== null) return;
    if (typeof window === 'undefined' || !window.api) return;
    const result = getResult();
    if (result.total === 0) return;
    try {
      const id = await window.api.sessions.insert(
        {
          mode: 'article',
          startedAt: startTimeRef.current ?? Date.now() - result.durationMs,
          endedAt: Date.now(),
          durationMs: result.durationMs,
          totalChars: result.total,
          correctChars: result.correct,
          wpm: result.wpm,
          accuracy: result.accuracy,
          textSource: textId,
          configJson: null,
        },
        result.errors.map((e) => ({
          position: e.position,
          expected: e.expected,
          typed: e.typed,
          expectedCode: e.expectedCode,
          typedCode: e.typedCode,
        })),
      );
      setSavedSessionId(id);
      setSaveError(null);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  }, [status, savedSessionId, getResult, textId]);

  useEffect(() => {
    if (status === 'completed') {
      void persistSession();
    }
  }, [status, persistSession]);

  // Tick timer while running
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(id);
  }, [status]);

  // Auto-focus input
  useEffect(() => {
    if (status === 'running') inputRef.current?.focus();
  }, [status]);

  // Reset elapsed on start
  useEffect(() => {
    if (status === 'running') {
      setElapsed(0);
      setSavedSessionId(null);
      setSaveError(null);
      startTimeRef.current = Date.now();
    }
  }, [status, targetText]);

  // Reset typed prefix when active char changes
  useEffect(() => {
    setTypedPrefix('');
    isComposingRef.current = false;
  }, [position, status]);

  const activeChar = usePractice((s) => s.targetText[s.position] ?? null);
  const activeEntry = useMemo(() => findWubiEntriesForChar(activeChar), [activeChar]);
  const pressedKeys = useMemo(() => {
    if (!activeEntry.code) return [];
    const prefix = typedPrefix.length > 0 ? typedPrefix : activeEntry.code[0] ?? '';
    return activeEntry.code.slice(0, prefix.length).split('');
  }, [activeEntry.code, typedPrefix]);

  const handleStart = () => {
    const t = SAMPLE_TEXTS.find((x) => x.id === selectedTextId) ?? getRandomSampleText();
    setSelectedTextId(t.id);
    start(t.content, t.id);
  };

  const handleReset = () => {
    reset();
    setHintChar(null);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    if (status !== 'running') return;
    if (!isFinalCommit(e.nativeEvent)) return;
    const text = extractCommitText(e.nativeEvent);
    if (!text) return;
    const errs = commitChars(text, {
      expectedCode: (ch) => getCharCode(ch) ?? '',
      typedCode: (ch) => getCharCode(ch),
    });
    if (errs.length > 0) {
      const last = errs[errs.length - 1]!;
      setHintChar(last.expected);
    } else {
      setHintChar(null);
    }
    if (!isComposingRef.current && inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.data) {
      isComposingRef.current = true;
      setTypedPrefix(e.nativeEvent.data);
    }
  };

  const result = status === 'completed' ? getResult() : null;
  const activeErrorChar = hintChar;
  const activeErrorCode = hintChar ? getCharCode(hintChar) : null;
  const activeErrorWords = hintChar ? getWordSuggestions(hintChar) : [];

  const liveWpm = useMemo(() => {
    const minutes = Math.max(elapsed / 60_000, 1 / 60_000);
    return Number((position / 5 / minutes).toFixed(2));
  }, [position, elapsed]);
  const liveAccuracy = useMemo(() => {
    if (position === 0) return 1;
    return Number(((position - errors.length) / position).toFixed(4));
  }, [position, errors.length]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <header>
        <h1 className="text-3xl font-bold">文章跟打</h1>
        <p className="mt-1 text-muted-foreground">
          选择文本 · 用五笔输入 · 错字弹码提示
        </p>
      </header>

      {status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>选择练习文本</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SAMPLE_TEXTS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTextId(t.id)}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    selectedTextId === t.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <div className="font-medium">{t.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.content}</div>
                </button>
              ))}
            </div>
            <Button onClick={handleStart} className="w-full" size="lg">
              开始练习
            </Button>
          </CardContent>
        </Card>
      )}

      {status !== 'idle' && (
        <Card>
          <CardContent className="space-y-4 py-6">
            <StatsBar
              wpm={status === 'completed' ? getResult().wpm : liveWpm}
              accuracy={status === 'completed' ? getResult().accuracy : liveAccuracy}
              position={position}
              total={targetText.length}
              duration={elapsed}
            />
            <div className="border-t pt-4">
              <ReadingText target={targetText} typed="" position={position} />
            </div>
            <textarea
              ref={inputRef}
              onCompositionStart={handleCompositionStart}
              onCompositionUpdate={handleCompositionUpdate}
              onCompositionEnd={handleCompositionEnd}
              className="sr-only"
              autoFocus
              aria-label="五笔输入"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                目标字: <span className="font-mono font-semibold">{activeChar || '—'}</span>
                {activeEntry.code && (
                  <span className="ml-2">
                    编码: <span className="font-mono">{activeEntry.code}</span>
                  </span>
                )}
              </span>
              {hintChar && activeErrorChar && (
                <span className="text-destructive">上次错字: {activeErrorChar}</span>
              )}
            </div>
            {showVirtualKeyboard && (
              <div className="rounded-md border bg-muted/30 p-4">
                <VirtualKeyboard pressedKeys={pressedKeys} showHands />
              </div>
            )}
            {activeErrorChar && activeErrorCode && status === 'running' && (
              <CodeHint
                expectedChar={activeErrorChar}
                expectedCode={activeErrorCode}
                wordSuggestions={activeErrorWords}
                onDismiss={() => setHintChar(null)}
              />
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} size="sm">
                重新开始
              </Button>
              {status === 'running' && (
                <Button variant="ghost" onClick={usePractice.getState().end} size="sm">
                  结束练习
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {status === 'completed' && result && (
        <Card>
          <CardHeader>
            <CardTitle>练习完成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">用时</div>
                <div className="text-2xl font-bold">{(result.durationMs / 1000).toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">WPM</div>
                <div className="text-2xl font-bold">{result.wpm}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">准确率</div>
                <div className="text-2xl font-bold">{(result.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">错字</div>
                <div className="text-2xl font-bold text-destructive">{result.errors.length}</div>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3 space-y-1 text-xs">
                <div className="font-medium">错字明细（前 10 个）：</div>
                {result.errors.slice(0, 10).map((e, i) => (
                  <div key={i} className="flex gap-3 rounded border bg-muted/40 px-2 py-1">
                    <span className="text-muted-foreground">位置 {e.position + 1}</span>
                    <span>期望 <span className="font-mono">{e.expected}</span> ({e.expectedCode})</span>
                    <span>输入 <span className="font-mono text-destructive">{e.typed}</span> ({e.typedCode ?? '—'})</span>
                  </div>
                ))}
              </div>
            )}
            {savedSessionId !== null && (
              <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-700 dark:text-green-300">
                ✓ 已保存到历史记录（#{savedSessionId}）
              </div>
            )}
            {saveError !== null && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                保存失败：{saveError}
              </div>
            )}
            <Button onClick={handleReset} className="w-full" size="lg">
              练习下一段
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { findKeyByChar };
