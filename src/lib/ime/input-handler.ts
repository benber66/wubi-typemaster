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
 * 把 IME compositionend 提交的一段文本拆成"逐字"序列，供 store 顺序 commit。
 * 保留所有汉字、ASCII 字母、标点；纯空白（半角空格、换行）会被剔除。
 *
 * 五笔一次性提交 "我们" 时应拆成 ["我", "们"] 两次 commit，而不是只取最后一个。
 */
export function splitCommitText(text: string): string[] {
  const out: string[] = [];
  for (const ch of text) {
    if (ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r') continue;
    out.push(ch);
  }
  return out;
}

/**
 * 处理一次完整输入事件，比对目标字，生成 KeystrokeCommitEvent。
 * 该函数对单字调用；多字 IME 提交应先用 splitCommitText 拆开再循环调用。
 */
export function handleCommit(
  typed: string,
  expected: string,
  position: number,
  timestamp: number = Date.now(),
): KeystrokeCommitEvent | null {
  if (typed === '' || typed === ' ' || typed === '\n' || typed === '\t') {
    return null;
  }
  return { typed, expected, position, timestamp };
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
