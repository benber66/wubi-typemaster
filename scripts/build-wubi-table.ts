/**
 * 五笔码表数据处理脚本
 *
 * 输入：
 *   - src/data/raw/wubi86_jidian.dict.yaml   五笔码 (Apache-2.0)
 *   - src/data/raw/hanzi_db.csv              汉字频次排名 (MIT / Jun Da)
 *   - src/data/raw/SUBTLEX-CH-WF             词组频次排名 (Cai & Brysbaert 2010)
 *
 * 输出：
 *   - src/data/wubi86-chars.json   单字 ~7000，含 isCore
 *   - src/data/wubi86-words.json   词组 ~50000，含 isCore
 *   - src/data/wubi86-stats.json   统计报告
 *
 * 核心集合：top 3500 汉字 + top 10000 词组
 *
 * 用法：pnpm tsx scripts/build-wubi-table.ts
 */

import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const RAW_WUBI = join(PROJECT_ROOT, 'src/data/raw/wubi86_jidian.dict.yaml');
const RAW_HANZI = join(PROJECT_ROOT, 'src/data/raw/hanzi_db.csv');
const RAW_WORDS = join(PROJECT_ROOT, 'src/data/raw/SUBTLEX-CH-WF');

const CHARS_OUT = join(PROJECT_ROOT, 'src/data/wubi86-chars.json');
const WORDS_OUT = join(PROJECT_ROOT, 'src/data/wubi86-words.json');
const REPORT_OUT = join(PROJECT_ROOT, 'src/data/wubi86-stats.json');

/** 核心集合大小 */
const CORE_CHAR_COUNT = 3500; // 现代汉语常用字表：覆盖 99.5% 日常
const CORE_WORD_COUNT = 10000; // 经验值，覆盖约 95% 字幕语料

interface CharEntry {
  char: string;
  code: string;
  weight: number;
  isCore: boolean;
}
interface WordEntry {
  word: string;
  code: string;
  weight: number;
  length: number;
  isCore: boolean;
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
  if (trimmed.startsWith('  ')) return true;
  if (trimmed.startsWith('...')) return true;
  return false;
}

/** 加载汉字频次排名（1=最常用） */
async function loadHanziRanks(): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();
  if (!existsSync(RAW_HANZI)) {
    log(`WARN: ${RAW_HANZI} 不存在，所有单字都不会被标记为核心`);
    return ranks;
  }
  const rl = createInterface({
    input: createReadStream(RAW_HANZI, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });
  let isFirst = true;
  for await (const rawLine of rl) {
    const line = rawLine.replace(/\r$/, '');
    if (isFirst) {
      isFirst = false;
      continue; // 跳过表头
    }
    // CSV: rank,char,pinyin,definition,...
    const parts = line.split(',');
    if (parts.length < 2) continue;
    const rankStr = parts[0];
    const char = parts[1];
    if (!rankStr || !char) continue;
    const rank = parseInt(rankStr, 10);
    if (isNaN(rank)) continue;
    ranks.set(char, rank);
  }
  log(`汉字频次表: ${ranks.size} 字`);
  return ranks;
}

/** 加载词组频次排名（1=最常用） */
async function loadWordRanks(): Promise<Map<string, number>> {
  const ranks = new Map<string, number>();
  if (!existsSync(RAW_WORDS)) {
    log(`WARN: ${RAW_WORDS} 不存在，所有词组都不会被标记为核心`);
    return ranks;
  }
  // SUBTLEX-CH-WF 是 GB18030 编码
  const { readFileSync } = await import('node:fs');
  const buf = readFileSync(RAW_WORDS);
  const text = new TextDecoder('gb18030').decode(buf);
  const lines = text.split(/\r?\n/);
  let isHeader = true;
  let rank = 0;
  for (const line of lines) {
    if (isHeader) {
      // 前 2 行是 "Total..." / "Context..." 统计
      // 第 3 行是表头 "Word\tWCount\t..."
      if (line.startsWith('Word\t')) {
        isHeader = false;
      }
      continue;
    }
    const parts = line.split('\t');
    const word = parts[0];
    if (!word) continue;
    rank++;
    ranks.set(word, rank);
  }
  log(`词组频次表: ${ranks.size} 词`);
  return ranks;
}

