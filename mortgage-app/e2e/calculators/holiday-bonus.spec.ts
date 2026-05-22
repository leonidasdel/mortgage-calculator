import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { HolidayBonus } from '../helpers/test-ids';

test.describe('Holiday bonus calculator', () => {
  test('shows net total for default gross salary', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/holiday-bonus');

    await calc.fill(HolidayBonus.inputGrossMonthly, 1500);

    const hero = calc.hero(HolidayBonus.heroNetTotal);
    await expect(hero).toContainText('€2,410.79', { timeout: 5000 });
  });
});
