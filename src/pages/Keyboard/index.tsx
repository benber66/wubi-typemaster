import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { useSettings } from '@/stores/settings';

export function KeyboardPage() {
  const showKeyboard = useSettings((s) => s.settings.showVirtualKeyboard);

  return (
    <div className="mx-auto max-w-4xl p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">五笔 86 键盘</h1>
        <p className="mt-1 text-muted-foreground">字根布局参考 · 蓝边=左手 / 橙边=右手</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>键盘布局</CardTitle>
          <CardDescription>
            每键显示主字根（Q 键例外：钅/𠂉/丿）。练习时开启「显示虚拟键盘」可在底部实时高亮按键。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <VirtualKeyboard showHands />
        </CardContent>
      </Card>

      <div className="mt-4 text-center text-xs text-muted-foreground">
        当前设置：虚拟键盘 {showKeyboard ? '已启用' : '已隐藏'}（在设置页调整）
      </div>
    </div>
  );
}
