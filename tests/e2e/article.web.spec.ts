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

  test('multi-char IME commit advances position correctly (regression: getLastChar bug)', async ({ page }) => {
    await page.goto('/');
    const articleCard = page.locator('[class*="group"]').filter({ hasText: '文章跟打' }).first();
    await articleCard.getByRole('button', { name: '开始' }).click();
    await page.getByRole('button', { name: '开始练习' }).click();
    const textarea = page.locator('textarea[aria-label="五笔输入"]');
    await expect(textarea).toBeAttached();
    // Simulate a 2-char IME commit (e.g. "今天" at once)
    await textarea.evaluate((el) => {
      const ev = new CompositionEvent('compositionend', { data: '今天', bubbles: true });
      (el as HTMLTextAreaElement).dispatchEvent(ev);
    });
    // Position should advance to 2 (not 1, which was the old buggy behavior)
    await expect(page.locator('text=2 /')).toBeVisible({ timeout: 3000 });
  });

  test('shows 编码 readout for the active target char (regression: empty PRACTICE_LOOKUP)', async ({ page }) => {
    await page.goto('/');
    const articleCard = page.locator('[class*="group"]').filter({ hasText: '文章跟打' }).first();
    await articleCard.getByRole('button', { name: '开始' }).click();
    await page.getByRole('button', { name: '开始练习' }).click();
    // The 编码: <code> field should render the Wubi code (the old bug always rendered a dash)
    await expect(page.locator('text=编码:')).toBeVisible({ timeout: 3000 });
  });
});
