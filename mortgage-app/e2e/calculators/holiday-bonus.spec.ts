import { test, expect } from '@playwright/test';
import { CalculatorPage } from '../helpers/calculator.page';
import { golden } from '../helpers/golden';
import { formatEuro } from '../helpers/money';
import { HolidayBonus } from '../helpers/test-ids';

test.describe('Holiday bonus calculator', () => {
  test('shows net total for default gross salary', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/holiday-bonus');

    await calc.fill(HolidayBonus.inputGrossMonthly, 1500);

    await expect(calc.hero(HolidayBonus.heroNetTotal)).toContainText(
      formatEuro(golden.holidayBonus.gross1500.totalNet),
      { timeout: 5000 },
    );
  });
});
