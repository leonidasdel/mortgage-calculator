import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { Freelancer } from '../helpers/test-ids';

test.describe('Freelancer calculator', () => {
  test('updates net monthly when revenue changes', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/freelancer');

    const netHero = calc.hero(Freelancer.heroNetMonthly);
    const netBefore = await netHero.textContent();

    await calc.fill(Freelancer.inputAnnualRevenue, 60_000);
    await expect(netHero).not.toHaveText(netBefore ?? '');
    await expect(netHero).toContainText(/€[\d,]+\.\d{2}/);
  });
});
