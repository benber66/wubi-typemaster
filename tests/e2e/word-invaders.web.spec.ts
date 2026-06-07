import { test, expect } from '@playwright/test';

test.describe('WordInvaders page', () => {
  test('navigates from home and shows game description', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('[class*="group"]').filter({ hasText: 'Word Invaders' }).first();
    await card.getByRole('button', { name: '开始' }).click();
    await expect(page.getByText('玩法')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
  });

  test('starts game when 开始游戏 clicked', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('[class*="group"]').filter({ hasText: 'Word Invaders' }).first();
    await card.getByRole('button', { name: '开始' }).click();
    await page.getByRole('button', { name: '开始游戏' }).click();
    await expect(page.locator('text=得分').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=漏掉').first()).toBeVisible();
    await expect(page.locator('text=WPM').first()).toBeVisible();
  });

  test('only one Pixi canvas is rendered (regression: strict-mode double-init)', async ({
    page,
  }) => {
    await page.goto('/');
    const card = page.locator('[class*="group"]').filter({ hasText: 'Word Invaders' }).first();
    await card.getByRole('button', { name: '开始' }).click();
    await page.getByRole('button', { name: '开始游戏' }).click();
    await expect(page.locator('text=得分').first()).toBeVisible({ timeout: 10_000 });
    const canvasCount = await page.locator('div.rounded-md.border canvas').count();
    expect(canvasCount).toBe(1);
  });
});
