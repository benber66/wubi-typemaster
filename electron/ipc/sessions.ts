import { ipcMain } from 'electron';
import {
  insertSession,
  listSessions,
  getSessionErrors,
  summarizeSessions,
  deleteSession,
  toCharErrors,
  type SessionMode,
  type PracticeSessionInsert,
  type SessionErrorInsert,
} from '../../src/lib/db/sessions';
import { getDatabase } from './db';

export function registerSessionIpc(): void {
  ipcMain.handle(
    'sessions:insert',
    (_evt, session: PracticeSessionInsert, errors: ReadonlyArray<SessionErrorInsert>): number =>
      insertSession(getDatabase(), session, errors),
  );
  ipcMain.handle('sessions:list', (_evt, mode?: SessionMode, limit?: number) =>
    listSessions(getDatabase(), { mode, limit }),
  );
  ipcMain.handle('sessions:errors', (_evt, sessionId: number) =>
    toCharErrors(getSessionErrors(getDatabase(), sessionId)),
  );
  ipcMain.handle('sessions:summary', (_evt, mode?: SessionMode) =>
    summarizeSessions(getDatabase(), { mode }),
  );
  ipcMain.handle('sessions:delete', (_evt, id: number) => deleteSession(getDatabase(), id));
}
