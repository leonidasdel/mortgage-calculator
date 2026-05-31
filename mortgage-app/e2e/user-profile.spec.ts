import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';
import { Salary } from './helpers/test-ids';

test.describe('User financial profile', () => {
  test('salary profile pre-fills freelancer children when freelancer has no saved state', async ({
    page,
  }) => {
    const calc = new CalculatorPage(page);

    await page.goto('/salary');
    await calc.fill(Salary.inputGrossMonthly, 2800);
    await page.getByTestId(Salary.inputChildren).selectOption('2');
    await page.waitForTimeout(300);

    await page.evaluate(() => {
      localStorage.removeItem('freelancerCalcState');
    });

    await page.goto('/freelancer');
    await expect(page.locator('#children')).toHaveValue('2');
  });
});
