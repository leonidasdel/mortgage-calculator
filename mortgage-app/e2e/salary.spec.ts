import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';

test.describe('Salary calculator', () => {
  test('updates net salary when gross changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/salary');

    const netHero = page.locator('.salary-hero.net .hero-val');
    const netBefore = await netHero.textContent();
    await calc.fillNumber('grossMonthly', 5000);

    await expect(netHero).not.toHaveText(netBefore ?? '');
    await expect(netHero).toContainText(/€[\d,]+\.\d{2}/);
  });
});
