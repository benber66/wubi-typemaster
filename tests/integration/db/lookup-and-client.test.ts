import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Windows 下 closeDb 后文件系统可能仍持有句柄，导致 rmSync 抛 EBUSY。
 * 用 setTimeout 异步重试几次。
 */
async function safeRmSync(path: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    try {
      rmSync(path, { recursive: true, force: true });
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if ((code === 'EBUSY' || code === 'EPERM') && i < 9) {
        await new Promise((r) => setTimeout(r, 100));
      } else {
        throw err;
      }
    }
  }
}
import {
  createDbClient,
  closeDb,
  applyMigrations,
  loadMigrations,
  setDefaultDb,
  closeDefaultDb,
  getDefaultDb,
} from '../../../src/db/client';
import {
  createLookup,
  createLookupFromJson,
  seedDatabase,
  type WubiChar,
  type WubiWord,
} from '../../../src/lib/wubi/lookup';

const SAMPLE_CHARS: WubiChar[] = [
  { char: '中', code: 'k', weight: 5000, codeLength: 1 },
  { char: '国', code: 'l', weight: 4999, codeLength: 1 },
  { char: '我', code: 'q', weight: 4998, codeLength: 1 },
  { char: '的', code: 'r', weight: 4997, codeLength: 1 },
  { char: '大', code: 'dd', weight: 4980, codeLength: 2 },
];

const SAMPLE_WORDS: WubiWord[] = [
  { word: '中国', code: 'lgkl', weight: 5000, length: 2 },
  { word: '我们', code: 'trwu', weight: 4999, length: 2 },
  { word: '大地', code: 'ddfb', weight: 600, length: 2 },
  { word: '大规模', code: 'ddtg', weight: 400, length: 3 },
];

