import { test, expect } from '@playwright/test';

test.describe('Article page', () => {
  test('navigates from home and shows text selection on idle', async ({ page }) => {
    await page.goto('/');
    const articleCard = page.locator('[class*="group"]').filter({ hasText: '文章跟打' }).first();
    await articleCard.getByRole('button', { name: '开始' }).click();
    await expect(page.getByText('选择练习文本')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始练习' })).toBeVisible();
  });

  test('starts practice when 开始练习 is clicked', async ({ page }) => {
    await page.goto('/');
    const articleCard = page.locator('[class*="group"]').filter({ hasText: '文章跟打' }).first();
    await articleCard.getByRole('button', { name: '开始' }).click();
    await page.getByRole('button', { name: '开始练习' }).click();
    await expect(page.getByText('进度')).toBeVisible();
    await expect(page.getByText('WPM')).toBeVisible();
    await expect(page.getByText('准确率')).toBeVisible();
    await expect(page.getByRole('button', { name: '重新开始' })).toBeVisible();
  });
});
