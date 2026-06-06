/**
 * 从 KeyboardEvent.code（如 "KeyT"、"KeyA"）提取字母字符（小写）。
 * 在中文 IME 激活时，e.key 会被设为 "Process"，但 e.code 保持物理按键不变，
 * 因此游戏类输入必须用 e.code 而不是 e.key 来识别字母。
 */
export function codeToLetter(code: string): string | null {
  if (code.length !== 4 || !code.startsWith('Key')) return null;
  const ch = code[3];
  if (ch === undefined) return null;
  if (ch < 'A' || ch > 'Z') return null;
  return ch.toLowerCase();
}

/**
 * 判断一个 KeyboardEvent 是不是"应当被忽略的 IME 合成键"。
 * Windows 上 IME 在 composition 期间会发 keydown，e.key="Process"，e.code 保留原按键。
 * 通过 e.code 我们能拿到原字母，但需要主动 preventDefault 避免落到 input.value 上。
 * 这里只用于判断是否走"我们自己的 typed 缓冲"路径。
 */
export function isImeProcessedLetter(code: string): boolean {
  return codeToLetter(code) !== null;
}
