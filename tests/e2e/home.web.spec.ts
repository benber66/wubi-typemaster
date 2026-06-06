import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders all 4 mode cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '五笔打字练习' })).toBeVisible();
    await expect(page.getByText('文章跟打')).toBeVisible();
    await expect(page.getByText('Word Invaders')).toBeVisible();
    await expect(page.getByText('Bubble')).toBeVisible();
    await expect(page.getByText('KeyDrill')).toBeVisible();
  });

  test('shows the code-table size summary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('21,586')).toBeVisible();
    await expect(page.getByText('3,500')).toBeVisible();
  });

  test('navigates to Article page', async ({ page }) => {
    await page.goto('/');
    const articleCard = page.locator('[class*="group"]').filter({ hasText: '文章跟打' }).first();
    await articleCard.getByRole('button', { name: '开始' }).click();
    await expect(page.getByText('选择练习文本')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始练习' })).toBeVisible();
  });

  test('navigates to WordInvaders page', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('[class*="group"]').filter({ hasText: 'Word Invaders' }).first();
    await card.getByRole('button', { name: '开始' }).click();
    await expect(page.getByText('玩法')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始游戏' })).toBeVisible();
  });
});

test.describe('Settings page', () => {
  test('sidebar navigates to settings', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '设置' }).click();
    await expect(page.getByRole('heading', { name: '设置', level: 1 })).toBeVisible();
  });
});
