import { cn } from '@/lib/utils';
import { WUBI_86_LAYOUT, type WubiKey } from './layout';

export interface VirtualKeyboardProps {
  pressedKeys?: ReadonlyArray<string>;
  showHands?: boolean;
  className?: string;
}

function KeyboardKey({
  wk,
  pressed,
  showHand,
}: {
  wk: WubiKey;
  pressed: boolean;
  showHand: boolean;
}) {
  return (
    <div
      className={cn(
        'flex h-14 min-w-[2.5rem] flex-col items-center justify-center rounded-md border-2 px-1 text-xs transition-all',
        pressed
          ? 'scale-95 border-primary bg-primary text-primary-foreground shadow-md'
          : 'border-border bg-card text-foreground hover:bg-accent',
        showHand && wk.hand === 'left' && !pressed && 'border-l-blue-400/60',
        showHand && wk.hand === 'right' && !pressed && 'border-r-orange-400/60',
      )}
    >
      <span className="text-sm font-semibold leading-none uppercase">{wk.key}</span>
      <div className="mt-0.5 flex flex-wrap items-center justify-center gap-0.5">
        {wk.roots.slice(0, 2).map((r) => (
          <span key={r} className="font-mono text-[10px] leading-none opacity-80">
            {r}
          </span>
        ))}
        {wk.roots.length > 2 && <span className="text-[9px] leading-none opacity-50">…</span>}
      </div>
    </div>
  );
}

export function VirtualKeyboard({
  pressedKeys = [],
  showHands = true,
  className,
}: VirtualKeyboardProps) {
  const pressedSet = new Set(pressedKeys.map((k) => k.toLowerCase()));

  return (
    <div
      className={cn('flex select-none flex-col items-center gap-1.5', className)}
      role="group"
      aria-label="五笔 86 虚拟键盘"
    >
      {WUBI_86_LAYOUT.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1.5" style={{ paddingLeft: `${rowIdx * 1.25}rem` }}>
          {row.map((wk) => (
            <KeyboardKey
              key={wk.key}
              wk={wk}
              pressed={pressedSet.has(wk.key)}
              showHand={showHands}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
