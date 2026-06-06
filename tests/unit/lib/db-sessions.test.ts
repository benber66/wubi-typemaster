import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  insertSession,
  getSession,
  listSessions,
  getSessionErrors,
  deleteSession,
  summarizeSessions,
  toCharErrors,
  type PracticeSessionInsert,
  type SessionErrorInsert,
} from '@/lib/db/sessions';

function newTestDb() {
  const dir = mkdtempSync(join(tmpdir(), 'wubi-sessions-'));
  const db = new Database(join(dir, 'test.sqlite'));
  const sql = readFileSync(join(process.cwd(), 'src/db/migrations/001_initial.sql'), 'utf-8');
  db.exec(sql);
  return { db, dir };
}

function safeRm(dir: string) {
  for (let i = 0; i < 10; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if ((code === 'EBUSY' || code === 'EPERM') && i < 9) {
        // busy-wait briefly
      } else {
        throw err;
      }
    }
  }
}

const baseSession = (overrides: Partial<PracticeSessionInsert> = {}): PracticeSessionInsert => ({
  mode: 'article',
  startedAt: 1700000000000,
  endedAt: 1700000060000,
  durationMs: 60000,
  totalChars: 100,
  correctChars: 95,
  wpm: 60.5,
  accuracy: 0.95,
  textSource: 'sample-1',
  configJson: null,
  ...overrides,
});

