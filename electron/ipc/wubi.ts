import { ipcMain } from 'electron';
import { getDatabase } from './db';
import { createLookup, type WubiLookup } from '../../src/lib/wubi/lookup';

let lookup: WubiLookup | null = null;

function getLookup(): WubiLookup {
  if (lookup) return lookup;
  lookup = createLookup(getDatabase());
  return lookup;
}

export function registerWubiIpc(): void {
  ipcMain.handle('wubi:lookupChar', (_evt, char: string) => {
    return getLookup().lookupChar(char) ?? null;
  });
  ipcMain.handle('wubi:lookupCode', (_evt, code: string) => {
    return getLookup().lookupCode(code);
  });
  ipcMain.handle('wubi:lookupWord', (_evt, word: string) => {
    return getLookup().lookupWord(word) ?? null;
  });
  ipcMain.handle('wubi:listCoreChars', (_evt, count: number) => {
    return getLookup().randomCoreChars(count);
  });
  ipcMain.handle('wubi:listCoreWords', (_evt, count: number) => {
    return getLookup().randomCoreWords(count);
  });
}
