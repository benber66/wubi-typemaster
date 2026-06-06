/**
 * 五笔码表数据处理脚本
 *
 * 输入：src/data/raw/wubi86_jidian.dict.yaml
 * 输出：
 *   - src/data/wubi86-chars.json  (单字 ~7000)
 *   - src/data/wubi86-words.json  (词组 ~50000)
 *
 * 数据来源：https://github.com/KyleBing/rime-wubi86-jidian
 * 协议：Apache-2.0
 *
 * 用法：pnpm tsx scripts/build-wubi-table.ts
 */

import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const RAW_FILE = join(PROJECT_ROOT, 'src/data/raw/wubi86_jidian.dict.yaml');
const CHARS_OUT = join(PROJECT_ROOT, 'src/data/wubi86-chars.json');
const WORDS_OUT = join(PROJECT_ROOT, 'src/data/wubi86-words.json');
const REPORT_OUT = join(PROJECT_ROOT, 'src/data/wubi86-stats.json');

interface CharEntry {
  char: string;
  code: string;
  weight: number;
}
interface WordEntry {
  word: string;
  code: string;
  weight: number;
  length: number;
}

function log(msg: string): void {
  console.log(`[build-wubi-table] ${msg}`);
}

function isHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === '') return true;
  if (trimmed === '---') return true;
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('name:')) return true;
  if (trimmed.startsWith('version:')) return true;
  if (trimmed.startsWith('sort:')) return true;
  if (trimmed.startsWith('import_tables:')) return true;
  if (trimmed.startsWith('  - ')) return true;
  if (trimmed.startsWith('columns:')) return true;
  if (trimmed.startsWith('  - ')) return true;
  if (trimmed.startsWith('encoder:')) return true;
  if (trimmed.startsWith('  ')) return true; // 子配置
  if (trimmed.startsWith('...')) return true;
  return false;
}

async function main(): Promise<void> {
  if (!existsSync(RAW_FILE)) {
    log(`ERROR: 找不到原始数据文件 ${RAW_FILE}`);
    log(`请先下载: src/data/raw/wubi86_jidian.dict.yaml`);
    process.exit(1);
  }

  const fileSize = statSync(RAW_FILE).size;
  log(`读取 ${RAW_FILE} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  // 用 Map 保留每个 char 的最短码
  const charMap = new Map<string, CharEntry>();
  // 用 Map 保留每个 word 的码
  const wordMap = new Map<string, WordEntry>();

  let totalLines = 0;
  let dataLines = 0;
  let skippedInvalid = 0;

  const stream = createReadStream(RAW_FILE, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    totalLines++;
    if (totalLines % 10000 === 0) {
      log(`  处理中... ${totalLines} 行`);
    }
    const line = rawLine.replace(/\r$/, '');

    if (isHeaderLine(line)) continue;

    // 数据行格式: text\tcode\tweight
    const parts = line.split('\t');
    if (parts.length < 2) {
      skippedInvalid++;
      continue;
    }
    const text = parts[0] ?? '';
    const code = parts[1] ?? '';
    const weightStr = parts[2] ?? '0';
    const weight = parseInt(weightStr, 10) || 0;

    if (!text || !code) {
      skippedInvalid++;
      continue;
    }
    // 86 五笔编码只允许 a-z（小写）
    if (!/^[a-z]+$/.test(code)) {
      skippedInvalid++;
      continue;
    }

    dataLines++;

    if (text.length === 1) {
      // 单字：保留最短码
      const existing = charMap.get(text);
      if (!existing || code.length < existing.code.length ||
          (code.length === existing.code.length && weight > existing.weight)) {
        charMap.set(text, { char: text, code, weight });
      }
    } else if (text.length >= 2 && text.length <= 4) {
      // 词组：保留第一笔（每个 word 可能有多个码，取权重最高的）
      const existing = wordMap.get(text);
      if (!existing || weight > existing.weight) {
        wordMap.set(text, { word: text, code, weight, length: text.length });
      }
    } else {
      // 长度 > 4 的词组暂时忽略
    }
  }

  log(`处理完成: 总行数 ${totalLines}, 数据行 ${dataLines}, 跳过 ${skippedInvalid}`);
  log(`单字数: ${charMap.size}, 词组数: ${wordMap.size}`);

  // 排序：单字按权重降序，词组按权重降序
  const chars: CharEntry[] = Array.from(charMap.values()).sort(
    (a, b) => b.weight - a.weight || a.char.localeCompare(b.char),
  );
  const words: WordEntry[] = Array.from(wordMap.values()).sort(
    (a, b) => b.weight - a.weight || a.word.localeCompare(b.word),
  );

  // 写文件
  mkdirSync(dirname(CHARS_OUT), { recursive: true });
  writeFileSync(CHARS_OUT, JSON.stringify(chars, null, 0), 'utf-8');
  writeFileSync(WORDS_OUT, JSON.stringify(words, null, 0), 'utf-8');

  // 报告
  const report = {
    source: 'rime-wubi86-jidian (KyleBing)',
    sourceUrl: 'https://github.com/KyleBing/rime-wubi86-jidian',
    license: 'Apache-2.0',
    builtAt: new Date().toISOString(),
    totalLines,
    dataLines,
    skippedInvalid,
    charCount: chars.length,
    wordCount: words.length,
    wordsByLength: {
      2: words.filter((w) => w.length === 2).length,
      3: words.filter((w) => w.length === 3).length,
      4: words.filter((w) => w.length === 4).length,
    },
    codeLengthDistribution: {
      chars: countByCodeLength(chars.map((c) => c.code.length)),
      words: countByCodeLength(words.map((w) => w.code.length)),
    },
    sample: {
      chars: chars.slice(0, 5),
      words: words.slice(0, 5),
    },
  };
  writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2), 'utf-8');

  log(`✅ 输出: ${CHARS_OUT} (${(statSync(CHARS_OUT).size / 1024).toFixed(1)} KB)`);
  log(`✅ 输出: ${WORDS_OUT} (${(statSync(WORDS_OUT).size / 1024).toFixed(1)} KB)`);
  log(`✅ 报告: ${REPORT_OUT}`);
  log(``);
  log(`示例单字: ${chars.slice(0, 5).map((c) => `${c.char}=${c.code}`).join(', ')}`);
  log(`示例词组: ${words.slice(0, 5).map((w) => `${w.word}=${w.code}`).join(', ')}`);
}

function countByCodeLength(lengths: number[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const l of lengths) {
    const key = String(l);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
