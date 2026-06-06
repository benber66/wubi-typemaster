import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PixiBubbles } from '@/components/PixiBubbles';
import { useGameSession } from '@/hooks/use-game-session';
import { codeToLetter } from '@/lib/ime/key-utils';
import { getPracticeLookup } from '@/lib/practice/lookup-bridge';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';
import {
  type GameStatus,
  type Bubble,
  type BubbleConfig,
  DEFAULT_BUBBLE_CONFIG,
  findBubbleMatch,
  isBubbleExactMatch,
  moveBubbles,
  pickPoolItem,
  noBubblesMatch,
  getAccuracy,
  getWpm,
  makeBubble,
} from '@/lib/game/bubble';

interface GameState {
  status: GameStatus;
  bubbles: Bubble[];
  typed: string;
  score: number;
  popped: number;
  escaped: number;
  totalAttempts: number;
  correctAttempts: number;
  startTime: number | null;
  endTime: number | null;
  spawnTimer: number;
  tickMs: number;
}

const initialState: GameState = {
  status: 'idle',
  bubbles: [],
  typed: '',
  score: 0,
  popped: 0,
  escaped: 0,
  totalAttempts: 0,
  correctAttempts: 0,
  startTime: null,
  endTime: null,
  spawnTimer: 0,
  tickMs: 0,
};

function spawnBubble(pool: Array<WubiChar | WubiWord>, config: BubbleConfig, id: number): Bubble | null {
  const item = pickPoolItem(pool);
  if (!item) return null;
  const x = 60 + Math.random() * (config.width - 120);
  const y = config.height - 20;
  return makeBubble(item, x, y, id);
}

export function BubblePage() {
  const config: BubbleConfig = useMemo(() => ({ ...DEFAULT_BUBBLE_CONFIG, width: 720, height: 480 }), []);
  const pool = useMemo(() => {
    const lookup = getPracticeLookup();
    return lookup.randomCoreWords(20, 2) as Array<WubiChar | WubiWord>;
  }, []);
  const [state, setState] = useState<GameState>(initialState);
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
        const { survivors, escaped } = moveBubbles(s.bubbles, deltaMs, config.riseSpeed);
        let spawnTimer = s.spawnTimer + deltaMs;
        const newBubbles = [...survivors];
        if (spawnTimer >= config.spawnIntervalMs && newBubbles.length < config.maxOnScreen) {
          const b = spawnBubble(pool, config, idRef.current++);
          if (b) newBubbles.push(b);
          spawnTimer = 0;
        }
        return {
          ...s,
          bubbles: newBubbles,
          escaped: s.escaped + escaped,
          spawnTimer,
          tickMs: s.tickMs + deltaMs,
          status: escaped > 0 && (s.escaped + escaped) >= 10 ? 'gameover' : s.status,
          endTime: escaped > 0 && (s.escaped + escaped) >= 10 ? Date.now() : s.endTime,
        };
      });
    }, 100);
    return () => clearInterval(id);
  }, [state.status, config, pool]);

  const handleStart = (): void => {
    idRef.current = 1;
    setState({ ...initialState, status: 'running', startTime: Date.now() });
  };

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
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
      // e.code handles both non-IME a-z and IME-processed letters (where e.key="Process").
      const letter = codeToLetter(e.code) ?? e.key.toLowerCase();
      if (!letter || letter.length !== 1 || !/[a-z]/.test(letter)) return;
      e.preventDefault();
      const ch = letter;
      setState((s) => {
        if (s.status !== 'running') return s;
        const next = s.typed + ch;
        const match = findBubbleMatch(s.bubbles, next);
        const totalAttempts = s.totalAttempts + 1;
        let correctAttempts = s.correctAttempts;
        let bubbles = s.bubbles;
        let score = s.score;
        let popped = s.popped;
        let typed = next;
        if (match && isBubbleExactMatch(match, next)) {
          correctAttempts += 1;
          score += match.text.length * 10;
          popped += 1;
          bubbles = s.bubbles.filter((b) => b.id !== match.id);
          typed = '';
        } else if (noBubblesMatch(s.bubbles, next)) {
          typed = '';
        }
        return { ...s, typed, bubbles, score, popped, totalAttempts, correctAttempts };
      });
    },
    [state.status],
  );

  const handleCompositionEnd = useCallback(() => {
    setState((s) => (s.typed === '' ? s : { ...s, typed: '' }));
  }, []);

  const accuracy = getAccuracy(state.correctAttempts, state.totalAttempts);
  const durationMs =
    state.endTime && state.startTime ? state.endTime - state.startTime : state.tickMs;
  const wpm = getWpm(state.popped, durationMs);

  const { savedId, saveError } = useGameSession({
    enabled: state.status === 'gameover',
    mode: 'bubble',
    startedAt: state.startTime,
    endedAt: state.endTime,
    durationMs,
    totalChars: state.popped,
    correctChars: state.correctAttempts,
    wpm,
    accuracy,
    textSource: 'bubble',
    errors: [],
  });

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-8">
      <header>
        <h1 className="text-3xl font-bold">Bubble</h1>
        <p className="mt-1 text-muted-foreground">从下方升起的气泡，在逃到顶部前打出五笔码 · 漏 10 个结束</p>
      </header>

      {state.status === 'idle' && (
        <Card>
          <CardHeader>
            <CardTitle>玩法</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              <li>2 字词组从底部上升，蓝色高亮前缀匹配</li>
              <li>完全匹配后气泡爆裂（+10/字）</li>
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
                <div className="text-muted-foreground">击破</div>
                <div className="text-lg font-semibold">{state.popped}</div>
              </div>
              <div>
                <div className="text-muted-foreground">逃走</div>
                <div className="text-lg font-semibold text-destructive">{state.escaped} / 10</div>
              </div>
              <div>
                <div className="text-muted-foreground">WPM</div>
                <div className="text-lg font-semibold">{wpm}</div>
              </div>
            </div>
            <PixiBubbles
              width={config.width}
              height={config.height}
              bubbles={state.bubbles}
              typed={state.typed}
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
            {state.status === 'paused' && (
              <div className="rounded-md bg-muted p-3 text-center">
                已暂停
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
