import { test, expect } from '@playwright/test';

test('Article error hint can be dismissed', async ({ page }) => {
  await page.goto('/');
  const articleCard = page.locator('[class*="group"]').filter({ hasText: '文章跟打' }).first();
  await articleCard.getByRole('button', { name: '开始' }).click();
  await page.getByRole('button', { name: '开始练习' }).click();
  await expect(page.getByText('进度')).toBeVisible();
  const textarea = page.locator('textarea[aria-label="五笔输入"]');
  await expect(textarea).toBeAttached();
  await textarea.evaluate((el) => {
    const ev = new CompositionEvent('compositionend', { data: 'xxx', bubbles: true });
    (el as HTMLTextAreaElement).dispatchEvent(ev);
  });
  const hint = page.locator('text=错字提示');
  await expect(hint).toBeVisible({ timeout: 3000 });
  const dismissBtn = page.locator('button[aria-label="关闭"]');
  await expect(dismissBtn).toBeVisible();
  await dismissBtn.click();
  await expect(hint).not.toBeVisible({ timeout: 1000 });
});

test('WordInvaders canvas is present (not white screen)', async ({ page }) => {
  await page.goto('/');
  const gameCard = page.locator('[class*="group"]').filter({ hasText: 'Word Invaders' }).first();
  await gameCard.getByRole('button', { name: '开始' }).click();
  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.getByText('得分')).toBeVisible({ timeout: 8000 });
  const canvas = page.locator('canvas');
  await expect(canvas).toBeAttached();
  await expect(canvas).toBeVisible();
});

test('Bubble canvas is present (not white screen)', async ({ page }) => {
  await page.goto('/');
  const bubbleCard = page.locator('[class*="group"]').filter({ hasText: 'Bubble' }).first();
  await bubbleCard.getByRole('button', { name: '开始' }).click();
  await page.getByRole('button', { name: '开始游戏' }).click();
  await expect(page.getByText('得分')).toBeVisible({ timeout: 8000 });
  const canvas = page.locator('canvas');
  await expect(canvas).toBeAttached();
  await expect(canvas).toBeVisible();
});