import type { CharError } from '@/lib/typing/metrics';

export interface ImeCommitEvent {
  text: string;          // 最终上屏文本
  composing: boolean;    // 提交时是否还在 composition（通常 false）
  timestamp: number;
}

export interface KeystrokeCommitEvent {
  typed: string;          // 用户在 compositionend 提交的字
  expected: string;       // 当前目标字
  position: number;       // 当前光标位置
  timestamp: number;
}

export type ImeEventHandler = (event: ImeCommitEvent) => void;
export type KeystrokeHandler = (event: KeystrokeCommitEvent) => void;

/**
 * 从 composition 事件中提取最终上屏文本。
 * 中文 IME 流程：compositionstart → compositionupdate* → compositionend
 * 提交文本在 compositionend 的 event.data 中。
 */
export function extractCommitText(event: {
  data?: string;
  type: string;
}): string {
  if (event.type === 'compositionend' && typeof event.data === 'string') {
    return event.data;
  }
  return '';
}

/**
 * 判断给定的输入是否构成"完整汉字 commit"。
 * - compositionend with non-empty data → 完整 commit
 * - compositionend with empty data → 用户按 ESC 取消
 */
export function isFinalCommit(event: {
  data?: string;
  type: string;
}): boolean {
  return event.type === 'compositionend' && typeof event.data === 'string' && event.data.length > 0;
}

/**
 * 从文本末尾获取最后一个完整字。
 * 处理 composition 提交后可能有未消化的 punctuation。
 */
export function getLastChar(text: string): string {
  if (text.length === 0) return '';
  // 跳过末尾标点（如 "中。" 的 "。"）
  const lastCodePoint = text.codePointAt(text.length - 1);
  if (lastCodePoint === undefined) return '';
  return String.fromCodePoint(lastCodePoint);
}

/**
 * 处理一次完整输入事件，比对目标字，生成 KeystrokeCommitEvent 或 CharError。
 * 返回 null 表示"输入了标点等非目标字符"（不计入错误）。
 */
export function handleCommit(
  typed: string,
  expected: string,
  position: number,
  timestamp: number = Date.now(),
): KeystrokeCommitEvent | null {
  const target = getLastChar(typed);
  if (target === '' || target === ' ' || target === '，' || target === '。') {
    // 标点不参与比对（在文章跟打中通常被跳过）
    return null;
  }
  return { typed: target, expected, position, timestamp };
}

/**
 * 构造 CharError 列表（用于持久化）。
 */
export function buildCharError(
  position: number,
  expected: string,
  typed: string,
  expectedCode: string,
  typedCode: string | null = null,
): CharError {
  return { position, expected, typed, expectedCode, typedCode };
}
