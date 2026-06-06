import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderProps {
  title: string;
  phase: string;
  desc: string;
}

function Placeholder({ title, phase, desc }: PlaceholderProps) {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">即将推出 · {phase}</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>占位页</CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            该页面将在后续 Phase 实现。当前 v0.2.0 仅完成核心 UI 骨架。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ArticlePage() {
  return <Placeholder title="文章跟打" phase="Phase 3" desc="完整文章段落练习 · 模拟真实场景" />;
}

export function WordInvadersPage() {
  return <Placeholder title="Word Invaders" phase="Phase 5" desc="趣味游戏化单字 / 词组练习" />;
}

export function BubblePage() {
  return <Placeholder title="Bubble" phase="Phase 5" desc="词组专项训练 · 上升气泡" />;
}

export function KeyDrillPage() {
  return <Placeholder title="KeyDrill" phase="Phase 5" desc="基于个人弱键统计的针对性训练" />;
}

export function StatsPage() {
  return <Placeholder title="统计" phase="Phase 4" desc="历史记录、趋势图、热力图、错字本" />;
}
