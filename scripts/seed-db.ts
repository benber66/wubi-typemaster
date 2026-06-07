/**
 * 数据库初始化 / 数据灌入脚本
 *
 * 用法：
 *   pnpm tsx scripts/seed-db.ts [--path <db-path>] [--reset]
 *
 * 默认路径：<userData>/db.sqlite
 * --reset：删除现有数据后重新灌入
 */

import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDbClient, closeDb } from '../src/db/client';
import { seedDatabase, type WubiChar, type WubiWord } from '../src/lib/wubi/lookup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

const CHARS_FILE = join(PROJECT_ROOT, 'src/data/wubi86-chars.json');
const WORDS_FILE = join(PROJECT_ROOT, 'src/data/wubi86-words.json');
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'src/db/migrations');

function getDefaultDbPath(): string {
  // 优先使用环境变量，否则使用项目内的 data/ 目录
  const envPath = process.env.WT_DB_PATH;
  if (envPath) return envPath;
  return join(PROJECT_ROOT, 'data', 'db.sqlite');
}

function log(msg: string): void {
  console.log(`[seed-db] ${msg}`);
}

function parseArgs(): { dbPath: string; reset: boolean } {
  const args = process.argv.slice(2);
  let dbPath = getDefaultDbPath();
  let reset = false;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--path' && i + 1 < args.length) {
      dbPath = args[++i]!;
    } else if (arg === '--reset') {
      reset = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log('用法: pnpm tsx scripts/seed-db.ts [--path <db-path>] [--reset]');
      console.log('  --path: SQLite 文件路径（默认: data/db.sqlite）');
      console.log('  --reset: 先清空 wubi_chars / wubi_words 表再灌入');
      process.exit(0);
    }
  }
  return { dbPath, reset };
}

async function main(): Promise<void> {
  const { dbPath, reset } = parseArgs();

  log(`数据库路径: ${dbPath}`);
  log(`重置模式: ${reset ? '是' : '否'}`);

  if (!existsSync(CHARS_FILE)) {
    log(`ERROR: 找不到 ${CHARS_FILE}`);
    log(`请先运行: pnpm tsx scripts/build-wubi-table.ts`);
    process.exit(1);
  }
  if (!existsSync(WORDS_FILE)) {
    log(`ERROR: 找不到 ${WORDS_FILE}`);
    process.exit(1);
  }

  // 1. 删除旧 db（如果 --reset）
  if (reset && existsSync(dbPath)) {
    log(`删除旧数据库: ${dbPath}`);
    unlinkSync(dbPath);
    // 同时删除 wal/shm 文件
    for (const ext of ['-wal', '-shm']) {
      const p = dbPath + ext;
      if (existsSync(p)) unlinkSync(p);
    }
  }

  // 2. 确保父目录存在
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // 3. 打开数据库（自动迁移）
  log(`打开数据库...`);
  const db = createDbClient({
    path: dbPath,
    migrationsDir: MIGRATIONS_DIR,
  });

  // 4. 读取 JSON
  log(`读取码表 JSON...`);
  const chars = JSON.parse(readFileSync(CHARS_FILE, 'utf-8')) as WubiChar[];
  const words = JSON.parse(readFileSync(WORDS_FILE, 'utf-8')) as WubiWord[];

  // 5. 灌入数据
  if (reset) {
    log(`清空 wubi_chars / wubi_words...`);
    db.exec('DELETE FROM wubi_chars; DELETE FROM wubi_words;');
  }

  log(`灌入数据: ${chars.length} 单字, ${words.length} 词组...`);
  const t0 = Date.now();
  const result = seedDatabase(db, chars, words);
  const t1 = Date.now();

  log(`✅ 灌入完成: ${result.chars} 单字 + ${result.words} 词组 (${t1 - t0} ms)`);

  // 6. 验证
  log(`验证查询...`);
  // 直接 SQL 查询验证
  const charCount = (db.prepare('SELECT COUNT(*) as c FROM wubi_chars').get() as { c: number }).c;
  const wordCount = (db.prepare('SELECT COUNT(*) as c FROM wubi_words').get() as { c: number }).c;
  const coreCharCount = (
    db.prepare('SELECT COUNT(*) as c FROM wubi_chars WHERE is_core = 1').get() as { c: number }
  ).c;
  const coreWordCount = (
    db.prepare('SELECT COUNT(*) as c FROM wubi_words WHERE is_core = 1').get() as { c: number }
  ).c;
  log(
    `数据库内: ${charCount} 单字 (核心 ${coreCharCount}), ${wordCount} 词组 (核心 ${coreWordCount})`,
  );

  // 抽查几个常用字
  const tests = [
    ['中', 'k'],
    ['国', 'l'],
    ['我', 'q'],
    ['的', 'r'],
    ['是', 'j'],
  ] as const;
  for (const [char, expected] of tests) {
    const row = db.prepare('SELECT wubi_code as code FROM wubi_chars WHERE char = ?').get(char) as
      | { code: string }
      | undefined;
    const actual = row?.code;
    const ok = actual === expected;
    log(`  ${ok ? '✓' : '✗'} ${char}: 期望 ${expected}, 实际 ${actual ?? 'NOT FOUND'}`);
  }

  // 抽查词组（2字词=各取前两码；中=kh, 国=lg → 中国=khlg）
  const wordTests: ReadonlyArray<readonly [string, string]> = [
    ['我们', 'trwu'],
    ['中国', 'khlg'],
  ];
  for (const [word, expected] of wordTests) {
    const row = db.prepare('SELECT wubi_code as code FROM wubi_words WHERE word = ?').get(word) as
      | { code: string }
      | undefined;
    const actual = row?.code;
    const ok = actual === expected;
    log(`  ${ok ? '✓' : '✗'} ${word}: 期望 ${expected}, 实际 ${actual ?? 'NOT FOUND'}`);
  }

  closeDb(db);
  log(`完成。数据库: ${dbPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
