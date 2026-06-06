import { app } from 'electron';
import { join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createDbClient, type DbConfig } from '../../src/db/client';

let cached: ReturnType<typeof createDbClient> | null = null;

export function getDefaultDbPath(): string {
  return join(app.getPath('userData'), 'wubi-typemaster.sqlite');
}

export function getBundledDataDir(): string {
  // 生产：__dirname/resources（electron-builder extraResources）
  // 开发：项目根的 src/data
  const candidates = [
    join(process.resourcesPath ?? '', 'data'),
    join(app.getAppPath(), 'src', 'data'),
    join(__dirname, '..', '..', 'src', 'data'),
  ];
  for (const dir of candidates) {
    if (existsSync(join(dir, 'wubi86-chars.json'))) return dir;
  }
  return candidates[0]!;
}

export function getDatabase(): ReturnType<typeof createDbClient> {
  if (cached) return cached;
  const path = getDefaultDbPath();
  const config: DbConfig = { path, wal: true, autoMigrate: true };
  cached = createDbClient(config);
  return cached;
}

export async function ensureSeeded(): Promise<void> {
  const db = getDatabase();
  const row = db.prepare('SELECT COUNT(*) as count FROM wubi_chars').get() as { count: number };
  if (row.count > 0) return;
  // 触发 lazy seed（如已构建 data 资源）
  await seedFromBundled();
}

export async function seedFromBundled(): Promise<void> {
  const dataDir = getBundledDataDir();
  const charsPath = join(dataDir, 'wubi86-chars.json');
  const wordsPath = join(dataDir, 'wubi86-words.json');
  if (!existsSync(charsPath) || !existsSync(wordsPath)) {
    throw new Error(`Bundled data missing in ${dataDir}`);
  }
  const chars = JSON.parse(readFileSync(charsPath, 'utf-8')) as Array<{
    char: string;
    code: string;
    weight: number;
    isCore: boolean;
  }>;
  const words = JSON.parse(readFileSync(wordsPath, 'utf-8')) as Array<{
    word: string;
    code: string;
    weight: number;
    length: number;
    isCore: boolean;
  }>;

  const db = getDatabase();
  const tx = db.transaction(() => {
    const insertChar = db.prepare(
      `INSERT OR REPLACE INTO wubi_chars (char, wubi_code, weight, is_core, is_primary) VALUES (?, ?, ?, ?, 1)`,
    );
    const insertWord = db.prepare(
      `INSERT OR REPLACE INTO wubi_words (word, wubi_code, weight, length, is_core) VALUES (?, ?, ?, ?, ?)`,
    );
    for (const c of chars) insertChar.run(c.char, c.code, c.weight, c.isCore ? 1 : 0);
    for (const w of words) insertWord.run(w.word, w.code, w.weight, w.length, w.isCore ? 1 : 0);
  });
  tx();
  console.log(`[db] Seeded ${chars.length} chars + ${words.length} words`);
}

export function listRawDataFiles(): string[] {
  const dataDir = getBundledDataDir();
  if (!existsSync(dataDir)) return [];
  return readdirSync(dataDir);
}

export async function ensureUserDataDir(): Promise<void> {
  const dir = app.getPath('userData');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}
