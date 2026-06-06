import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { getSetting, setSetting, loadAllSettings, saveAllSettings } from '@/lib/db/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function newTestDb() {
  const dir = mkdtempSync(join(tmpdir(), 'wubi-test-'));
  const path = join(dir, 'test.sqlite');
  const db = new Database(path);
  const initSql = readFileSync(
    join(process.cwd(), 'src/db/migrations/001_initial.sql'),
    'utf-8',
  );
  db.exec(initSql);
  return { db, dir, path };
}

function safeRm(dir: string) {
  for (let i = 0; i < 10; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch {
      // EBUSY on Windows
    }
  }
}

describe('lib/db/settings', () => {
  let dir: string;
  let db: Database.Database;

  beforeEach(() => {
    const setup = newTestDb();
    dir = setup.dir;
    db = setup.db;
  });

  afterEach(() => {
    db.close();
    safeRm(dir);
  });

  it('returns undefined for truly missing key', () => {
    expect(getSetting(db, 'nonExistentKey' as 'theme')).toBeUndefined();
  });

  it('returns default values from migration seed', () => {
    expect(getSetting(db, 'theme')).toBe('light');
    expect(getSetting(db, 'soundEnabled')).toBe(false);
  });

  it('set + get round-trips a string', () => {
    setSetting(db, 'theme', 'dark');
    expect(getSetting(db, 'theme')).toBe('dark');
  });

  it('set + get round-trips a number', () => {
    setSetting(db, 'soundVolume', 0.75);
    expect(getSetting(db, 'soundVolume')).toBe(0.75);
  });

  it('set + get round-trips a boolean', () => {
    setSetting(db, 'showVirtualKeyboard', true);
    expect(getSetting(db, 'showVirtualKeyboard')).toBe(true);
  });

  it('set + get round-trips an object (JSON)', () => {
    setSetting(db, 'accentColor', '#abcdef');
    expect(getSetting(db, 'accentColor')).toBe('#abcdef');
  });

  it('setSetting overwrites previous value', () => {
    setSetting(db, 'theme', 'dark');
    setSetting(db, 'theme', 'light');
    expect(getSetting(db, 'theme')).toBe('light');
  });

  it('loadAllSettings returns defaults when DB empty', () => {
    const loaded = loadAllSettings(db);
    expect(loaded).toEqual(DEFAULT_SETTINGS);
  });

  it('loadAllSettings merges DB values over defaults', () => {
    setSetting(db, 'theme', 'dark');
    setSetting(db, 'accentColor', '#ff0000');
    const loaded = loadAllSettings(db);
    expect(loaded.theme).toBe('dark');
    expect(loaded.accentColor).toBe('#ff0000');
    expect(loaded.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled);
  });

  it('saveAllSettings persists all keys', () => {
    const custom = { ...DEFAULT_SETTINGS, theme: 'dark', soundVolume: 0.9 };
    saveAllSettings(db, custom);
    const loaded = loadAllSettings(db);
    expect(loaded).toEqual(custom);
  });

  it('handles corrupt JSON gracefully', () => {
    db.prepare(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    ).run('theme', 'not-valid-json', Date.now());
    expect(getSetting(db, 'theme')).toBeUndefined();
  });
});
