import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameSession } from '@/hooks/use-game-session';
import { codeToLetter } from '@/lib/ime/key-utils';
import { getPracticeLookup } from '@/lib/practice/lookup-bridge';
import {
  INITIAL_DRILL_STATE,
  filterByKey,
  pickDrillQueue,
  applyTyped,
  getAccuracy,
  getWpm,
  summarizeKeyStats,
  type DrillItem,
} from '@/lib/game/key-drill';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

export function KeyDrillPage() {
  const [targetKeyCount, setTargetKeyCount] = useState(3);
  const [queueSize, setQueueSize] = useState(20);
  const [state, setState] = useState<typeof INITIAL_DRILL_STATE>(INITIAL_DRILL_STATE);
  const [weakKeys, setWeakKeys] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef(state.status);
  statusRef.current = state.status;

  const handleStart = (): void => {
    const lookup = getPracticeLookup();
    const chars = lookup.randomCoreChars(30);
    const words = lookup.randomCoreWords(20, 2);
    const pool: Array<WubiChar | WubiWord> = [...chars, ...words];
    const allKeys = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const picked: string[] = [];
    for (let i = 0; i < targetKeyCount; i++) {
      picked.push(allKeys[(Date.now() + i * 7) % 26]!);
    }
    setWeakKeys(picked);
    const candidates = filterByKey(pool, picked);
    const queue = pickDrillQueue(candidates, queueSize);
    setState({
      ...INITIAL_DRILL_STATE,
      status: 'running',
      queue,
      startTime: Date.now(),
    });
  };

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (statusRef.current !== 'running') return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        setState((s) => ({ ...s, typed: s.typed.slice(0, -1) }));
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setState((s) => ({ ...s, status: 'paused' }));
        return;
      }
      const letter = codeToLetter(e.code) ?? e.key.toLowerCase();
      if (!letter || letter.length !== 1 || !/[a-z]/.test(letter)) return;
      e.preventDefault();
      const ch = letter;
      setState((s) => {
        const prevLen = s.typed.length;
        const next = applyTyped(s, ch).next;
        // If typed was reset (error), trigger shake feedback
        if (next.typed.length < prevLen + 1) {
          setShake(false);
          requestAnimationFrame(() => setShake(true));
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (state.status === 'running') inputRef.current?.focus();
  }, [state.status]);

  const accuracy = getAccuracy(state.correctKeystrokes, state.totalKeystrokes);
  const durationMs = state.endTime && state.startTime ? state.endTime - state.startTime : 0;
  const wpm = getWpm(state.correctKeystrokes, durationMs);
  const keyStats = summarizeKeyStats(state);
  const currentItem: DrillItem | null = state.queue[state.position] ?? null;

  const { savedId, saveError } = useGameSession({
    enabled: state.status === 'completed',
    mode: 'key-drill',
    startedAt: state.startTime,
    endedAt: state.endTime,
    durationMs,
    totalChars: state.queue.length,
    correctChars: state.correctKeystrokes,
    wpm,
    accuracy,
    textSource: weakKeys.join(''),
    configJson: JSON.stringify({ weakKeys, queueSize }),
    errors: [],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-8">
      <header>
        <h1 className="text-3xl font-bold">KeyDrill</h1>
        <p className="mt-1 text-muted-foreground">基于个人弱键统计的针对性训练</p>
      </header>

      {state.status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>配置</CardTitle>
            <CardDescription>选择弱键数量和训练长度</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">目标弱键数：{targetKeyCount}</label>
              <input
                type="range"
                min={1}
                max={8}
                value={targetKeyCount}
                onChange={(e) => setTargetKeyCount(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">训练字数：{queueSize}</label>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={queueSize}
                onChange={(e) => setQueueSize(parseInt(e.target.value, 10))}
                className="w-full"
              />
            </div>
            <Button onClick={handleStart} size="lg" className="w-full">
              开始训练
            </Button>
          </CardContent>
        </Card>
      )}

      {state.status !== 'idle' && (
        <Card>
          <CardContent className="space-y-4 py-6">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">进度</div>
                <div className="text-lg font-semibold">
                  {state.position} / {state.queue.length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">WPM</div>
                <div className="text-lg font-semibold">{wpm}</div>
              </div>
              <div>
                <div className="text-muted-foreground">按键准确率</div>
                <div className="text-lg font-semibold">{(accuracy * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">弱键</div>
                <div className="font-mono text-sm">{weakKeys.join(' ')}</div>
              </div>
            </div>
            {currentItem && (
              <div className="rounded-md border bg-card p-6 text-center">
                <div className="text-[10px] uppercase text-muted-foreground">目标</div>
                <div className="text-4xl font-bold">{currentItem.text}</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  码长 {currentItem.code.length} · 弱键 {weakKeys.filter((k) => currentItem.code.includes(k)).join(' ')}
                </div>
                <div className={`mt-3 font-mono text-lg tracking-widest transition-all ${shake ? 'animate-shake' : ''}`}>
                  {currentItem.code.split('').map((c, i) => (
                    <span
                      key={i}
                      className={
                        state.typed[i] === c
                          ? 'text-primary'
                          : state.typed[i]
                            ? 'text-destructive'
                            : 'text-muted-foreground'
                      }
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <input
              ref={inputRef}
              value={state.typed}
              onKeyDown={handleKey}
              onChange={() => undefined}
              readOnly
              className="w-full rounded-md border bg-card px-3 py-2 font-mono text-lg tracking-widest"
              autoFocus
              aria-label="五笔码输入"
            />
            {state.status === 'paused' && (
              <div className="rounded-md bg-muted p-3 text-center">
                已暂停
                <Button onClick={() => setState((s) => ({ ...s, status: 'running' }))} className="ml-3" size="sm">
                  继续
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setState(INITIAL_DRILL_STATE)} size="sm">
                重新开始
              </Button>
            </div>
            {keyStats.length > 0 && (
              <div className="rounded-md border bg-muted/30 p-3 text-xs">
                <div className="mb-1 font-medium">本次按键统计：</div>
                <div className="grid grid-cols-3 gap-1 sm:grid-cols-6">
                  {keyStats.slice(0, 12).map((k) => (
                    <div key={k.key} className="flex items-center justify-between rounded bg-card px-2 py-1 font-mono">
                      <span className="font-semibold">{k.key}</span>
                      <span className={k.errorRate > 0.3 ? 'text-destructive' : 'text-muted-foreground'}>
                        {k.errors}/{k.totalPresses}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-[10px] text-muted-foreground">
              当前目标：{currentItem?.text ?? '—'} · 码 {currentItem?.code ?? '—'}
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>训练完成</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">WPM</div>
                <div className="text-2xl font-bold">{wpm}</div>
              </div>
              <div>
                <div className="text-muted-foreground">按键准确率</div>
                <div className="text-2xl font-bold">{(accuracy * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">用时</div>
                <div className="text-2xl font-bold">{(durationMs / 1000).toFixed(1)}s</div>
              </div>
            </div>
            {keyStats.length > 0 && (
              <div className="text-xs">
                <div className="mb-1 font-medium">弱键 Top 5：</div>
                <div className="flex flex-wrap gap-2">
                  {keyStats.slice(0, 5).map((k) => (
                    <span key={k.key} className="rounded bg-destructive/10 px-2 py-1 font-mono">
                      {k.key}: {(k.errorRate * 100).toFixed(0)}% ({k.errors}/{k.totalPresses})
                    </span>
                  ))}
                </div>
              </div>
            )}
            {savedId !== null && (
              <div className="text-xs text-muted-foreground">已保存到历史记录（#{savedId}）</div>
            )}
            {saveError !== null && (
              <div className="text-xs text-destructive">保存失败：{saveError}</div>
            )}
            <Button onClick={() => setState(INITIAL_DRILL_STATE)} size="lg" className="w-full">
              再来一组
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