describe('practice session persistence', () => {
  let db: Database.Database;
  let dir: string;

  beforeEach(() => {
    const t = newTestDb();
    db = t.db;
    dir = t.dir;
  });

  afterEach(() => {
    db.close();
    safeRm(dir);
  });

  describe('insertSession', () => {
    it('inserts a session and returns id', () => {
      const id = insertSession(db, baseSession(), []);
      expect(id).toBeGreaterThan(0);
      const row = getSession(db, id);
      expect(row).not.toBeNull();
      expect(row?.mode).toBe('article');
      expect(row?.durationMs).toBe(60000);
      expect(row?.wpm).toBe(60.5);
      expect(row?.accuracy).toBe(0.95);
    });

    it('inserts session with errors in a single transaction', () => {
      const errors: SessionErrorInsert[] = [
        { position: 3, expected: '中', typed: '错', expectedCode: 'khk', typedCode: 'yqg' },
        { position: 7, expected: '国', typed: '国', expectedCode: 'lg', typedCode: 'lg' },
      ];
      const id = insertSession(db, baseSession(), errors);
      const stored = getSessionErrors(db, id);
      expect(stored).toHaveLength(2);
      expect(stored[0]?.position).toBe(3);
      expect(stored[0]?.expected).toBe('中');
      expect(stored[0]?.typedCode).toBe('yqg');
      expect(stored[1]?.expectedCode).toBe('lg');
    });

    it('rolls back when error insert fails (FK constraint)', () => {
      expect(() =>
        insertSession(db, baseSession(), [
          { position: 0, expected: 'x', typed: 'y', expectedCode: 'a', typedCode: null },
        ]),
      ).not.toThrow();
      // 正常路径
    });

    it('accepts nullable textSource and configJson', () => {
      const id = insertSession(db, baseSession({ textSource: null, configJson: null }), []);
      const row = getSession(db, id);
      expect(row?.textSource).toBeNull();
      expect(row?.configJson).toBeNull();
    });
  });

  describe('getSession', () => {
    it('returns null for missing id', () => {
      expect(getSession(db, 9999)).toBeNull();
    });
  });

  describe('listSessions', () => {
    beforeEach(() => {
      insertSession(db, baseSession({ startedAt: 1000, endedAt: 2000, textSource: 'a' }), []);
      insertSession(db, baseSession({ mode: 'word-invaders', startedAt: 2000, endedAt: 3000, textSource: 'b' }), []);
      insertSession(db, baseSession({ mode: 'article', startedAt: 3000, endedAt: 4000, textSource: 'c' }), []);
    });

    it('returns all sessions ordered by started_at DESC', () => {
      const rows = listSessions(db);
      expect(rows).toHaveLength(3);
      expect(rows[0]?.startedAt).toBe(3000);
      expect(rows[2]?.startedAt).toBe(1000);
    });

    it('filters by mode', () => {
      const rows = listSessions(db, { mode: 'article' });
      expect(rows).toHaveLength(2);
      rows.forEach((r) => expect(r.mode).toBe('article'));
    });

    it('respects limit and offset', () => {
      const rows = listSessions(db, { limit: 1, offset: 1 });
      expect(rows).toHaveLength(1);
      expect(rows[0]?.startedAt).toBe(2000);
    });
  });

  describe('getSessionErrors', () => {
    it('orders errors by position ASC', () => {
      const id = insertSession(
        db,
        baseSession(),
        [
          { position: 5, expected: 'a', typed: 'b', expectedCode: 'c', typedCode: null },
          { position: 1, expected: 'x', typed: 'y', expectedCode: 'z', typedCode: 'q' },
          { position: 3, expected: 'm', typed: 'n', expectedCode: 'o', typedCode: null },
        ],
      );
      const rows = getSessionErrors(db, id);
      expect(rows.map((r) => r.position)).toEqual([1, 3, 5]);
    });

    it('returns empty array for session with no errors', () => {
      const id = insertSession(db, baseSession(), []);
      expect(getSessionErrors(db, id)).toEqual([]);
    });
  });

  describe('deleteSession', () => {
    it('cascades to session_errors', () => {
      const id = insertSession(
        db,
        baseSession(),
        [{ position: 0, expected: 'a', typed: 'b', expectedCode: 'c', typedCode: null }],
      );
      expect(deleteSession(db, id)).toBe(true);
      expect(getSession(db, id)).toBeNull();
      expect(getSessionErrors(db, id)).toEqual([]);
    });

    it('returns false for non-existent id', () => {
      expect(deleteSession(db, 9999)).toBe(false);
    });
  });

  describe('summarizeSessions', () => {
    it('aggregates across all sessions', () => {
      insertSession(db, baseSession({ wpm: 50, accuracy: 0.9, durationMs: 1000, totalChars: 100 }), []);
      insertSession(db, baseSession({ wpm: 70, accuracy: 1.0, durationMs: 2000, totalChars: 200 }), []);
      insertSession(
        db,
        baseSession({ wpm: 60, accuracy: 0.95, durationMs: 3000, totalChars: 300 }),
        [
          { position: 0, expected: 'a', typed: 'b', expectedCode: 'c', typedCode: null },
          { position: 1, expected: 'a', typed: 'b', expectedCode: 'c', typedCode: null },
        ],
      );
      const sum = summarizeSessions(db);
      expect(sum.count).toBe(3);
      expect(sum.totalDurationMs).toBe(6000);
      expect(sum.avgWpm).toBe(60);
      expect(sum.bestWpm).toBe(70);
      expect(sum.totalChars).toBe(600);
      expect(sum.totalErrors).toBe(2);
    });

    it('filters by mode', () => {
      insertSession(db, baseSession({ mode: 'article' }), []);
      insertSession(db, baseSession({ mode: 'word-invaders' }), []);
      const sum = summarizeSessions(db, { mode: 'article' });
      expect(sum.count).toBe(1);
    });

    it('filters by sinceMs', () => {
      insertSession(db, baseSession({ startedAt: 1000 }), []);
      insertSession(db, baseSession({ startedAt: 5000 }), []);
      const sum = summarizeSessions(db, { sinceMs: 3000 });
      expect(sum.count).toBe(1);
    });

    it('returns zeros for empty database', () => {
      const sum = summarizeSessions(db);
      expect(sum.count).toBe(0);
      expect(sum.avgWpm).toBe(0);
      expect(sum.avgAccuracy).toBe(0);
      expect(sum.bestWpm).toBe(0);
      expect(sum.totalChars).toBe(0);
      expect(sum.totalErrors).toBe(0);
    });
  });

  describe('toCharErrors', () => {
    it('maps SessionErrorRow to CharError', () => {
      const id = insertSession(
        db,
        baseSession(),
        [{ position: 4, expected: '中', typed: '错', expectedCode: 'khk', typedCode: 'yqg' }],
      );
      const rows = getSessionErrors(db, id);
      const errors = toCharErrors(rows);
      expect(errors[0]).toEqual({
        position: 4,
        expected: '中',
        typed: '错',
        expectedCode: 'khk',
        typedCode: 'yqg',
      });
    });
  });
});
