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
          <p className="text-sm text-muted-foreground">该页面将在后续 Phase 实现。</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function StatsPage() {
  return <Placeholder title="统计" phase="Phase 4" desc="历史记录、趋势图、热力图、错字本" />;
}
