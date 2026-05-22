import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { UnusedLeave } from '../helpers/test-ids';

test.describe('Unused leave calculator', () => {
  test('updates net compensation when unused days change', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/unused-leave');

    const netHero = calc.hero(UnusedLeave.heroNet);
    const netBefore = await netHero.textContent();

    await calc.fill(UnusedLeave.inputUnusedDays, 5);
    await expect(netHero).not.toHaveText(netBefore ?? '');
    await expect(netHero).toContainText(/€[\d,]+\.\d{2}/);
  });
});
