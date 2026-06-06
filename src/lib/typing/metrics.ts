export interface KeystrokeEvent {
  char: string;
  expected: string;
  timestamp: number;
  isComposing: boolean;
}

export interface CharError {
  position: number;
  expected: string;
  typed: string;
  expectedCode: string;
  typedCode: string | null;
}

export interface ComparisonResult {
  total: number;
  correct: number;
  errors: CharError[];
  accuracy: number;
}

/**
 * 计算 WPM（每分钟字数）。使用"标准 5 字符 = 1 词"的换算。
 */
export function calculateWpm(charCount: number, durationMs: number): number {
  if (charCount <= 0 || durationMs <= 0) return 0;
  const minutes = durationMs / 60_000;
  const words = charCount / 5;
  return Number((words / minutes).toFixed(2));
}

/**
 * 计算准确率（0-1）。
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Number((correct / total).toFixed(4));
}

/**
 * 比对目标文本与实际输入。每个 CharError 含期望/实际/对应编码。
 */
export function compareTexts(
  expected: string,
  typed: string,
  expectedCodes: ReadonlyArray<string>,
  typedCodes: ReadonlyArray<string | null> = [],
): ComparisonResult {
  const total = expected.length;
  let correct = 0;
  const errors: CharError[] = [];

  for (let i = 0; i < total; i++) {
    const e = expected[i] ?? '';
    const t = typed[i] ?? '';
    if (e === t) {
      correct += 1;
    } else {
      errors.push({
        position: i,
        expected: e,
        typed: t,
        expectedCode: expectedCodes[i] ?? '',
        typedCode: typedCodes[i] ?? null,
      });
    }
  }
  return {
    total,
    correct,
    errors,
    accuracy: calculateAccuracy(correct, total),
  };
}

/**
 * 单字比较。空格也算"字符"——这样分词练习可以更准确。
 */
export function isCharCorrect(expected: string, typed: string): boolean {
  return expected === typed;
}

/**
 * 汇总 KeystrokeEvent 列表为统计。
 */
export function summarizeKeystrokes(events: ReadonlyArray<KeystrokeEvent>): {
  totalKeystrokes: number;
  totalCompositions: number;
  errors: number;
} {
  let totalKeystrokes = 0;
  let totalCompositions = 0;
  let errors = 0;
  for (const ev of events) {
    totalKeystrokes += 1;
    if (ev.isComposing) totalCompositions += 1;
    if (!isCharCorrect(ev.expected, ev.char)) errors += 1;
  }
  return { totalKeystrokes, totalCompositions, errors };
}

/**
 * 把 N 词/分钟换算成"中文字数/分钟"——1 词 = 5 字符 ≈ 1 个汉字。
 */
export function wpmToCpm(wpm: number): number {
  return Math.round(wpm * 5);
}