async function main(): Promise<void> {
  if (!existsSync(RAW_WUBI)) {
    log(`ERROR: 找不到 ${RAW_WUBI}`);
    process.exit(1);
  }

  // 1. 加载频次排名
  const charRanks = await loadHanziRanks();
  const wordRanks = await loadWordRanks();

  // 2. 解析 Rime YAML
  const fileSize = statSync(RAW_WUBI).size;
  log(`读取 ${RAW_WUBI} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);

  const charMap = new Map<string, { code: string; weight: number }>();
  const wordMap = new Map<string, { code: string; weight: number; length: number }>();

  let totalLines = 0;
  let dataLines = 0;
  let skippedInvalid = 0;

  const stream = createReadStream(RAW_WUBI, { encoding: 'utf-8' });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  for await (const rawLine of rl) {
    totalLines++;
    if (totalLines % 10000 === 0) {
      log(`  处理中... ${totalLines} 行`);
    }
    const line = rawLine.replace(/\r$/, '');

    if (isHeaderLine(line)) continue;

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
    if (!/^[a-z]+$/.test(code)) {
      skippedInvalid++;
      continue;
    }

    dataLines++;

    if (text.length === 1) {
      const existing = charMap.get(text);
      if (
        !existing ||
        code.length < existing.code.length ||
        (code.length === existing.code.length && weight > existing.weight)
      ) {
        charMap.set(text, { code, weight });
      }
    } else if (text.length >= 2 && text.length <= 4) {
      const existing = wordMap.get(text);
      if (!existing || weight > existing.weight) {
        wordMap.set(text, { code, weight, length: text.length });
      }
    }
  }

  log(`解析完成: 总行数 ${totalLines}, 数据行 ${dataLines}, 跳过 ${skippedInvalid}`);
  log(`单字数: ${charMap.size}, 词组数: ${wordMap.size}`);

  // 3. 标记 isCore + 排序
  const chars: CharEntry[] = Array.from(charMap.entries())
    .map(([char, v]) => {
      const rank = charRanks.get(char) ?? Number.POSITIVE_INFINITY;
      return {
        char,
        code: v.code,
        weight: v.weight,
        isCore: rank <= CORE_CHAR_COUNT,
      };
    })
    .sort((a, b) => {
      // 核心优先，然后按 Jun Da 排名，然后按 Rime 权重
      if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
      const ar = charRanks.get(a.char) ?? Number.POSITIVE_INFINITY;
      const br = charRanks.get(b.char) ?? Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
      return b.weight - a.weight || a.char.localeCompare(b.char);
    });

  const words: WordEntry[] = Array.from(wordMap.entries())
    .map(([word, v]) => {
      const rank = wordRanks.get(word) ?? Number.POSITIVE_INFINITY;
      return {
        word,
        code: v.code,
        weight: v.weight,
        length: v.length,
        isCore: rank <= CORE_WORD_COUNT,
      };
    })
    .sort((a, b) => {
      if (a.isCore !== b.isCore) return a.isCore ? -1 : 1;
      const ar = wordRanks.get(a.word) ?? Number.POSITIVE_INFINITY;
      const br = wordRanks.get(b.word) ?? Number.POSITIVE_INFINITY;
      if (ar !== br) return ar - br;
      return b.weight - a.weight || a.word.localeCompare(b.word);
    });

  // 4. 写文件
  mkdirSync(dirname(CHARS_OUT), { recursive: true });
  writeFileSync(CHARS_OUT, JSON.stringify(chars, null, 0), 'utf-8');
  writeFileSync(WORDS_OUT, JSON.stringify(words, null, 0), 'utf-8');

  // 5. 报告
  const coreCharCount = chars.filter((c) => c.isCore).length;
  const coreWordCount = words.filter((w) => w.isCore).length;
  const report = {
    builtAt: new Date().toISOString(),
    sources: {
      wubi: { name: 'rime-wubi86-jidian', license: 'Apache-2.0' },
      charRank: { name: 'hanziDB (Jun Da)', license: 'MIT', size: charRanks.size },
      wordRank: {
        name: 'SUBTLEX-CH-WF (Cai & Brysbaert 2010)',
        license: 'Free for research',
        size: wordRanks.size,
      },
    },
    coreThresholds: { chars: CORE_CHAR_COUNT, words: CORE_WORD_COUNT },
    stats: {
      totalChars: chars.length,
      coreChars: coreCharCount,
      totalWords: words.length,
      coreWords: coreWordCount,
      skippedInvalid,
    },
    wordsByLength: {
      2: words.filter((w) => w.length === 2).length,
      3: words.filter((w) => w.length === 3).length,
      4: words.filter((w) => w.length === 4).length,
    },
    sample: {
      coreChars: chars.filter((c) => c.isCore).slice(0, 10),
      coreWords: words.filter((w) => w.isCore).slice(0, 10),
    },
  };
  writeFileSync(REPORT_OUT, JSON.stringify(report, null, 2), 'utf-8');

  log(`✅ 输出: ${CHARS_OUT} (${(statSync(CHARS_OUT).size / 1024).toFixed(1)} KB)`);
  log(`✅ 输出: ${WORDS_OUT} (${(statSync(WORDS_OUT).size / 1024).toFixed(1)} KB)`);
  log(`✅ 报告: ${REPORT_OUT}`);
  log(``);
  log(`核心集: ${coreCharCount} 字 + ${coreWordCount} 词`);
  log(``);
  log(
    `核心单字 top10: ${chars
      .filter((c) => c.isCore)
      .slice(0, 10)
      .map((c) => `${c.char}=${c.code}`)
      .join(', ')}`,
  );
  log(
    `核心词组 top10: ${words
      .filter((w) => w.isCore)
      .slice(0, 10)
      .map((w) => `${w.word}=${w.code}`)
      .join(', ')}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
