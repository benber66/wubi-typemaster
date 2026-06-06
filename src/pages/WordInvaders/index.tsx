import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PixiInvaders } from '@/components/PixiInvaders';
import { useSettings } from '@/stores/settings';
import { useGameSession } from '@/hooks/use-game-session';
import { codeToLetter } from '@/lib/ime/key-utils';
import { getPracticeLookup } from '@/lib/practice/lookup-bridge';
import {
  DEFAULT_INVADER_CONFIG,
  type GameState,
  type Invader,
  type InvaderConfig,
  makeInvader,
  moveInvaders,
  findMatch,
  isExactMatch,
  pickPoolItem,
  noInvadersMatch,
  getAccuracy,
  getWpm,
} from '@/lib/game/word-invaders';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

type PoolEntry = WubiChar | WubiWord;

const initialState: GameState = {
  status: 'idle',
  invaders: [],
  typed: '',
  score: 0,
  destroyed: 0,
  missed: 0,
  totalAttempts: 0,
  correctAttempts: 0,
  startTime: null,
  endTime: null,
  spawnTimer: 0,
  tickMs: 0,
};

function spawnInvader(pool: PoolEntry[], config: InvaderConfig, id: number): Invader | null {
  const item = pickPoolItem(pool);
  if (!item) return null;
  const x = 40 + Math.random() * (config.width - 80);
  return makeInvader(item, x, 0, id);
}

