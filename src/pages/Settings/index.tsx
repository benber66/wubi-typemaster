import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useSettings } from '@/stores/settings';
import { ACCENT_PRESETS } from '@/components/ThemeProvider';

export function SettingsPage() {
  const settings = useSettings((s) => s.settings);
  const setTheme = useSettings((s) => s.setTheme);
  const setAccentColor = useSettings((s) => s.setAccentColor);
  const setShowVirtualKeyboard = useSettings((s) => s.setShowVirtualKeyboard);
  const setSoundEnabled = useSettings((s) => s.setSoundEnabled);
  const setSoundVolume = useSettings((s) => s.setSoundVolume);

  return (
    <div className="mx-auto max-w-2xl p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="mt-1 text-muted-foreground">主题、键位显示与音效偏好</p>
      </header>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>主题</CardTitle>
            <CardDescription>Light / Dark / 跟随系统</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="theme-select">外观</Label>
              <Select
                value={settings.theme}
                onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}
              >
                <SelectTrigger id="theme-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色 (Light)</SelectItem>
                  <SelectItem value="dark">深色 (Dark)</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>强调色</Label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setAccentColor(p.value)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      settings.accentColor.toLowerCase() === p.value.toLowerCase()
                        ? 'border-foreground ring-2 ring-ring ring-offset-2'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: p.value }}
                    aria-label={p.name}
                    title={p.name}
                  />
                ))}
                <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 text-xs hover:bg-accent">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
                  />
                  自定义
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>虚拟键盘</CardTitle>
            <CardDescription>显示五笔字根键盘（默认对进阶者隐藏）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-keyboard">练习时显示虚拟键盘</Label>
              <Switch
                id="show-keyboard"
                checked={settings.showVirtualKeyboard}
                onCheckedChange={setShowVirtualKeyboard}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>音效</CardTitle>
            <CardDescription>键入音、错误音、游戏背景音（默认关）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled">启用音效</Label>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="sound-volume">音量</Label>
                <span className="text-xs text-muted-foreground">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
              <Slider
                id="sound-volume"
                min={0}
                max={1}
                step={0.05}
                value={[settings.soundVolume]}
                onValueChange={(v) => setSoundVolume(v[0] ?? 0.5)}
                disabled={!settings.soundEnabled}
              />
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          设置自动写入 localStorage（重启后保留）；Phase 3+ 将同步到 SQLite。
        </p>
      </div>
    </div>
  );
}
