import { ipcMain } from 'electron';
import { getDatabase } from './db';

interface KeyStatRow {
  key_char: string;
  total_presses: number;
  errors: number;
  error_rate: number;
  last_updated: number;
}

export type KeyStatsMap = Record<string, { totalPresses: number; errors: number }>;

export function registerKeyStatsIpc(): void {
  ipcMain.handle('keyStats:getAll', (): KeyStatRow[] => {
    const db = getDatabase();
    return db.prepare<[], KeyStatRow>('SELECT * FROM key_stats ORDER BY key_char').all();
  });

  ipcMain.handle('keyStats:update', (_evt, stats: KeyStatsMap): void => {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE key_stats
      SET total_presses = total_presses + ?,
          errors = errors + ?,
          error_rate = CAST(errors AS REAL) / CAST(MAX(total_presses, 1) AS REAL),
          last_updated = ?
      WHERE key_char = ?`);
    const now = Date.now();
    const tx = db.transaction(() => {
      for (const [keyChar, data] of Object.entries(stats)) {
        stmt.run(data.totalPresses, data.errors, now, keyChar);
      }
    });
    tx();
  });

  ipcMain.handle('keyStats:identifyWeak', (_evt, topN: number): string[] => {
    const db = getDatabase();
    const rows = db
      .prepare<
        [number],
        KeyStatRow
      >('SELECT * FROM key_stats WHERE total_presses >= 5 ORDER BY error_rate DESC LIMIT ?')
      .all(topN);
    return rows.map((r) => r.key_char);
  });
}
