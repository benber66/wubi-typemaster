import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const MIGRATIONS_DIR = resolve(__dirname, 'migrations');

export interface DbConfig {
  /** SQLite 数据库文件路径，:memory: 表示内存数据库 */
  path: string;
  /** 是否启用 WAL 模式（默认 true） */
  wal?: boolean;
  /** 是否自动应用迁移（默认 true） */
  autoMigrate?: boolean;
  /** 自定义迁移目录（用于测试） */
  migrationsDir?: string;
}

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

/**
 * 加载并按版本号排序所有迁移文件
 */
export function loadMigrations(dir: string = MIGRATIONS_DIR): Migration[] {
  if (!existsSync(dir)) {
    return [];
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  return files.map((file) => {
    const match = file.match(/^(\d+)_(.+)\.sql$/);
    if (!match) {
      throw new Error(`Invalid migration filename: ${file}`);
    }
    const version = parseInt(match[1]!, 10);
    const name = match[2]!;
    const sql = readFileSync(join(dir, file), 'utf-8');
    return { version, name, sql };
  });
}

/**
 * 应用所有未应用的迁移
 */
export function applyMigrations(db: Database.Database, dir: string = MIGRATIONS_DIR): number {
  // 1. 确保 schema_migrations 表存在（用 IF NOT EXISTS）
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER PRIMARY KEY,
      name        TEXT NOT NULL,
      applied_at  INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
    );
  `);

  // 2. 读取已应用版本
  const appliedRows = db.prepare('SELECT version FROM schema_migrations').all() as {
    version: number;
  }[];
  const appliedVersions = new Set(appliedRows.map((r) => r.version));

  // 3. 加载并应用未应用的迁移
  const migrations = loadMigrations(dir);
  let applied = 0;

  for (const m of migrations) {
    if (appliedVersions.has(m.version)) continue;
    const tx = db.transaction(() => {
      db.exec(m.sql);
    });
    tx();
    applied++;
  }

  return applied;
}

/**
 * 创建并初始化一个数据库客户端
 */
export function createDbClient(config: DbConfig): Database.Database {
  const { path, wal = true, autoMigrate = true, migrationsDir } = config;

  // 内存数据库跳过目录创建
  if (path !== ':memory:') {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const db = new Database(path);

  if (wal && path !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  if (autoMigrate) {
    applyMigrations(db, migrationsDir);
  }

  return db;
}

/**
 * 关闭数据库并清理资源
 */
export function closeDb(db: Database.Database): void {
  if (db.open) {
    db.close();
  }
}

/**
 * 单例：当前进程的默认数据库实例
 * 在 Electron 主进程中通过 setDefaultDbPath() 初始化
 */
let defaultInstance: Database.Database | null = null;

export function setDefaultDb(db: Database.Database): void {
  defaultInstance = db;
}

export function getDefaultDb(): Database.Database {
  if (!defaultInstance) {
    throw new Error(
      'Default database not initialized. Call setDefaultDb() or createDbClient() first.',
    );
  }
  return defaultInstance;
}

export function closeDefaultDb(): void {
  if (defaultInstance) {
    closeDb(defaultInstance);
    defaultInstance = null;
  }
}
