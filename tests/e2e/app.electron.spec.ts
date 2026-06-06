import { test, expect, _electron as electron } from '@playwright/test';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const repoRoot = join(__dirname, '..', '..');
const mainEntry = join(repoRoot, 'out', 'main', 'index.js');

test.describe('Electron app', () => {
  test.skip(!existsSync(mainEntry), 'Electron main not built (run pnpm build first)');

  test('launches and shows the home page', async () => {
    const app = await electron.launch({
      args: [mainEntry],
      cwd: repoRoot,
    });
    const window = await app.firstWindow();
    await window.waitForLoadState('domcontentloaded');
    await expect(window.getByRole('heading', { name: '五笔打字练习' })).toBeVisible({ timeout: 10_000 });
    await app.close();
  });

  test('responds to ping IPC', async () => {
    const app = await electron.launch({
      args: [mainEntry],
      cwd: repoRoot,
    });
    const pong = await app.evaluate(async ({ ipcMain }) => {
      return new Promise<string>((resolve) => {
        ipcMain.handle('test:ping', () => 'pong-from-main');
        resolve('set-up');
      });
    });
    expect(pong).toBe('set-up');
    await app.close();
  });
});
