import { useSettings } from '@/stores/settings';
import type { WubiChar, WubiWord } from '@/lib/wubi/lookup';

export interface CodeHintProps {
  expectedChar: string | null;
  expectedCode: string | null;
  wordSuggestions?: ReadonlyArray<WubiWord>;
  onDismiss?: () => void;
}

function CharHint({ char, code }: { char: string; code: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-destructive/50 bg-destructive/5 p-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-card text-2xl font-bold shadow-sm">
        {char}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] uppercase text-muted-foreground">五笔码</span>
        <span className="font-mono text-xl font-bold tracking-widest text-foreground">
          {code || '?'}
        </span>
      </div>
    </div>
  );
}

function WordHint({ word }: { word: WubiWord }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1 text-xs">
      <span className="font-medium">{word.word}</span>
      <span className="font-mono text-muted-foreground">{word.code}</span>
    </div>
  );
}

export function CodeHint({
  expectedChar,
  expectedCode,
  wordSuggestions = [],
  onDismiss,
}: CodeHintProps) {
  const showVirtualKeyboard = useSettings((s) => s.settings.showVirtualKeyboard);

  if (expectedChar === null || expectedCode === null) {
    return null;
  }

  return (
    <div className="pointer-events-auto rounded-lg border-2 border-destructive/60 bg-background p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-destructive">错字提示</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="关闭"
          >
            ×
          </button>
        )}
      </div>
      <CharHint char={expectedChar} code={expectedCode} />
      {wordSuggestions.length > 0 && (
        <div className="mt-2">
          <div className="mb-1 text-[10px] uppercase text-muted-foreground">相关词组</div>
          <div className="flex flex-wrap gap-1">
            {wordSuggestions.slice(0, 4).map((w) => (
              <WordHint key={w.word} word={w} />
            ))}
          </div>
        </div>
      )}
      {showVirtualKeyboard && (
        <div className="mt-2 text-[10px] text-muted-foreground">
          按{' '}
          <span className="font-mono font-semibold">
            {expectedCode.toUpperCase().split('').join(' ')}
          </span>{' '}
          输入
        </div>
      )}
    </div>
  );
}

export function buildWordSuggestions(
  char: string | null,
  words: ReadonlyArray<WubiWord>,
): WubiWord[] {
  if (char === null) return [];
  return words.filter((w) => w.word.includes(char)).slice(0, 4);
}

export function getCodeForChar(char: string | null, chars: ReadonlyArray<WubiChar>): string | null {
  if (char === null) return null;
  return chars.find((c) => c.char === char)?.code ?? null;
}
