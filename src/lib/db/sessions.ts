import type { Database } from 'better-sqlite3';
import type { CharError } from '@/lib/typing/metrics';

export type SessionMode = 'article' | 'word-invaders' | 'bubble' | 'key-drill';

export interface PracticeSessionRow {
  id: number;
  mode: SessionMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  totalChars: number;
  correctChars: number;
  wpm: number;
  accuracy: number;
  textSource: string | null;
  configJson: string | null;
}

export interface PracticeSessionInsert {
  mode: SessionMode;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  totalChars: number;
  correctChars: number;
  wpm: number;
  accuracy: number;
  textSource?: string | null;
  configJson?: string | null;
}

export interface SessionErrorRow {
  id: number;
  sessionId: number;
  position: number;
  expected: string;
  typed: string;
  expectedCode: string;
  typedCode: string | null;
  createdAt: number;
}

export interface SessionErrorInsert {
  position: number;
  expected: string;
  typed: string;
  expectedCode: string;
  typedCode?: string | null;
}

function rowToSession(row: Record<string, unknown>): PracticeSessionRow {
  return {
    id: row.id as number,
    mode: row.mode as SessionMode,
    startedAt: row.started_at as number,
    endedAt: row.ended_at as number,
    durationMs: row.duration_ms as number,
    totalChars: row.total_chars as number,
    correctChars: row.correct_chars as number,
    wpm: row.wpm as number,
    accuracy: row.accuracy as number,
    textSource: (row.text_source as string | null) ?? null,
    configJson: (row.config_json as string | null) ?? null,
  };
}

function rowToError(row: Record<string, unknown>): SessionErrorRow {
  return {
    id: row.id as number,
    sessionId: row.session_id as number,
    position: row.position as number,
    expected: row.expected as string,
    typed: row.typed as string,
    expectedCode: row.expected_code as string,
    typedCode: (row.typed_code as string | null) ?? null,
    createdAt: row.created_at as number,
  };
}

/**
 * 插入一条练习会话及其错字明细，原子事务。
 * 返回新建 session id。
 */
export function insertSession(
  db: Database,
  session: PracticeSessionInsert,
  errors: ReadonlyArray<SessionErrorInsert>,
): number {
  const insertSession = db.prepare(
    `INSERT INTO practice_sessions
       (mode, started_at, ended_at, duration_ms, total_chars, correct_chars, wpm, accuracy, text_source, config_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertError = db.prepare(
    `INSERT INTO session_errors
       (session_id, position, expected, typed, expected_code, typed_code)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const tx = db.transaction(() => {
    const result = insertSession.run(
      session.mode,
      session.startedAt,
      session.endedAt,
      session.durationMs,
      session.totalChars,
      session.correctChars,
      session.wpm,
      session.accuracy,
      session.textSource ?? null,
      session.configJson ?? null,
    );
    const sessionId = result.lastInsertRowid as number;
    for (const e of errors) {
      insertError.run(sessionId, e.position, e.expected, e.typed, e.expectedCode, e.typedCode ?? null);
    }
    return sessionId;
  });

  return tx();
}

export function getSession(db: Database, id: number): PracticeSessionRow | null {
  const row = db
    .prepare<[number], Record<string, unknown>>('SELECT * FROM practice_sessions WHERE id = ?')
    .get(id);
  return row ? rowToSession(row) : null;
}

export function listSessions(
  db: Database,
  options: { mode?: SessionMode; limit?: number; offset?: number } = {},
): PracticeSessionRow[] {
  const { mode, limit = 50, offset = 0 } = options;
  let sql = 'SELECT * FROM practice_sessions';
  const params: (string | number)[] = [];
  if (mode) {
    sql += ' WHERE mode = ?';
    params.push(mode);
  }
  sql += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  const rows = db.prepare<typeof params, Record<string, unknown>>(sql).all(...params);
  return rows.map(rowToSession);
}

export function getSessionErrors(db: Database, sessionId: number): SessionErrorRow[] {
  const rows = db
    .prepare<[number], Record<string, unknown>>(
      'SELECT * FROM session_errors WHERE session_id = ? ORDER BY position ASC',
    )
    .all(sessionId);
  return rows.map(rowToError);
}

export function deleteSession(db: Database, id: number): boolean {
  const result = db.prepare('DELETE FROM practice_sessions WHERE id = ?').run(id);
  return result.changes > 0;
}

export interface SessionSummary {
  count: number;
  totalDurationMs: number;
  avgWpm: number;
  avgAccuracy: number;
  bestWpm: number;
  totalChars: number;
  totalErrors: number;
}

export function summarizeSessions(
  db: Database,
  options: { mode?: SessionMode; sinceMs?: number } = {},
): SessionSummary {
  const { mode, sinceMs } = options;
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (mode) {
    where.push('mode = ?');
    params.push(mode);
  }
  if (sinceMs !== undefined) {
    where.push('started_at >= ?');
    params.push(sinceMs);
  }
  const whereSql = where.length > 0 ? ` WHERE ${where.join(' AND ')}` : '';
  const row = db
    .prepare<typeof params, Record<string, unknown>>(
      `SELECT
         COUNT(*) as count,
         COALESCE(SUM(duration_ms), 0) as total_duration_ms,
         COALESCE(AVG(wpm), 0) as avg_wpm,
         COALESCE(AVG(accuracy), 0) as avg_accuracy,
         COALESCE(MAX(wpm), 0) as best_wpm,
         COALESCE(SUM(total_chars), 0) as total_chars
       FROM practice_sessions${whereSql}`,
    )
    .get(...params) as Record<string, unknown>;

  const errorsRow = db
    .prepare<typeof params, { total: number }>(
      `SELECT COALESCE(COUNT(*), 0) as total
       FROM session_errors se
       INNER JOIN practice_sessions ps ON se.session_id = ps.id${whereSql}`,
    )
    .get(...params) as { total: number };

  return {
    count: row.count as number,
    totalDurationMs: row.total_duration_ms as number,
    avgWpm: Number((row.avg_wpm as number).toFixed(2)),
    avgAccuracy: Number((row.avg_accuracy as number).toFixed(4)),
    bestWpm: row.best_wpm as number,
    totalChars: row.total_chars as number,
    totalErrors: errorsRow.total,
  };
}

export function toCharErrors(rows: ReadonlyArray<SessionErrorRow>): CharError[] {
  return rows.map((r) => ({
    position: r.position,
    expected: r.expected,
    typed: r.typed,
    expectedCode: r.expectedCode,
    typedCode: r.typedCode,
  }));
}
