import { useNavigate } from 'react-router-dom';
import { FileText, Gamepad2, CircleDot, Crosshair, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { version } from '../../../package.json';

interface Mode {
  id: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  path: string;
  status: 'available' | 'coming-soon';
}

const MODES: ReadonlyArray<Mode> = [
  {
    id: 'article',
    title: '文章跟打',
    desc: '完整文章段落练习 · 模拟真实场景',
    icon: <FileText className="h-6 w-6" />,
    path: '/article',
    status: 'available',
  },
  {
    id: 'word-invaders',
    title: 'Word Invaders',
    desc: '趣味游戏化单字 / 词组练习',
    icon: <Gamepad2 className="h-6 w-6" />,
    path: '/word-invaders',
    status: 'available',
  },
  {
    id: 'bubble',
    title: 'Bubble',
    desc: '词组专项训练 · 上升气泡',
    icon: <CircleDot className="h-6 w-6" />,
    path: '/bubble',
    status: 'available',
  },
  {
    id: 'key-drill',
    title: 'KeyDrill',
    desc: '基于个人弱键统计的针对性训练',
    icon: <Crosshair className="h-6 w-6" />,
    path: '/key-drill',
    status: 'available',
  },
];

export function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-5xl p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">五笔打字练习</h1>
        <p className="mt-2 text-muted-foreground">选择一种模式开始训练</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODES.map((m) => (
          <Card key={m.id} className="group transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {m.icon}
                </div>
                {m.status === 'coming-soon' && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    Phase 3
                  </span>
                )}
              </div>
              <CardTitle className="mt-3 text-lg">{m.title}</CardTitle>
              <CardDescription>{m.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={m.status === 'available' ? 'default' : 'ghost'}
                size="sm"
                disabled={m.status === 'coming-soon'}
                onClick={() => navigate(m.path)}
                className="w-full"
              >
                {m.status === 'available' ? (
                  <>
                    开始 <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  '即将推出'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>码表规模</CardDescription>
            <CardTitle className="text-2xl">21,586</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">单字 + 62,323 词组</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>核心练习集</CardDescription>
            <CardTitle className="text-2xl">3,500</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">单字 + 7,301 词组</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>当前版本</CardDescription>
            <CardTitle className="text-2xl">v{version}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Phase 3-6 · 4 模式 + Stats 全就绪</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
