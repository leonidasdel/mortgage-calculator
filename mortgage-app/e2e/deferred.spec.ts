import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';
import { ConsumerLoan, Mortgage, Savings } from './helpers/test-ids';

test.describe('Deferred content', () => {
  test('mortgage chart and schedule load on scroll', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/mortgage');

    await calc.scrollToDeferred(Mortgage.deferredChart);
    await expect(calc.get(Mortgage.deferredChart).locator('app-amortization-chart')).toBeVisible();

    await calc.scrollToDeferred(Mortgage.deferredSchedule);
    await expect(calc.get(Mortgage.deferredSchedule).locator('app-amortization-table')).toBeVisible();
  });

  test('consumer loan chart and schedule load on scroll', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/consumer-loan');

    await calc.scrollToDeferred(ConsumerLoan.deferredChart);
    await expect(calc.get(ConsumerLoan.deferredChart).locator('app-amortization-chart')).toBeVisible();

    await calc.scrollToDeferred(ConsumerLoan.deferredSchedule);
    await expect(calc.get(ConsumerLoan.deferredSchedule).locator('app-amortization-table')).toBeVisible();
  });

  test('savings chart loads on scroll', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/savings');

    await calc.scrollToDeferred(Savings.deferredChart);
    await expect(calc.get(Savings.deferredChart).locator('canvas')).toBeVisible();
  });
});