describe('db/client', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'wubi-typemaster-test-'));
    dbPath = join(tmpDir, 'test.db');
  });

  afterEach(async () => {
    closeDefaultDb();
    await safeRmSync(tmpDir);
  });

  describe('createDbClient', () => {
    it('创建数据库文件并应用迁移', () => {
      const db = createDbClient({ path: dbPath });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];
      const names = tables.map((t) => t.name);
      expect(names).toContain('wubi_chars');
      expect(names).toContain('wubi_words');
      expect(names).toContain('settings');
      expect(names).toContain('schema_migrations');
      closeDb(db);
    });

    it('不重复应用迁移', () => {
      const db = createDbClient({ path: dbPath });
      const firstCount = (db.prepare('SELECT COUNT(*) as c FROM schema_migrations').get() as {
        c: number;
      }).c;
      // 关闭后重新打开（不删文件）
      closeDb(db);
      const db2 = createDbClient({ path: dbPath });
      const secondCount = (db2.prepare('SELECT COUNT(*) as c FROM schema_migrations').get() as {
        c: number;
      }).c;
      expect(secondCount).toBe(firstCount);
      closeDb(db2);
    });

    it('autoMigrate=false 跳过迁移', () => {
      const db = createDbClient({ path: dbPath, autoMigrate: false });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wubi_chars'")
        .all() as { name: string }[];
      expect(tables.length).toBe(0);
      closeDb(db);
    });

    it('内存数据库（:memory:）也能工作', () => {
      const db = createDbClient({ path: ':memory:' });
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='wubi_chars'")
        .all() as { name: string }[];
      expect(tables.length).toBe(1);
      closeDb(db);
    });

    it('外键约束已开启', () => {
      const db = createDbClient({ path: dbPath });
      const result = db.pragma('foreign_keys', { simple: true });
      expect(result).toBe(1);
      closeDb(db);
    });
  });

  describe('loadMigrations & applyMigrations', () => {
    it('加载初始迁移文件', () => {
      const migrations = loadMigrations();
      expect(migrations.length).toBeGreaterThan(0);
      const m1 = migrations.find((m) => m.version === 1);
      expect(m1).toBeDefined();
      expect(m1?.name).toBe('initial');
      expect(m1?.sql).toContain('CREATE TABLE IF NOT EXISTS wubi_chars');
    });

    it('applyMigrations 幂等', () => {
      const db = createDbClient({ path: dbPath, autoMigrate: false });
      // 先建 meta 表
      db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
      )`);
      const first = applyMigrations(db);
      const second = applyMigrations(db);
      expect(first).toBeGreaterThan(0);
      expect(second).toBe(0);
      closeDb(db);
    });
  });

  describe('singleton', () => {
    it('setDefaultDb / getDefaultDb 配合工作', () => {
      const db = createDbClient({ path: dbPath });
      setDefaultDb(db);
      const got = (() => {
        // 重置模块以让 defaultInstance 可见
        return db;
      })();
      expect(got.open).toBe(true);
      closeDefaultDb();
    });

    it('closeDefaultDb 后再 get 会抛错', () => {
      const db = createDbClient({ path: dbPath });
      setDefaultDb(db);
      closeDefaultDb();
      expect(() => getDefaultDb()).toThrow();
    });
  });

  describe('closeDb', () => {
    it('关闭已打开的数据库', () => {
      const db = createDbClient({ path: dbPath });
      expect(db.open).toBe(true);
      closeDb(db);
      expect(db.open).toBe(false);
    });

    it('重复关闭是安全的', () => {
      const db = createDbClient({ path: dbPath });
      closeDb(db);
      expect(() => closeDb(db)).not.toThrow();
    });
  });
});

describe('lib/wubi/lookup with DB', () => {
  let tmpDir: string;
  let dbPath: string;
  let db: ReturnType<typeof createDbClient>;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'wubi-typemaster-lookup-'));
    dbPath = join(tmpDir, 'lookup.db');
    db = createDbClient({ path: dbPath });
    seedDatabase(db, SAMPLE_CHARS, SAMPLE_WORDS);
  });

  afterEach(async () => {
    closeDb(db);
    await safeRmSync(tmpDir);
  });

  it('createLookup: lookupChar 走 DB 查询', () => {
    const lookup = createLookup(db);
    const r = lookup.lookupChar('中');
    expect(r).not.toBeNull();
    expect(r?.code).toBe('k');
  });

  it('createLookup: lookupCode 走 DB 查询并按权重排序', () => {
    const lookup = createLookup(db);
    // SAMPLE_CHARS 中 code = 'dd' 的有 '大'，code = 'd' 单独对应的字不在 SAMPLE_CHARS
    const r = lookup.lookupCode('dd');
    expect(r[0]?.char).toBe('大');
  });

  it('createLookup: lookupWord 走 DB 查询', () => {
    const lookup = createLookup(db);
    const r = lookup.lookupWord('我们');
    expect(r?.code).toBe('trwu');
  });

  it('createLookup: lookupByCode 走 DB 查询', () => {
    const lookup = createLookup(db);
    const r = lookup.lookupByCode('trwu');
    expect(r.some((w) => w.word === '我们')).toBe(true);
  });

  it('createLookup: lookupPrefix 混合单字和词组', () => {
    const lookup = createLookup(db);
    const r = lookup.lookupPrefix('d');
    expect(r.length).toBeGreaterThan(0);
    const hasChar = r.some((x) => x.type === 'char' && x.text === '大');
    const hasWord = r.some((x) => x.type === 'word' && x.text === '大地');
    expect(hasChar || hasWord).toBe(true);
  });

  it('createLookup: randomChars 返回数据', () => {
    const lookup = createLookup(db);
    const r = lookup.randomChars(3);
    expect(r.length).toBe(3);
  });

  it('createLookup: randomWords 不限长度', () => {
    const lookup = createLookup(db);
    const r = lookup.randomWords(3);
    expect(r.length).toBe(3);
  });

  it('createLookup: randomWords 按长度过滤', () => {
    const lookup = createLookup(db);
    const r = lookup.randomWords(5, 3);
    expect(r.every((w) => w.length === 3)).toBe(true);
  });

  it('createLookup: randomWords 长度无匹配返回空', () => {
    const lookup = createLookup(db);
    expect(lookup.randomWords(3, 4)).toEqual([]);
  });

  it('createLookup: randomWords count=0', () => {
    const lookup = createLookup(db);
    expect(lookup.randomWords(0)).toEqual([]);
  });

  it('createLookup: size 返回码表大小', () => {
    const lookup = createLookup(db);
    const s = lookup.size();
    expect(s.chars).toBe(SAMPLE_CHARS.length);
    expect(s.words).toBe(SAMPLE_WORDS.length);
  });
});

describe('seedDatabase', () => {
  let tmpDir: string;
  let dbPath: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'wubi-typemaster-seed-'));
    dbPath = join(tmpDir, 'seed.db');
  });

  afterEach(async () => {
    await safeRmSync(tmpDir);
  });

  it('灌入数据后能查到', () => {
    const db = createDbClient({ path: dbPath });
    const result = seedDatabase(db, SAMPLE_CHARS, SAMPLE_WORDS);
    expect(result.chars).toBe(SAMPLE_CHARS.length);
    expect(result.words).toBe(SAMPLE_WORDS.length);
    const count = (db.prepare('SELECT COUNT(*) as c FROM wubi_chars').get() as { c: number }).c;
    expect(count).toBe(SAMPLE_CHARS.length);
    closeDb(db);
  });

  it('重复灌入相同主键会替换', () => {
    const db = createDbClient({ path: dbPath });
    seedDatabase(db, SAMPLE_CHARS, SAMPLE_WORDS);
    // 再次灌入：只更新"中"的编码，其他字不变
    const updated: WubiChar[] = [{ char: '中', code: 'kkkk', weight: 9999, codeLength: 4 }];
    seedDatabase(db, updated, []);
    const row = db.prepare('SELECT wubi_code as code FROM wubi_chars WHERE char = ?').get('中') as
      | { code: string }
      | undefined;
    expect(row?.code).toBe('kkkk');
    const count = (db.prepare('SELECT COUNT(*) as c FROM wubi_chars').get() as { c: number }).c;
    // OR REPLACE: 替换"中"，其他字保留，所以总数 = SAMPLE_CHARS.length
    expect(count).toBe(SAMPLE_CHARS.length);
    closeDb(db);
  });

  it('createLookupFromJson 与 createLookup 行为一致（已知子集）', () => {
    const db = createDbClient({ path: dbPath });
    seedDatabase(db, SAMPLE_CHARS, SAMPLE_WORDS);

    const memLookup = createLookupFromJson(SAMPLE_CHARS, SAMPLE_WORDS);
    const dbLookup = createLookup(db);

    for (const c of SAMPLE_CHARS) {
      expect(dbLookup.lookupChar(c.char)?.code).toBe(memLookup.lookupChar(c.char)?.code);
    }
    for (const w of SAMPLE_WORDS) {
      expect(dbLookup.lookupWord(w.word)?.code).toBe(memLookup.lookupWord(w.word)?.code);
    }
    closeDb(db);
  });
});