export function WordInvadersPage() {
  const showVirtualKeyboard = useSettings((s) => s.settings.showVirtualKeyboard);
  const config: InvaderConfig = useMemo(() => ({ ...DEFAULT_INVADER_CONFIG, width: 720, height: 480 }), []);
  const [state, setState] = useState<GameState>(initialState);
  const pool = useMemo(() => {
    const lookup = getPracticeLookup();
    const chars = lookup.randomCoreChars(15);
    const words = lookup.randomCoreWords(15, 2);
    return [...chars, ...words] as PoolEntry[];
  }, []);
  const idRef = useRef(1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.status === 'running') inputRef.current?.focus();
  }, [state.status]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => {
      setState((s) => {
        if (s.status !== 'running') return s;
        const deltaMs = 100;
        const { survivors, missed } = moveInvaders(s.invaders, deltaMs, config.fallSpeed, config.height);
        let spawnTimer = s.spawnTimer + deltaMs;
        const newInvaders = [...survivors];
        if (spawnTimer >= config.spawnIntervalMs && newInvaders.length < config.maxOnScreen) {
          const inv = spawnInvader(pool, config, idRef.current++);
          if (inv) newInvaders.push(inv);
          spawnTimer = 0;
        }
        return {
          ...s,
          invaders: newInvaders,
          missed: s.missed + missed,
          spawnTimer,
          tickMs: s.tickMs + deltaMs,
          status: missed > 0 && (s.missed + missed) >= 10 ? 'gameover' : s.status,
          endTime: missed > 0 && (s.missed + missed) >= 10 ? Date.now() : s.endTime,
        };
      });
    }, 100);
    return () => clearInterval(id);
  }, [state.status, config, pool]);

  const handleStart = () => {
    idRef.current = 1;
    setState({ ...initialState, status: 'running', startTime: Date.now() });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (state.status !== 'running') return;
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
    // Use e.code so letter keys still register while Wubi IME is composing.
    // During IME composition, e.key === 'Process' on Windows but e.code stays 'KeyT', etc.
    const letter = codeToLetter(e.code) ?? e.key.toLowerCase();
    if (!letter || letter.length !== 1 || !/[a-z]/.test(letter)) return;
    e.preventDefault();
    const ch = letter;
    setState((s) => {
      if (s.status !== 'running') return s;
      const next = s.typed + ch;
      const match = findMatch(s.invaders, next);
      const totalAttempts = s.totalAttempts + 1;
      let correctAttempts = s.correctAttempts;
      let invaders = s.invaders;
      let score = s.score;
      let destroyed = s.destroyed;
      let typed = next;
      if (match && isExactMatch(match, next)) {
        correctAttempts += 1;
        score += match.text.length * 10;
        destroyed += 1;
        invaders = s.invaders.filter((inv) => inv.id !== match.id);
        typed = '';
      } else if (noInvadersMatch(s.invaders, next)) {
        typed = '';
      }
      return { ...s, typed, invaders, score, destroyed, totalAttempts, correctAttempts };
    });
  };

  const handleCompositionEnd = () => {
    // Reset typed buffer when IME commits a word so the next letter is fresh.
    setState((s) => (s.typed === '' ? s : { ...s, typed: '' }));
  };

  const accuracy = getAccuracy(state.correctAttempts, state.totalAttempts);
  const durationMs = state.endTime && state.startTime ? state.endTime - state.startTime : Date.now() - (state.startTime ?? Date.now());
  const wpm = getWpm(state.destroyed, durationMs);

  const { savedId, saveError } = useGameSession({
    enabled: state.status === 'gameover',
    mode: 'word-invaders',
    startedAt: state.startTime,
    endedAt: state.endTime,
    durationMs,
    totalChars: state.destroyed,
    correctChars: state.correctAttempts,
    wpm,
    accuracy,
    textSource: 'word-invaders',
    errors: [],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-8">
      <header>
        <h1 className="text-3xl font-bold">Word Invaders</h1>
        <p className="mt-1 text-muted-foreground">五笔码打单词/字，击落入侵者 · 漏 10 个结束</p>
      </header>

      {state.status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>玩法</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>单字/词组从顶部下落，输入对应五笔码</li>
              <li>前缀匹配高亮蓝色，完全匹配后击落（+10/字）</li>
              <li>漏 10 个 → Game Over</li>
            </ul>
            <Button onClick={handleStart} size="lg" className="w-full">开始游戏</Button>
          </CardContent>
        </Card>
      )}

      {state.status !== 'idle' && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">得分</div>
                <div className="text-lg font-semibold">{state.score}</div>
              </div>
              <div>
                <div className="text-muted-foreground">击落</div>
                <div className="text-lg font-semibold">{state.destroyed}</div>
              </div>
              <div>
                <div className="text-muted-foreground">漏掉</div>
                <div className="text-lg font-semibold text-destructive">{state.missed} / 10</div>
              </div>
              <div>
                <div className="text-muted-foreground">WPM</div>
                <div className="text-lg font-semibold">{wpm}</div>
              </div>
            </div>
            <PixiInvaders
              width={config.width}
              height={config.height}
              invaders={state.invaders}
              typed={state.typed}
              score={state.score}
              destroyed={state.destroyed}
            />
            <input
              ref={inputRef}
              value={state.typed}
              onKeyDown={handleKey}
              onCompositionEnd={handleCompositionEnd}
              onChange={() => undefined}
              readOnly
              className="w-full rounded-md border bg-card px-3 py-2 font-mono text-lg tracking-widest"
              placeholder="在此输入五笔码..."
              autoFocus
              aria-label="五笔码输入"
            />
            {showVirtualKeyboard && state.typed && (
              <div className="text-xs text-muted-foreground">
                正在输入: <span className="font-mono font-semibold text-foreground">{state.typed}</span>
              </div>
            )}
            {state.status === 'paused' && (
              <div className="rounded-md bg-muted p-3 text-center">
                已暂停 · 按 Esc 继续
                <Button onClick={() => setState((s) => ({ ...s, status: 'running' }))} className="ml-3" size="sm">
                  继续
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {state.status === 'gameover' && (
        <Card>
          <CardHeader>
            <CardTitle>Game Over</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">得分</div>
                <div className="text-2xl font-bold">{state.score}</div>
              </div>
              <div>
                <div className="text-muted-foreground">WPM</div>
                <div className="text-2xl font-bold">{wpm}</div>
              </div>
              <div>
                <div className="text-muted-foreground">准确率</div>
                <div className="text-2xl font-bold">{(accuracy * 100).toFixed(1)}%</div>
              </div>
            </div>
            {savedId !== null && (
              <div className="text-xs text-muted-foreground">已保存到历史记录（#{savedId}）</div>
            )}
            {saveError !== null && (
              <div className="text-xs text-destructive">保存失败：{saveError}</div>
            )}
            <Button onClick={handleStart} size="lg" className="w-full">再来一局</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
