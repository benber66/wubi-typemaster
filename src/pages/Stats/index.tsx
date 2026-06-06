import { useEffect, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PracticeSessionRecord, SessionSummary } from '@/types/electron';

type SessionMode = PracticeSessionRecord['mode'];
type ModeFilter = SessionMode | 'all';

interface StatsApi {
  list: (mode?: SessionMode, limit?: number) => Promise<PracticeSessionRecord[]>;
  summary: (mode?: SessionMode) => Promise<SessionSummary>;
  delete: (id: number) => Promise<boolean>;
}

function getApi(): StatsApi | null {
  if (typeof window === 'undefined' || !window.api) return null;
  return window.api.sessions as StatsApi;
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <p>{message}</p>
        <p className="mt-2 text-xs">完成一次 Article 或 Word Invaders 练习后会自动出现统计。</p>
      </CardContent>
    </Card>
  );
}

export function StatsPage() {
  const api = getApi();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [sessions, setSessions] = useState<PracticeSessionRecord[]>([]);
  const [mode, setMode] = useState<ModeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (): Promise<void> => {
    if (!api) {
      setError('IPC 不可用 · 请在 Electron 桌面应用中打开');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [s, list] = await Promise.all([
        api.summary(mode === 'all' ? undefined : mode),
        api.list(mode === 'all' ? undefined : mode, 50),
      ]);
      setSummary(s);
      setSessions(list);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, api]);

  const chartData = useMemo(
    () =>
      [...sessions]
        .reverse()
        .map((s, idx) => ({
          idx: idx + 1,
          wpm: s.wpm,
          accuracy: Number((s.accuracy * 100).toFixed(1)),
          time: formatTimestamp(s.startedAt),
        })),
    [sessions],
  );

  const errorDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const key = formatTimestamp(s.startedAt);
      const errors = Math.max(0, s.totalChars - s.correctChars);
      map.set(key, (map.get(key) ?? 0) + errors);
    }
    return Array.from(map.entries()).map(([time, errors]) => ({ time, errors }));
  }, [sessions]);

  const handleDelete = async (id: number): Promise<void> => {
    if (!api) return;
    await api.delete(id);
    void load();
  };

  if (!api) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <header>
          <h1 className="text-3xl font-bold">统计</h1>
          <p className="mt-1 text-muted-foreground">练习历史与趋势分析</p>
        </header>
        <EmptyState message={error ?? 'IPC 不可用'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">统计</h1>
          <p className="mt-1 text-muted-foreground">练习历史 · WPM 趋势 · 错字分布</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'article', 'word-invaders', 'bubble', 'key-drill'] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? 'default' : 'outline'}
              onClick={() => setMode(m)}
            >
              {m === 'all' ? '全部' : m}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => void load()}>
            刷新
          </Button>
        </div>
      </header>

      {loading && <p className="text-sm text-muted-foreground">加载中...</p>}
      {error && <p className="text-sm text-destructive">错误：{error}</p>}

      {summary && summary.count > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总练习</CardDescription>
              <CardTitle className="text-2xl">{summary.count}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>平均 WPM</CardDescription>
              <CardTitle className="text-2xl">{summary.avgWpm}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>最佳 WPM</CardDescription>
              <CardTitle className="text-2xl text-primary">{summary.bestWpm}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总字数</CardDescription>
              <CardTitle className="text-2xl">{summary.totalChars.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>平均准确率</CardDescription>
              <CardTitle className="text-2xl">{(summary.avgAccuracy * 100).toFixed(1)}%</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总错字</CardDescription>
              <CardTitle className="text-2xl text-destructive">{summary.totalErrors}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总用时</CardDescription>
              <CardTitle className="text-2xl">
                {Math.round(summary.totalDurationMs / 60000)} 分钟
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>WPM 趋势</CardTitle>
            <CardDescription>按练习时间顺序</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="idx" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    const p = payload[0]?.payload as { wpm: number; accuracy: number; time: string };
                    return (
                      <div className="rounded border bg-card p-2 text-xs shadow">
                        <div>{p.time}</div>
                        <div>WPM: {p.wpm}</div>
                        <div>准确率: {p.accuracy}%</div>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="wpm" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {errorDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>错字分布</CardTitle>
            <CardDescription>每场练习的错字数</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={errorDistribution}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="errors" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 && !loading && (
        <EmptyState message="还没有练习记录" />
      )}

      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近 50 场练习</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3">时间</th>
                    <th className="pb-2 pr-3">模式</th>
                    <th className="pb-2 pr-3 text-right">字数</th>
                    <th className="pb-2 pr-3 text-right">用时</th>
                    <th className="pb-2 pr-3 text-right">WPM</th>
                    <th className="pb-2 pr-3 text-right">准确率</th>
                    <th className="pb-2 pr-3 text-right">错字</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-mono text-xs">{formatTimestamp(s.startedAt)}</td>
                      <td className="py-2 pr-3">{s.mode}</td>
                      <td className="py-2 pr-3 text-right">{s.totalChars}</td>
                      <td className="py-2 pr-3 text-right">{(s.durationMs / 1000).toFixed(1)}s</td>
                      <td className="py-2 pr-3 text-right font-semibold">{s.wpm}</td>
                      <td className="py-2 pr-3 text-right">{(s.accuracy * 100).toFixed(1)}%</td>
                      <td className="py-2 pr-3 text-right text-destructive">{s.totalChars - s.correctChars}</td>
                      <td className="py-2 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleDelete(s.id)}
                          aria-label="删除"
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
