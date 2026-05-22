import { test, expect } from '@playwright/test';
import { CalculatorPage } from './helpers/calculator.page';
import { ConsumerLoan, ExportRow, Mortgage, Salary } from './helpers/test-ids';

test.describe('Share URL round-trip', () => {
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('consumer loan restores loan amount from share link', async ({ page, context }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/consumer-loan');

    await calc.fill(ConsumerLoan.inputLoanAmount, 7500);
    await page.getByTestId(ExportRow.shareLink).click();

    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(shareUrl).toContain('loanAmount=7500');

    await page.goto(shareUrl);
    await expect(calc.get(ConsumerLoan.inputLoanAmount)).toHaveValue('7500');
  });

  test('salary restores gross monthly from share link', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/salary');

    await calc.fill(Salary.inputGrossMonthly, 2200);
    await page.getByTestId(Salary.taxDetailsToggle).click();
    await page.getByTestId(ExportRow.shareLink).scrollIntoViewIfNeeded();
    await page.getByTestId(ExportRow.shareLink).click();

    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(shareUrl).toContain('grossMonthly=2200');

    await page.goto(shareUrl);
    await expect(calc.get(Salary.inputGrossMonthly)).toHaveValue('2200');
  });

  test('mortgage restores loan amount from share link', async ({ page }) => {
    const calc = new CalculatorPage(page);
    await page.goto('/mortgage');

    await calc.fill(Mortgage.inputLoanAmount, 85000);
    await page.getByTestId(ExportRow.shareLink).click();

    const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
    expect(shareUrl).toContain('loanAmount=85000');

    await page.goto(shareUrl);
    await expect(calc.get(Mortgage.inputLoanAmount)).toHaveValue('85000');
  });
});
