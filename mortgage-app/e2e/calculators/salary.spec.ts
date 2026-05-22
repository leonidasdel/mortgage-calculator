import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { Salary } from '../helpers/test-ids';

test.describe('Salary calculator', () => {
  test('updates net salary when gross changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/salary');

    const netHero = calc.hero(Salary.heroNet);
    const netBefore = await netHero.textContent();
    await calc.fill(Salary.inputGrossMonthly, 2000);

    await expect(netHero).not.toHaveText(netBefore ?? '');
    await expect(netHero).toContainText(/€[\d,]+\.\d{2}/);
  });
});
