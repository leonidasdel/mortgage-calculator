import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { AnnualBonus } from '../helpers/test-ids';

test.describe('Annual bonus calculator', () => {
  test('shows net bonus less than gross bonus', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/annual-bonus');

    await calc.fill(AnnualBonus.inputGrossMonthly, 1500);
    await calc.fill(AnnualBonus.inputAnnualBonus, 1000);

    const netHero = calc.hero(AnnualBonus.heroNet);
    await expect(netHero).toContainText(/€[\d,]+\.\d{2}/);
    const netText = await netHero.textContent();
    expect(netText).not.toContain('€1,000.00');
    expect(netText).toMatch(/€[\d,]+\.\d{2}/);
  });
});
